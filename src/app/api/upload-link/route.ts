import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { processDocument } from '@/lib/process-document';

/** GET: restituisce i dati del cliente per il token (pagina upload pubblica). */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ valid: false, error: 'Token mancante' }, { status: 400 });
  }
  const admin = createServiceRoleClient();
  const { data: client, error } = await admin
    .from('clients')
    .select('id, company_name, name, firm_id')
    .eq('upload_token', token)
    .single();

  if (error || !client) {
    return NextResponse.json({ valid: false, error: 'Link non valido o scaduto' }, { status: 404 });
  }

  const clientName = client.company_name || client.name || 'Cliente';
  return NextResponse.json({ valid: true, clientName, clientId: client.id });
}

/** POST: upload documento tramite link cliente (non richiede autenticazione). */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = (formData.get('token') as string)?.trim();
    const file = formData.get('file') as File | null;

    if (!token || !file?.size) {
      return NextResponse.json(
        { error: 'Token e file sono obbligatori' },
        { status: 400 }
      );
    }

    const admin = createServiceRoleClient();
    const { data: client, error: clientError } = await admin
      .from('clients')
      .select('id, firm_id')
      .eq('upload_token', token)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Link non valido o scaduto' }, { status: 404 });
    }

    const docId = crypto.randomUUID();
    const storagePath = `firm/${client.firm_id}/client/${client.id}/${docId}-${file.name}`;

    const buf = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage
      .from('documents')
      .upload(storagePath, buf, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      console.error('upload-link storage error:', uploadError);
      return NextResponse.json({ error: 'Errore durante il caricamento del file' }, { status: 500 });
    }

    const { error: insertError } = await admin.from('documents').insert({
      firm_id: client.firm_id,
      client_id: client.id,
      uploaded_by_user_id: null,
      source_type: 'upload_link',
      filename: file.name,
      storage_path: storagePath,
      mime_type: file.type || null,
      status: 'uploaded',
      classification_status: 'assigned',
    });

    if (insertError) {
      console.error('upload-link insert error:', insertError);
      return NextResponse.json({ error: 'Errore durante il salvataggio del documento' }, { status: 500 });
    }

    const { data: doc } = await admin
      .from('documents')
      .select('id')
      .eq('storage_path', storagePath)
      .single();

    if (doc) {
      await admin.from('audit_logs').insert({
        firm_id: client.firm_id,
        user_id: null,
        action: 'document.uploaded',
        entity_type: 'document',
        entity_id: doc.id,
        meta: { filename: file.name, source: 'upload_link', client_id: client.id },
      });
      processDocument(doc.id).catch(console.error);
    }

    return NextResponse.json({ success: true, documentId: doc?.id });
  } catch (e) {
    console.error('upload-link error:', e);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
