'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { processDocument } from '@/lib/process-document';
import { revalidatePath } from 'next/cache';
import { getCurrentFirmId, requireFirm } from '@/lib/get-firm-id';
import { isAllowedMimeType, mimeFromFilename, sanitizeFilename } from '@/lib/upload-security';

export { getCurrentFirmId, requireFirm };

export async function createFirm(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const name = (formData.get('name') as string)?.trim();
  if (!name) return { error: 'Nome studio richiesto' };

  // Service role bypassa RLS: necessario per creare il primo studio (la sessione a volte non arriva a Supabase nelle Server Actions)
  const admin = createServiceRoleClient();

  const { data: firm, error: firmError } = await admin
    .from('firms')
    .insert({ name })
    .select('id')
    .single();

  if (firmError) return { error: firmError.message };

  const { error: memberError } = await admin.from('firm_members').insert({
    firm_id: firm.id,
    user_id: user.id,
    role: 'owner',
  });

  if (memberError) return { error: memberError.message };

  revalidatePath('/', 'layout');
  redirect('/overview');
}

/**
 * Verifica che il cliente appartenga allo studio. Le scritture qui usano la chiave
 * di amministratore (che ignora le policy RLS), quindi il controllo va fatto nel codice.
 */
async function clientBelongsToFirm(
  admin: ReturnType<typeof createServiceRoleClient>,
  clientId: string,
  firmId: string
): Promise<boolean> {
  const { data } = await admin
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('firm_id', firmId)
    .maybeSingle();
  return !!data;
}

/** Prepara l'upload: crea il record e restituisce path per upload diretto browser → Storage (evita timeout server). */
export async function prepareDocumentUpload(clientId: string | null, filename: string) {
  try {
    const supabase = await createClient();
    const firmId = await requireFirm();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Non autenticato' };

    const admin = createServiceRoleClient();
    if (clientId && !(await clientBelongsToFirm(admin, clientId, firmId))) {
      return { error: 'Cliente non trovato' };
    }

    const docId = crypto.randomUUID();
    const storagePath = `firm/${firmId}/client/${clientId || 'none'}/${docId}-${sanitizeFilename(filename)}`;

    const { error: insertError } = await admin.from('documents').insert({
      firm_id: firmId,
      client_id: clientId || null,
      uploaded_by_user_id: user.id,
      source_type: 'firm_upload',
      filename,
      storage_path: storagePath,
      mime_type: null,
      status: 'uploaded',
      classification_status: 'assigned',
    });

    if (insertError) return { error: insertError.message };

    const { data: doc } = await admin
      .from('documents')
      .select('id')
      .eq('storage_path', storagePath)
      .single();

    if (!doc) return { error: 'Record documento non creato' };

    await admin.from('audit_logs').insert({
      firm_id: firmId,
      user_id: user.id,
      action: 'document.uploaded',
      entity_type: 'document',
      entity_id: doc.id,
      meta: { filename },
    });

    return { documentId: doc.id, storagePath };
  } catch (e) {
    console.error('prepareDocumentUpload error:', e);
    return { error: e instanceof Error ? e.message : 'Errore di preparazione.' };
  }
}

/** Dopo upload da browser a Storage: aggiorna mime_type e avvia estrazione AI. */
export async function confirmDocumentUpload(documentId: string, mimeType: string) {
  try {
    const supabase = await createClient();
    const firmId = await requireFirm();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Non autenticato' };

    const admin = createServiceRoleClient();
    // Solo documenti dello studio dell'utente, e solo se non ancora elaborati:
    // evita di far ripartire (e pagare) l'estrazione AI su documenti altrui o già processati.
    const { data: doc } = await admin
      .from('documents')
      .select('id, filename')
      .eq('id', documentId)
      .eq('firm_id', firmId)
      .eq('status', 'uploaded')
      .maybeSingle();
    if (!doc) return { error: 'Documento non trovato o già elaborato' };

    const resolvedMime = mimeType || mimeFromFilename(doc.filename ?? '') || '';
    if (!isAllowedMimeType(resolvedMime)) {
      await admin.from('documents').update({ status: 'failed' }).eq('id', documentId);
      return { error: 'Tipo di file non supportato (accettati PDF, JPEG, PNG, WebP)' };
    }

    await admin.from('documents').update({ mime_type: resolvedMime }).eq('id', documentId);
    // Attende l'estrazione AI prima di rispondere
    await processDocument(documentId);
    revalidatePath('/documents');
    revalidatePath('/overview');
    return { success: true };
  } catch (e) {
    console.error('confirmDocumentUpload error:', e);
    return { error: e instanceof Error ? e.message : 'Errore di conferma.' };
  }
}

export async function updateDocumentStatus(
  documentId: string,
  status: 'approved' | 'needs_review'
) {
  const supabase = await createClient();
  const firmId = await requireFirm();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non autenticato' };

  const { error } = await supabase
    .from('documents')
    .update({ status })
    .eq('id', documentId)
    .eq('firm_id', firmId);

  if (error) return { error: error.message };

  await supabase.from('audit_logs').insert({
    firm_id: firmId,
    user_id: user.id,
    action: `document.${status}`,
    entity_type: 'document',
    entity_id: documentId,
  });

  revalidatePath('/documents');
  revalidatePath(`/documents/${documentId}`);
  revalidatePath('/overview');
  return { success: true };
}

