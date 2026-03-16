import OpenAI from 'openai';
import { extractionJsonSchema, type ExtractionJson } from '@/lib/extraction-schema';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const SYSTEM_PROMPT = `Sei un assistente che estrae dati da documenti contabili italiani: FATTURE e SCONTRINI.
Rispondi SOLO con un JSON valido, senza markdown né testo aggiuntivo.

Tipi di documento:
- "invoice" = fattura (con numero fattura, cliente/fornitore, imponibile, IVA, totale)
- "receipt" = scontrino o ricevuta (data, totale, eventuale numero)
- "other" = altro solo se proprio non è né fattura né scontrino

Schema da rispettare:
{
  "doc_type": "invoice" | "receipt" | "bank" | "utility" | "other" | null,
  "vendor_name": string | null (ragione sociale del fornitore/emittente),
  "vendor_vat": string | null (P.IVA fornitore, 11 cifre se Italia),
  "doc_number": string | null (numero fattura es. "2/FE", o numero scontrino se presente),
  "doc_date": "YYYY-MM-DD" | null (data documento: converti da GG/MM/AAAA in YYYY-MM-DD),
  "net_amount": number | null (imponibile, solo numeri),
  "vat_amount": number | null (IVA, solo numeri),
  "total_amount": number | null (totale documento: numero senza virgole/apici, es. 23800 per 23.800,00),
  "currency": "EUR" | null,
  "notes": string | null,
  "confidence": number (0-1)
}

Regole importanti:
- Per fatture: estrai sempre data, numero documento e totale quando visibili; doc_type = "invoice".
- Per scontrini: estrai almeno data e totale; doc_type = "receipt".
- Date italiane (es. 01/07/2024) → doc_date in formato "YYYY-MM-DD" (es. "2024-07-01").
- Importi: ignora apostrofi e virgole (es. 23'800,00 o 23.800,00 → total_amount: 23800).
- Se un campo non c’è proprio, usa null. confidence: 1 se lettura chiara, 0.5-0.8 se parziale o poco nitido.`;

export async function extractFromText(text: string): Promise<{
  data: ExtractionJson;
  raw: string;
}> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Estrai i dati dal seguente testo di un documento contabile:\n\n${text.slice(0, 12000)}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? '{}';
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { confidence: 0, doc_type: null, vendor_name: null, vendor_vat: null, doc_number: null, doc_date: null, net_amount: null, vat_amount: null, total_amount: null, currency: null, notes: null };
  }

  const data = extractionJsonSchema.parse(parsed) as ExtractionJson;
  return { data, raw };
}

/** Estrae dati da immagine (PNG/JPEG/WebP) con Vision API. */
export async function extractFromImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<{ data: ExtractionJson; raw: string }> {
  const base64 = imageBuffer.toString('base64');
  const mediaType = mimeType || 'image/png';
  const dataUrl = `data:${mediaType};base64,${base64}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Questa immagine è una FATTURA o uno SCONTRINO italiano. Estrai i dati nel JSON richiesto. In particolare: tipo (invoice/receipt), data in YYYY-MM-DD, numero documento se presente, totale come numero. Rispondi solo con il JSON, niente altro testo.',
          },
          {
            type: 'image_url',
            image_url: { url: dataUrl },
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 1024,
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? '{}';
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { confidence: 0, doc_type: null, vendor_name: null, vendor_vat: null, doc_number: null, doc_date: null, net_amount: null, vat_amount: null, total_amount: null, currency: null, notes: null };
  }

  const data = extractionJsonSchema.parse(parsed) as ExtractionJson;
  return { data, raw };
}
