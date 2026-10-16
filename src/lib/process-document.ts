import { createServiceRoleClient } from '@/lib/supabase/admin';
import {
  EMPTY_EXTRACTION,
  extractionIssues,
  type ExtractionJson,
} from '@/lib/extraction-schema';
import { extractFromText, extractFromImage } from '@/lib/ai-extract';

type Admin = ReturnType<typeof createServiceRoleClient>;
type DocRef = { id: string; firm_id: string };

function inferMimeFromPath(p: string): string {
  const lower = p.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  return '';
}

/** Salva i dati estratti e decide se il documento è pronto o da revisionare. */
async function saveExtraction(supabase: Admin, doc: DocRef, extracted: ExtractionJson) {
  const issues = extractionIssues(extracted);
  const status = issues.length > 0 || extracted.confidence < 0.6 ? 'needs_review' : 'extracted';

  await supabase
    .from('documents')
    .update({
      status,
      doc_type: extracted.doc_type,
      doc_date: extracted.doc_date,
      doc_number: extracted.doc_number,
      total: extracted.total_amount,
    })
    .eq('id', doc.id);

  await supabase.from('extractions').upsert(
    {
      firm_id: doc.firm_id,
      document_id: doc.id,
      extracted_json: extracted,
      confidence: extracted.confidence,
      issues: issues.length > 0 ? issues : null,
    },
    { onConflict: 'document_id' }
  );
}

/** Registra un'estrazione vuota con un messaggio per chi revisiona. */
async function saveManualEntryRequired(
  supabase: Admin,
  doc: DocRef,
  status: 'failed' | 'needs_review',
  message: string,
  extracted: ExtractionJson = EMPTY_EXTRACTION
) {
  await supabase
    .from('documents')
    .update(status === 'needs_review' ? { status, doc_type: 'other' } : { status })
    .eq('id', doc.id);

  await supabase.from('extractions').upsert(
    {
      firm_id: doc.firm_id,
      document_id: doc.id,
      extracted_json: extracted,
      confidence: 0,
      issues: [message],
    },
    { onConflict: 'document_id' }
  );
}

export async function processDocument(documentId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('id, firm_id, client_id, storage_path, mime_type')
    .eq('id', documentId)
    .single();

  if (docError || !doc) {
    await supabase.from('documents').update({ status: 'failed' }).eq('id', documentId);
    return;
  }

  await supabase.from('documents').update({ status: 'processing' }).eq('id', documentId);

  let text = '';
  let imageBuffer: Buffer | null = null;
  let imageMime = '';
  let pdfBuffer: Buffer | null = null;
  try {
    const { data: fileData } = await supabase.storage.from('documents').download(doc.storage_path);
    if (!fileData) throw new Error('File not found');

    const mime = doc.mime_type || inferMimeFromPath(doc.storage_path) || '';
    const buf = Buffer.from(await fileData.arrayBuffer());
    if (mime === 'application/pdf') {
      pdfBuffer = buf;
      const pdfParse = (await import('pdf-parse')).default;
      const result = await pdfParse(pdfBuffer);
      text = result.text || '';
    } else if (mime.startsWith('image/')) {
      imageBuffer = buf;
      imageMime = mime;
    } else {
      text = buf.toString('utf-8');
    }
  } catch (e) {
    console.error('Error reading file:', e);
    await supabase.from('documents').update({ status: 'failed' }).eq('id', documentId);
    return;
  }

  // Immagine: estrazione con Vision API
  if (imageBuffer && imageBuffer.length > 0) {
    try {
      const { data: extracted } = await extractFromImage(imageBuffer, imageMime);
      await saveExtraction(supabase, doc, extracted);
    } catch (e) {
      console.error('Image extraction error:', e);
      await saveManualEntryRequired(
        supabase,
        doc,
        'failed',
        'Errore durante l’estrazione dall’immagine. Inserire i dati manualmente.'
      );
    }
    return;
  }

  // Nessun testo: se è un PDF, prova a convertire la prima pagina in immagine e usa Vision
  if (!text || text.trim().length < 20) {
    if (pdfBuffer && pdfBuffer.length > 0) {
      try {
        const { pdf } = await import('pdf-to-img');
        const document = await pdf(pdfBuffer, { scale: 2 });
        const firstPage = await document.getPage(1);
        const { data: extracted } = await extractFromImage(firstPage, 'image/png');
        await saveExtraction(supabase, doc, extracted);
        return;
      } catch (e) {
        console.error('PDF-to-image extraction fallback error:', e);
      }
    }
    await saveManualEntryRequired(
      supabase,
      doc,
      'needs_review',
      'Testo non estraibile (PDF scansionato o immagine). Inserire i dati manualmente.',
      {
        ...EMPTY_EXTRACTION,
        currency: 'EUR',
        notes: 'Documento scansionato o immagine: inserimento manuale richiesto.',
      }
    );
    return;
  }

  try {
    const { data: extracted } = await extractFromText(text);
    await saveExtraction(supabase, doc, extracted);
  } catch (e) {
    console.error('Extraction error:', e);
    await saveManualEntryRequired(
      supabase,
      doc,
      'failed',
      'Errore durante l’estrazione automatica. Inserire i dati manualmente.'
    );
  }
}
