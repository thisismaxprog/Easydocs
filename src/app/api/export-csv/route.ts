import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentFirmId } from '@/lib/get-firm-id';
import { getDocTypeLabel } from '@/lib/doc-type-labels';
import { formatEuroIt, rowToSemicolonCsv, type ExportCsvPreset } from '@/lib/export-presets';

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
    new Date(new Date(month + '-01').getFullYear(), new Date(month + '-01').getMonth() + 1, 0).toISOString().slice(0, 10),
  ];

  let query = supabase
    .from('documents')
    .select('id, filename, doc_type, doc_date, doc_number, total, status, clients(name, vat_number)')
    .eq('firm_id', firmId)
    .gte('doc_date', start)
    .lte('doc_date', end);

  if (onlyApproved) {
    query = query.eq('status', 'approved');
  }

  if (clientId !== 'all') {
    query = query.eq('client_id', clientId);
  }

  const { data: docs, error } = await query.order('doc_date');

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  if (preset === 'accounting_it') {
    const header = [
      'Data documento',
      'Numero',
      'Cliente',
      'P.IVA',
      'Tipo',
      'File',
      'Importo EUR',
      ...(onlyApproved ? [] : ['Stato']),
    ];
    const lines = [
      rowToSemicolonCsv(header),
      ...(docs ?? []).map((d) => {
        const c = d.clients as { name?: string; vat_number?: string } | null;
        return rowToSemicolonCsv([
          d.doc_date ?? '',
          d.doc_number ?? '',
          c?.name ?? '',
          c?.vat_number ?? '',
          getDocTypeLabel(d.doc_type),
          d.filename ?? '',
          formatEuroIt(d.total != null ? Number(d.total) : null),
          ...(onlyApproved ? [] : [d.status ?? '']),
        ]);
      }),
    ];
    const csv = lines.join('\r\n');
    const bom = '\uFEFF';
    return new NextResponse(bom + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="export-${month}-contabilita-it.csv"`,
      },
    });
  }

  const rows = [
    ['Filename', 'Cliente', 'P.IVA', 'Tipo', 'Data', 'N. doc', 'Totale', ...(onlyApproved ? [] : ['Stato'])],
    ...(docs ?? []).map((d) => {
      const c = d.clients as { name?: string; vat_number?: string } | null;
      return [
        d.filename,
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

  const csv = rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const bom = '\uFEFF';
  return new NextResponse(bom + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="export-${month}.csv"`,
    },
  });
}
