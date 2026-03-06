import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireFirm } from '@/lib/get-firm-id';
import { DocumentDetailClient } from './document-detail-client';

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const firmId = await requireFirm();
  const supabase = await createClient();

  const { data: doc, error } = await supabase
    .from('documents')
    .select('id, filename, storage_path, mime_type, status, doc_type, doc_date, doc_number, total, client_id, clients(name)')
    .eq('id', id)
    .eq('firm_id', firmId)
    .single();

  if (error || !doc) notFound();

  const document = {
    ...doc,
    clients: Array.isArray(doc.clients) ? doc.clients[0] ?? null : doc.clients,
  };

  const { data: extraction } = await supabase
    .from('extractions')
    .select('extracted_json, confidence, issues')
    .eq('document_id', id)
    .single();

  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('id, action, created_at')
    .eq('entity_type', 'document')
    .eq('entity_id', id)
    .order('created_at', { ascending: false })
    .limit(20);

  let signedUrl: string | null = null;
  if (doc.storage_path) {
    const { data: urlData } = await supabase.storage.from('documents').createSignedUrl(doc.storage_path, 3600);
    signedUrl = urlData?.signedUrl ?? null;
  }

  return (
    <DocumentDetailClient
      document={document}
      extraction={extraction}
      auditLogs={auditLogs ?? []}
      signedUrl={signedUrl}
    />
  );
}
