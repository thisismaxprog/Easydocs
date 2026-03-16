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
    id: doc.id,
    filename: doc.filename ?? '',
    storage_path: doc.storage_path ?? null,
    mime_type: doc.mime_type ?? null,
    status: doc.status ?? 'uploaded',
    doc_type: doc.doc_type ?? null,
    doc_date: doc.doc_date ?? null,
    doc_number: doc.doc_number ?? null,
    total: doc.total != null ? Number(doc.total) : null,
    client_id: doc.client_id ?? null,
    clients: Array.isArray(doc.clients) ? doc.clients[0] ?? null : doc.clients,
  };

  const { data: extractionRaw } = await supabase
    .from('extractions')
    .select('extracted_json, confidence, issues')
    .eq('document_id', id)
    .maybeSingle();

  const extraction =
    extractionRaw &&
    typeof extractionRaw.extracted_json === 'object' &&
    extractionRaw.extracted_json !== null
      ? {
          extracted_json: extractionRaw.extracted_json as Record<string, unknown>,
          confidence: extractionRaw.confidence ?? 0,
          issues: Array.isArray(extractionRaw.issues) ? extractionRaw.issues : null,
        }
      : null;

  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('id, action, created_at')
    .eq('entity_type', 'document')
    .eq('entity_id', id)
    .order('created_at', { ascending: false })
    .limit(20);

  let signedUrl: string | null = null;
  if (doc.storage_path) {
    try {
      const { data: urlData } = await supabase.storage.from('documents').createSignedUrl(doc.storage_path, 3600);
      signedUrl = urlData?.signedUrl ?? null;
    } catch {
      signedUrl = null;
    }
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
