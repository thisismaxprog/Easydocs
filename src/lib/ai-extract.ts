import OpenAI from 'openai';
import { extractionJsonSchema, type ExtractionJson } from '@/lib/extraction-schema';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const SYSTEM_PROMPT = `Sei un assistente che estrae dati da fatture e documenti contabili italiani.
Rispondi SOLO con un JSON valido, senza markdown né testo aggiuntivo.
Schema da rispettare:
{
  "doc_type": "invoice" | "receipt" | "bank" | "utility" | "other" | null,
  "vendor_name": string | null,
  "vendor_vat": string | null (P.IVA fornitore, 11 cifre se Italia),
  "doc_number": string | null (numero documento),
  "doc_date": "YYYY-MM-DD" | null,
  "net_amount": number | null (imponibile),
  "vat_amount": number | null (IVA),
  "total_amount": number | null (totale),
  "currency": "EUR" | null,
  "notes": string | null,
  "confidence": number (0-1, quanto sei sicuro dell'estrazione)
}
Se un campo non è presente o non riconoscibile, usa null. Per confidence usa 1 se tutto è chiaro, valori più bassi se il documento è parziale o ambiguo.`;

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
            text: 'Estrai i dati da questa immagine di un documento contabile (fattura, ricevuta, ecc.). Rispondi solo con il JSON.',
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