export async function updateDocumentFields(
  documentId: string,
  fields: { doc_type?: string; doc_date?: string; doc_number?: string; total?: number }
) {
  const supabase = await createClient();
  const firmId = await requireFirm();

  const { error } = await supabase
    .from('documents')
    .update(fields)
    .eq('id', documentId)
    .eq('firm_id', firmId);

  if (error) return { error: error.message };

  const { data: ext } = await supabase
    .from('extractions')
    .select('id, extracted_json')
    .eq('document_id', documentId)
    .single();

  if (ext?.extracted_json) {
    const json = ext.extracted_json as Record<string, unknown>;
    await supabase.from('extractions').update({
      extracted_json: {
        ...json,
        doc_type: fields.doc_type ?? json.doc_type,
        doc_date: fields.doc_date ?? json.doc_date,
        doc_number: fields.doc_number ?? json.doc_number,
        total_amount: fields.total ?? json.total_amount,
      },
    }).eq('document_id', documentId);
  }

  revalidatePath(`/documents/${documentId}`);
  return { success: true };
}

function generateUploadToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function addClient(formData: FormData) {
  const supabase = await createClient();
  const firmId = await requireFirm();
  const { data: { user } } = await supabase.auth.getUser();
  const name = (formData.get('name') as string)?.trim() || (formData.get('company_name') as string)?.trim();
  if (!name) return { error: 'Nome o ragione sociale richiesto' };

  const admin = createServiceRoleClient();
  const uploadToken = generateUploadToken();
  const { data: client, error } = await admin.from('clients').insert({
    firm_id: firmId,
    name,
    company_name: name,
    vat_number: (formData.get('vat_number') as string)?.trim() || null,
    tax_code: (formData.get('tax_code') as string)?.trim() || null,
    internal_code: (formData.get('internal_code') as string)?.trim() || null,
    contact_name: (formData.get('contact_name') as string)?.trim() || null,
    contact_email: (formData.get('contact_email') as string)?.trim() || (formData.get('email') as string)?.trim() || null,
    email: (formData.get('email') as string)?.trim() || null,
    phone: (formData.get('phone') as string)?.trim() || null,
    notes: (formData.get('notes') as string)?.trim() || null,
    invitation_status: 'not_invited',
    upload_token: uploadToken,
  }).select('id').single();

  if (error) return { error: error.message };
  await admin.from('audit_logs').insert({
    firm_id: firmId,
    user_id: user?.id ?? null,
    action: 'client.created',
    entity_type: 'client',
    entity_id: client?.id,
    meta: { name },
  });
  revalidatePath('/clients');
  revalidatePath('/overview');
  return { success: true, clientId: client?.id };
}

export async function updateClient(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const firmId = await requireFirm();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createServiceRoleClient();
  const name = (formData.get('name') as string)?.trim() || (formData.get('company_name') as string)?.trim();
  const { error } = await admin.from('clients').update({
    name: name || undefined,
    company_name: (formData.get('company_name') as string)?.trim() || name || undefined,
    vat_number: (formData.get('vat_number') as string)?.trim() || null,
    tax_code: (formData.get('tax_code') as string)?.trim() || null,
    internal_code: (formData.get('internal_code') as string)?.trim() || null,
    contact_name: (formData.get('contact_name') as string)?.trim() || null,
    contact_email: (formData.get('contact_email') as string)?.trim() || (formData.get('email') as string)?.trim() || null,
    email: (formData.get('email') as string)?.trim() || null,
    phone: (formData.get('phone') as string)?.trim() || null,
    notes: (formData.get('notes') as string)?.trim() || null,
  }).eq('id', clientId).eq('firm_id', firmId);

  if (error) return { error: error.message };
  await admin.from('audit_logs').insert({
    firm_id: firmId,
    user_id: user?.id ?? null,
    action: 'client.updated',
    entity_type: 'client',
    entity_id: clientId,
  });
  revalidatePath('/clients');
  revalidatePath(`/clients/${clientId}`);
  revalidatePath('/overview');
  return { success: true };
}

/** Assicura che il cliente abbia un upload_token; lo genera se mancante. */
export async function ensureClientUploadToken(clientId: string) {
  const firmId = await requireFirm();
  const admin = createServiceRoleClient();
  const { data: client } = await admin.from('clients').select('upload_token').eq('id', clientId).eq('firm_id', firmId).single();
  if (!client) return { error: 'Cliente non trovato' };
  if (client.upload_token) return { uploadToken: client.upload_token };
  const uploadToken = generateUploadToken();
  const { error } = await admin.from('clients').update({ upload_token: uploadToken }).eq('id', clientId).eq('firm_id', firmId);
  if (error) return { error: error.message };
  revalidatePath(`/clients/${clientId}`);
  revalidatePath('/clients');
  return { uploadToken };
}

/** Genera un nuovo link di caricamento: il vecchio smette subito di funzionare. */
export async function regenerateClientUploadToken(clientId: string) {
  const supabase = await createClient();
  const firmId = await requireFirm();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non autenticato' };

  const admin = createServiceRoleClient();
  const uploadToken = generateUploadToken();
  const { data, error } = await admin
    .from('clients')
    .update({ upload_token: uploadToken })
    .eq('id', clientId)
    .eq('firm_id', firmId)
    .select('id')
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: 'Cliente non trovato' };

  await admin.from('audit_logs').insert({
    firm_id: firmId,
    user_id: user.id,
    action: 'client.upload_link_regenerated',
    entity_type: 'client',
    entity_id: clientId,
  });
  revalidatePath(`/clients/${clientId}`);
  return { uploadToken };
}

export async function updateFirmName(name: string) {
  const supabase = await createClient();
  const firmId = await requireFirm();
  const { error } = await supabase.from('firms').update({ name }).eq('id', firmId);
  if (error) return { error: error.message };
  revalidatePath('/settings');
  revalidatePath('/', 'layout');
  return { success: true };
}
