import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentFirmId } from '@/lib/get-firm-id';
import { getDocTypeLabel } from '@/lib/doc-type-labels';
import {
  formatEuroIt,
  formatDateIt,
  computeVatRate,
  rowToSemicolonCsv,
  docTypeForTeamSystem,
  docTypeForDanea,
  docTypeForZucchetti,
  type ExportCsvPreset,
} from '@/lib/export-presets';

type ExtractedJson = {
  net_amount?: number | null;
  vat_amount?: number | null;
  vendor_vat?: string | null;
};

type DocRow = {
  id: string;
  filename: string | null;
  doc_type: string | null;
  doc_date: string | null;
  doc_number: string | null;
  total: number | null;
  status: string | null;
  clients: { name?: string; vat_number?: string } | null;
  extractions: { extracted_json?: ExtractedJson } | null;
};

/** Restituisce imponibile, IVA e aliquota per un documento */
function getAmounts(doc: DocRow): { net: number | null; vat: number | null; vatRate: string } {
  const ext = doc.extractions?.extracted_json;
  const net = ext?.net_amount ?? null;
  const vat = ext?.vat_amount ?? null;
  return { net, vat, vatRate: computeVatRate(net, vat) };
}

function csvResponse(content: string, filename: string): NextResponse {
  return new NextResponse('\uFEFF' + content, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const clientId = searchParams.get('client_id') ?? 'all';
  const onlyApproved = searchParams.get('only_approved') !== 'false';
  const preset = (searchParams.get('preset') ?? 'generic') as ExportCsvPreset;

  if (!month) {
    return new NextResponse('Parametro month richiesto', { status: 400 });
  }

  const firmId = await getCurrentFirmId();
  if (!firmId) {
    return new NextResponse('Non autorizzato', { status: 401 });
  }

  const supabase = await createClient();
  const [start, end] = [
    `${month}-01`,
    new Date(new Date(month + '-01').getFullYear(), new Date(month + '-01').getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10),
  ];

  let query = supabase
    .from('documents')
    .select(
      'id, filename, doc_type, doc_date, doc_number, total, status, clients(name, vat_number), extractions(extracted_json)'
    )
    .eq('firm_id', firmId)
    .gte('doc_date', start)
    .lte('doc_date', end);

  if (onlyApproved) query = query.eq('status', 'approved');
  if (clientId !== 'all') query = query.eq('client_id', clientId);

  const { data, error } = await query.order('doc_date');
  if (error) return new NextResponse(error.message, { status: 500 });

  const docs = (data ?? []) as DocRow[];

  // ── TeamSystem ─────────────────────────────────────────────────────────────
  if (preset === 'teamsystem') {
    const header = [
      'Data', 'N.Documento', 'Tipo Doc.', 'Fornitore/Cliente',
      'P.IVA', 'Imponibile', 'Aliq.IVA%', 'Imposta IVA', 'Totale', 'Note',
      ...(onlyApproved ? [] : ['Stato']),
    ];
    const lines = [
      rowToSemicolonCsv(header),
      ...docs.map((d) => {
        const c = d.clients;
        const { net, vat, vatRate } = getAmounts(d);
        return rowToSemicolonCsv([
          formatDateIt(d.doc_date),
          d.doc_number ?? '',
          docTypeForTeamSystem(d.doc_type),
          c?.name ?? '',
          c?.vat_number ?? '',
          formatEuroIt(net ?? d.total),
          vatRate,
          formatEuroIt(vat),
          formatEuroIt(d.total),
          d.filename ?? '',
          ...(onlyApproved ? [] : [d.status ?? '']),
        ]);
      }),
    ];
    return csvResponse(lines.join('\r\n'), `export-${month}-teamsystem.csv`);
  }

  // ── Danea Easyfatt ─────────────────────────────────────────────────────────
  if (preset === 'danea') {
    const header = [
      'Tipo', 'Data', 'Numero', 'Denominazione',
      'Partita IVA', 'Imponibile', 'Aliquota IVA', 'Imposta IVA', 'Totale',
      ...(onlyApproved ? [] : ['Stato']),
    ];
    const lines = [
      rowToSemicolonCsv(header),
      ...docs.map((d) => {
        const c = d.clients;
        const { net, vat, vatRate } = getAmounts(d);
        return rowToSemicolonCsv([
          docTypeForDanea(d.doc_type),
          formatDateIt(d.doc_date),
          d.doc_number ?? '',
          c?.name ?? '',
          c?.vat_number ?? '',
          formatEuroIt(net ?? d.total),
          vatRate,
          formatEuroIt(vat),
          formatEuroIt(d.total),
          ...(onlyApproved ? [] : [d.status ?? '']),
        ]);
      }),
    ];
    return csvResponse(lines.join('\r\n'), `export-${month}-danea.csv`);
  }

  // ── Zucchetti ──────────────────────────────────────────────────────────────
  if (preset === 'zucchetti') {
    const header = [
      'DataDoc', 'NroDoc', 'TipoDoc', 'RagioneSociale',
      'PartitaIVA', 'Imponibile', 'AliqIVA', 'ImpIVA', 'Totale', 'Note',
      ...(onlyApproved ? [] : ['Stato']),
    ];
    const lines = [
      rowToSemicolonCsv(header),
      ...docs.map((d) => {
        const c = d.clients;
        const { net, vat, vatRate } = getAmounts(d);
        return rowToSemicolonCsv([
          formatDateIt(d.doc_date),
          d.doc_number ?? '',
          docTypeForZucchetti(d.doc_type),
          c?.name ?? '',
          c?.vat_number ?? '',
          formatEuroIt(net ?? d.total),
          vatRate,
          formatEuroIt(vat),
          formatEuroIt(d.total),
          d.filename ?? '',
          ...(onlyApproved ? [] : [d.status ?? '']),
        ]);
      }),
    ];
    return csvResponse(lines.join('\r\n'), `export-${month}-zucchetti.csv`);
  }

  // ── Gestionale IT generico ─────────────────────────────────────────────────
  if (preset === 'accounting_it') {
    const header = [
      'Data documento', 'Numero', 'Cliente', 'P.IVA', 'Tipo', 'File', 'Importo EUR',
      ...(onlyApproved ? [] : ['Stato']),
    ];
    const lines = [
      rowToSemicolonCsv(header),
      ...docs.map((d) => {
        const c = d.clients;
        return rowToSemicolonCsv([
          d.doc_date ?? '',
          d.doc_number ?? '',
          c?.name ?? '',
          c?.vat_number ?? '',
          getDocTypeLabel(d.doc_type),
          d.filename ?? '',
          formatEuroIt(d.total),
          ...(onlyApproved ? [] : [d.status ?? '']),
        ]);
      }),
    ];
    return csvResponse(lines.join('\r\n'), `export-${month}-contabilita-it.csv`);
  }

  // ── Generico (virgola) ─────────────────────────────────────────────────────
  const rows = [
    ['Filename', 'Cliente', 'P.IVA', 'Tipo', 'Data', 'N. doc', 'Totale', ...(onlyApproved ? [] : ['Stato'])],
    ...docs.map((d) => {
      const c = d.clients;
      return [
        d.filename ?? '',
        c?.name ?? '',
        c?.vat_number ?? '',
        getDocTypeLabel(d.doc_type),
        d.doc_date ?? '',
        d.doc_number ?? '',
        d.total != null ? String(d.total) : '',
        ...(onlyApproved ? [] : [d.status ?? '']),
      ];
    }),
  ];

  const csv = rows
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  return new NextResponse('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="export-${month}.csv"`,
    },
  });
}
