/** Mappa tipo documento (valore interno) → etichetta in italiano per l'UI */
export const DOC_TYPE_LABELS: Record<string, string> = {
  invoice: 'Fattura',
  receipt: 'Scontrino',
  bank: 'Banca',
  utility: 'Utility',
  other: 'Altro',
};

/** Opzioni per select: value (salvato in DB) e label (mostrata in italiano) */
export const DOC_TYPE_OPTIONS = [
  { value: 'invoice', label: 'Fattura' },
  { value: 'receipt', label: 'Scontrino' },
  { value: 'bank', label: 'Banca' },
  { value: 'utility', label: 'Utility' },
  { value: 'other', label: 'Altro' },
] as const;

/**
 * Restituisce l'etichetta italiana per il tipo documento.
 * Se il tipo non è nella mappa (es. valore custom o null), restituisce il valore o '—'.
 */
export function getDocTypeLabel(docType: string | null | undefined): string {
  if (docType == null || docType === '') return '—';
  return DOC_TYPE_LABELS[docType] ?? docType;
}
