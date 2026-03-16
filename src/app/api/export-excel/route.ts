import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentFirmId } from '@/lib/get-firm-id';
import { getDocTypeLabel } from '@/lib/doc-type-labels';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const clientId = searchParams.get('client_id') ?? 'all';
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
    .select('id, filename, doc_type, doc_date, doc_number, total, clients(name, vat_number)')
    .eq('firm_id', firmId)
    .eq('status', 'approved')
    .gte('doc_date', start)
    .lte('doc_date', end);

  if (clientId !== 'all') {
    query = query.eq('client_id', clientId);
  }

  const { data: docs, error } = await query.order('doc_date');

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  const rows: (string | number)[][] = [
    ['File', 'Cliente', 'P.IVA', 'Tipo', 'Data', 'N. doc', 'Totale'],
    ...(docs ?? []).map((d) => {
      const c = d.clients as { name?: string; vat_number?: string } | null;
      const total = d.total != null ? Number(d.total) : null;
      return [
        d.filename ?? '',
        c?.name ?? '',
        c?.vat_number ?? '',
        getDocTypeLabel(d.doc_type),
        d.doc_date ?? '',
        d.doc_number ?? '',
        total != null ? total : '',
      ];
    }),
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const colWidths = [{ wch: 30 }, { wch: 25 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
  ws['!cols'] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Documenti');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const filename = `export-${month}${clientId !== 'all' ? `-cliente` : ''}.xlsx`;
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
