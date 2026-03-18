/**
 * Preset export per allineamento a flussi contabili italiani (CSV separatore ;, decimali con virgola).
 * Template dedicati TeamSystem / Profis / Ipsoa richiedono tracciati ufficiali o file campione dal commercialista.
 */
export type ExportCsvPreset = 'generic' | 'accounting_it';

export function formatEuroIt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return '';
  const v = Number(n);
  return v.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** CSV riga con separatore ; e virgolette dove serve */
export function rowToSemicolonCsv(cells: string[]): string {
  return cells
    .map((c) => {
      const s = String(c ?? '');
      if (/[;"\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    })
    .join(';');
}
