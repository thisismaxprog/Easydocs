import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { processDocument } from '@/lib/process-document';
import {
  MAX_PUBLIC_UPLOAD_BYTES,
  UPLOAD_LINK_LIMIT_PER_DAY,
  UPLOAD_LINK_LIMIT_PER_HOUR,
  detectMimeFromBytes,
  isWellFormedUploadToken,
  sanitizeFilename,
} from '@/lib/upload-security';

// L'estrazione AI avviene dentro la richiesta: lascia tempo sufficiente su Vercel.
export const maxDuration = 60;

const INVALID_LINK = { valid: false, error: 'Link non valido o scaduto' };

/** GET: restituisce i dati del cliente per il token (pagina upload pubblica). */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!isWellFormedUploadToken(token)) {
    return NextResponse.json(INVALID_LINK, { status: 404 });
  }

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch (e) {
    console.error('[upload-link] createServiceRoleClient failed:', e);
    return NextResponse.json({ valid: false, error: 'Configurazione server mancante' }, { status: 500 });
  }

  const { data: client } = await admin
    .from('clients')
    .select('id, company_name, name')
    .eq('upload_token', token)
    .maybeSingle();

  if (!client) {
    return NextResponse.json(INVALID_LINK, { status: 404 });
  }

  const clientName = client.company_name || client.name || 'Cliente';
  return NextResponse.json({ valid: true, clientName });
}

/** Quanti file sono arrivati da questo link nell'intervallo indicato. */
async function countRecentUploads(
  admin: ReturnType<typeof createServiceRoleClient>,
  clientId: string,
  sinceMs: number
): Promise<number> {
  const { count } = await admin
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('source_type', 'upload_link')
    .gte('created_at', new Date(Date.now() - sinceMs).toISOString());
  return count ?? 0;
}

/** POST: upload documento tramite link cliente (non richiede autenticazione). */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = (formData.get('token') as string | null)?.trim() ?? null;
    const file = formData.get('file') as File | null;

    if (!isWellFormedUploadToken(token)) {
      return NextResponse.json({ error: 'Link non valido o scaduto' }, { status: 404 });
    }
    if (!file || !file.size) {
      return NextResponse.json({ error: 'File obbligatorio' }, { status: 400 });
    }
    if (file.size > MAX_PUBLIC_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File troppo grande (massimo 4 MB)' }, { status: 413 });
    }

    const admin = createServiceRoleClient();
    const { data: client } = await admin
      .from('clients')
      .select('id, firm_id')
      .eq('upload_token', token)
      .maybeSingle();

    if (!client) {
      return NextResponse.json({ error: 'Link non valido o scaduto' }, { status: 404 });
    }

    // Limiti di frequenza: proteggono lo studio (e il conto OpenAI) se il link finisce in mani sbagliate.
    const [lastHour, lastDay] = await Promise.all([
      countRecentUploads(admin, client.id, 60 * 60 * 1000),
      countRecentUploads(admin, client.id, 24 * 60 * 60 * 1000),
    ]);
    if (lastHour >= UPLOAD_LINK_LIMIT_PER_HOUR || lastDay >= UPLOAD_LINK_LIMIT_PER_DAY) {
      return NextResponse.json(
        { error: 'Hai caricato molti file in poco tempo. Riprova più tardi o contatta lo studio.' },
        { status: 429 }
      );
    }

    // Il tipo si ricava dal contenuto, non dal nome o dal tipo dichiarato dal browser.
    const buf = Buffer.from(await file.arrayBuffer());
    const mimeType = detectMimeFromBytes(buf);
    if (!mimeType) {
      return NextResponse.json(
        { error: 'Formato non supportato. Carica un PDF o una foto (JPEG, PNG, WebP).' },
        { status: 415 }
      );
    }

    const docId = crypto.randomUUID();
    const storagePath = `firm/${client.firm_id}/client/${client.id}/${docId}-${sanitizeFilename(file.name)}`;

    const { error: uploadError } = await admin.storage
      .from('documents')
      .upload(storagePath, buf, { contentType: mimeType, upsert: false });

    if (uploadError) {
      console.error('upload-link storage error:', uploadError);
      return NextResponse.json({ error: 'Errore durante il caricamento del file' }, { status: 500 });
    }

    const { data: doc, error: insertError } = await admin
      .from('documents')
      .insert({
        firm_id: client.firm_id,
        client_id: client.id,
        uploaded_by_user_id: null,
        source_type: 'upload_link',
        filename: file.name.slice(0, 255),
        storage_path: storagePath,
        mime_type: mimeType,
        status: 'uploaded',
        classification_status: 'assigned',
      })
      .select('id')
      .single();

    if (insertError || !doc) {
      console.error('upload-link insert error:', insertError);
      await admin.storage.from('documents').remove([storagePath]);
      return NextResponse.json({ error: 'Errore durante il salvataggio del documento' }, { status: 500 });
    }

    await admin.from('audit_logs').insert({
      firm_id: client.firm_id,
      user_id: null,
      action: 'document.uploaded',
      entity_type: 'document',
      entity_id: doc.id,
      meta: { filename: file.name, source: 'upload_link', client_id: client.id },
    });
    // Attende l'estrazione AI prima di rispondere (importante su serverless)
    await processDocument(doc.id);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('upload-link error:', e);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
