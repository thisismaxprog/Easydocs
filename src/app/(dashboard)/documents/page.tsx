import { createClient } from '@/lib/supabase/server';
import { requireFirm } from '@/lib/get-firm-id';
import { DocumentsPageClient } from './documents-page-client';

export default async function DocumentsPage() {
  const firmId = await requireFirm();
  const supabase = await createClient();
  const [docsRes, clientsRes] = await Promise.all([
    supabase
      .from('documents')
      .select('id, filename, status, doc_type, doc_date, total, created_at, client_id, clients(name)')
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false }),
    supabase.from('clients').select('id, name').eq('firm_id', firmId).order('name'),
  ]);
  const documents = (docsRes.data ?? []).map((d) => ({
    ...d,
    clients: Array.isArray(d.clients) ? d.clients[0] ?? null : d.clients,
  }));
  const clients = clientsRes.data ?? [];

  return (
    <DocumentsPageClient
      initialDocuments={documents}
      clients={clients}
    />
  );
}
