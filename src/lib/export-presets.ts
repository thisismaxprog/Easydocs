/**
 * Preset export per allineamento a flussi contabili italiani.
 * I template TeamSystem / Danea / Zucchetti riproducono i tracciati CSV
 * documentati pubblicamente; per la piena compatibilità richiedere un file
 * campione di import dallo studio e allineare codici conto / causale.
 */

export type ExportCsvPreset =
  | 'generic'
  | 'accounting_it'
  | 'teamsystem'
  | 'danea'
  | 'zucchetti';

export interface PresetMeta {
  value: ExportCsvPreset;
  label: string;
  description: string;
}

export const EXPORT_PRESET_META: PresetMeta[] = [
  {
    value: 'generic',
    label: 'Easydocs (generico)',
    description: 'CSV standard con virgola, numeri in formato internazionale.',
  },
  {
    value: 'accounting_it',
    label: 'Gestionale IT (generico)',
    description: 'CSV con separatore ; e importi in formato italiano (es. 1.234,56).',
  },
  {
    value: 'teamsystem',
    label: 'TeamSystem',
    description: 'Tracciato registro IVA acquisti/vendite per import in TeamSystem Contabilità.',
  },
  {
    value: 'danea',
    label: 'Danea Easyfatt',
    description: 'Tracciato fatture/ricevute compatibile con l\'import CSV di Danea Easyfatt.',
  },
  {
    value: 'zucchetti',
    label: 'Zucchetti',
    description: 'Tracciato registro documenti per import in Zucchetti Ad Hoc / Infinity.',
  },
];

/** Formatta un numero come importo in valuta italiana: 1234.5 → "1.234,50" */
export function formatEuroIt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return '';
  return Number(n).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Converte data ISO (YYYY-MM-DD) in formato italiano (DD/MM/YYYY) */
export function formatDateIt(isoDate: string | null | undefined): string {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

/** Calcola aliquota IVA in % (intero) da imponibile e imposta */
export function computeVatRate(net: number | null, vat: number | null): string {
  if (net == null || vat == null || net === 0) return '';
  const rate = Math.round((vat / net) * 100);
  return String(rate);
}

/** CSV riga con separatore ; e virgolette dove serve */
export function rowToSemicolonCsv(cells: (string | null | undefined)[]): string {
  return cells
    .map((c) => {
      const s = String(c ?? '');
      if (/[;"\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    })
    .join(';');
}

// ── Mappature tipo documento per gestionale ──────────────────────────────────

const TS_DOC_TYPE: Record<string, string> = {
  invoice: 'Fattura',
  receipt: 'Ricevuta/Scontrino',
  bank: 'Estratto conto',
  utility: 'Bolletta',
  other: 'Altro',
};

const DANEA_DOC_TYPE: Record<string, string> = {
  invoice: 'Fattura',
  receipt: 'Ricevuta fiscale',
  bank: 'Estratto conto',
  utility: 'Bolletta',
  other: 'Altro',
};

const ZUCCHETTI_DOC_TYPE: Record<string, string> = {
  invoice: 'FATT',
  receipt: 'RIC',
  bank: 'BANCA',
  utility: 'UTIL',
  other: 'ALTRO',
};

export function docTypeForTeamSystem(t: string | null | undefined): string {
  return TS_DOC_TYPE[t ?? ''] ?? 'Altro';
}

export function docTypeForDanea(t: string | null | undefined): string {
  return DANEA_DOC_TYPE[t ?? ''] ?? 'Altro';
}

export function docTypeForZucchetti(t: string | null | undefined): string {
  return ZUCCHETTI_DOC_TYPE[t ?? ''] ?? 'ALTRO';
}
