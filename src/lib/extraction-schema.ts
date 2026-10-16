import { z } from 'zod';

/**
 * Converte in numero un valore restituito dall'AI. Accetta numeri e stringhe
 * semplici ("69.00", "69,00"); tutto ciò che è ambiguo diventa null, così il
 * documento va in revisione invece di contenere un importo inventato.
 */
function toLooseNumber(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[\s€]/g, '');
    // Solo formati non ambigui: un unico separatore decimale, nessun separatore delle migliaia.
    if (!/^-?\d+([.,]\d+)?$/.test(cleaned)) return null;
    return Number(cleaned.replace(',', '.'));
  }
  return value;
}

const nullableString = z.string().nullable().catch(null);
const nullableNumber = z.preprocess(toLooseNumber, z.number().finite().nullable()).catch(null);

/**
 * Schema tollerante: se l'AI omette un campo o lo restituisce nel formato sbagliato,
 * quel campo diventa null (o confidenza 0) invece di far fallire l'intera estrazione.
 */
export const extractionJsonSchema = z.object({
  doc_type: z.enum(['invoice', 'receipt', 'bank', 'utility', 'other']).nullable().catch(null),
  vendor_name: nullableString,
  vendor_vat: nullableString,
  doc_number: nullableString,
  doc_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .catch(null),
  net_amount: nullableNumber,
  vat_amount: nullableNumber,
  total_amount: nullableNumber,
  currency: nullableString,
  notes: nullableString,
  confidence: z.preprocess(toLooseNumber, z.number().min(0).max(1)).catch(0),
});

export type ExtractionJson = z.infer<typeof extractionJsonSchema>;

export const EMPTY_EXTRACTION: ExtractionJson = {
  doc_type: null,
  vendor_name: null,
  vendor_vat: null,
  doc_number: null,
  doc_date: null,
  net_amount: null,
  vat_amount: null,
  total_amount: null,
  currency: null,
  notes: null,
  confidence: 0,
};

/** Converte la risposta grezza dell'AI in un'estrazione valida, senza mai lanciare errori. */
export function parseExtraction(raw: string): ExtractionJson {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return EMPTY_EXTRACTION;
  }
  const result = extractionJsonSchema.safeParse(parsed);
  return result.success ? result.data : EMPTY_EXTRACTION;
}

// Italian VAT (P.IVA): 11 digits
export function isValidItalianVat(vat: string | null): boolean {
  if (!vat) return true;
  const digits = vat.replace(/\D/g, '');
  return digits.length === 11;
}

// Tolerance for net + vat ≈ total (EUR)
const AMOUNT_TOLERANCE = 0.02;
export function amountsConsistent(
  net: number | null,
  vat: number | null,
  total: number | null
): boolean {
  if (net == null || vat == null || total == null) return true;
  const sum = net + vat;
  return Math.abs(sum - total) <= AMOUNT_TOLERANCE;
}

/**
 * Su alcuni scontrini l'AI restituisce i centesimi (6900 invece di 69,00).
 * Non correggiamo in automatico, perché uno scontrino da 1.200 € è legittimo:
 * segnaliamo il dubbio e il documento va in revisione.
 */
export function looksLikeCentsError(extracted: ExtractionJson): boolean {
  if (extracted.doc_type !== 'receipt') return false;
  const n = extracted.total_amount;
  return n != null && Number.isInteger(n) && n >= 1000 && n % 100 === 0;
}

/** Elenco dei problemi che mandano un documento in revisione. */
export function extractionIssues(extracted: ExtractionJson): string[] {
  const issues: string[] = [];
  if (extracted.confidence < 0.4) {
    issues.push('Confidenza bassa: verificare i campi.');
  }
  if (extracted.vendor_vat && !isValidItalianVat(extracted.vendor_vat)) {
    issues.push('P.IVA fornitore non valida (attese 11 cifre per Italia).');
  }
  if (!amountsConsistent(extracted.net_amount, extracted.vat_amount, extracted.total_amount)) {
    issues.push('Imponibile + IVA non coerenti con il totale.');
  }
  if (looksLikeCentsError(extracted)) {
    issues.push(
      'Totale sospetto: potrebbe essere espresso in centesimi (es. 6900 invece di 69,00). Verificare.'
    );
  }
  return issues;
}
