import { z } from 'zod';

export const extractionJsonSchema = z.object({
  doc_type: z.enum(['invoice', 'receipt', 'bank', 'utility', 'other']).nullable(),
  vendor_name: z.string().nullable(),
  vendor_vat: z.string().nullable(),
  doc_number: z.string().nullable(),
  doc_date: z.string().nullable(),
  net_amount: z.number().nullable(),
  vat_amount: z.number().nullable(),
  total_amount: z.number().nullable(),
  currency: z.string().nullable(),
  notes: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});

export type ExtractionJson = z.infer<typeof extractionJsonSchema>;

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
