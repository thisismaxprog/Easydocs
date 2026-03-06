import { createServiceRoleClient } from '@/lib/supabase/admin';
import { isValidItalianVat, amountsConsistent } from '@/lib/extraction-schema';
import { extractFromText, extractFromImage } from '@/lib/ai-extract';

export async function processDocument(documentId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('id, firm_id, client_id, storage_path, mime_type')
    .eq('id', documentId)
    .single();

  if (docError || !doc) {
    await supabase
      .from('documents')
      .update({ status: 'failed' })
      .eq('id', documentId);
    return;
  }

  await supabase
    .from('documents')
    .update({ status: 'processing' })
    .eq('id', documentId);

  let text = '';
  let imageBuffer: Buffer | null = null;
  let imageMime = '';
  let pdfBuffer: Buffer | null = null;
  try {
    const { data: fileData } = await supabase.storage
      .from('documents')
      .download(doc.storage_path);

    if (!fileData) {
      throw new Error('File not found');
    }

    const mime = doc.mime_type || '';
    if (mime === 'application/pdf') {
      const pdfParse = (await import('pdf-parse')).default;
      const buf = await fileData.arrayBuffer();
      pdfBuffer = Buffer.from(buf);
      const result = await pdfParse(pdfBuffer);
      text = result.text || '';
    } else if (mime.startsWith('image/')) {
      const buf = await fileData.arrayBuffer();
      imageBuffer = Buffer.from(buf);
      imageMime = mime;
    } else {
      text = await fileData.text();
    }
  } catch (e) {
    console.error('Error reading file:', e);
    await supabase
      .from('documents')
      .update({ status: 'failed' })
      .eq('id', documentId);
    return;
  }

  // Immagine: estrazione con Vision API
  if (imageBuffer && imageBuffer.length > 0) {
    try {
      const { data: extracted } = await extractFromImage(imageBuffer, imageMime);
      const issues: string[] = [];
      if (extracted.confidence < 0.6) issues.push('Confidenza bassa: verificare i campi.');
      if (extracted.vendor_vat && !isValidItalianVat(extracted.vendor_vat)) {
        issues.push('P.IVA fornitore non valida (attese 11 cifre per Italia).');
      }
      if (!amountsConsistent(extracted.net_amount, extracted.vat_amount, extracted.total_amount)) {
        issues.push('Imponibile + IVA non coerenti con il totale.');
      }
      const status = issues.length > 0 || extracted.confidence < 0.7 ? 'needs_review' : 'extracted';
      await supabase.from('documents').update({
        status,
        doc_type: extracted.doc_type,
        doc_date: extracted.doc_date,
        doc_number: extracted.doc_number,
        total: extracted.total_amount,
      }).eq('id', documentId);
      await supabase.from('extractions').upsert({
        firm_id: doc.firm_id,
        document_id: documentId,
        extracted_json: extracted,
        confidence: extracted.confidence,
        issues: issues.length > 0 ? issues : null,
      }, { onConflict: 'document_id' });
    } catch (e) {
      console.error('Image extraction error:', e);
      await supabase.from('documents').update({ status: 'failed' }).eq('id', documentId);
      await supabase.from('extractions').upsert({
        firm_id: doc.firm_id,
        document_id: documentId,
        extracted_json: { doc_type: null, vendor_name: null, vendor_vat: null, doc_number: null, doc_date: null, net_amount: null, vat_amount: null, total_amount: null, currency: null, notes: null, confidence: 0 },
        confidence: 0,
        issues: ['Errore durante l’estrazione dall’immagine. Inserire i dati manualmente.'],
      }, { onConflict: 'document_id' });
    }
    return;
  }

  // No text: se è un PDF, prova a convertire la prima pagina in immagine e usa Vision
  if (!text || text.trim().length < 20) {
    if (pdfBuffer && pdfBuffer.length > 0) {
      try {
        const { pdf } = await import('pdf-to-img');
        const document = await pdf(pdfBuffer, { scale: 2 });
        const firstPage = await document.getPage(1);
        const { data: extracted } = await extractFromImage(firstPage, 'image/png');
        const issues: string[] = [];
        if (extracted.confidence < 0.6) issues.push('Confidenza bassa: verificare i campi.');
        if (extracted.vendor_vat && !isValidItalianVat(extracted.vendor_vat)) {
          issues.push('P.IVA fornitore non valida (attese 11 cifre per Italia).');
        }
        if (!amountsConsistent(extracted.net_amount, extracted.vat_amount, extracted.total_amount)) {
          issues.push('Imponibile + IVA non coerenti con il totale.');
        }
        const status = issues.length > 0 || extracted.confidence < 0.7 ? 'needs_review' : 'extracted';
        await supabase.from('documents').update({
          status,
          doc_type: extracted.doc_type,
          doc_date: extracted.doc_date,
          doc_number: extracted.doc_number,
          total: extracted.total_amount,
        }).eq('id', documentId);
        await supabase.from('extractions').upsert({
          firm_id: doc.firm_id,
          document_id: documentId,
          extracted_json: extracted,
          confidence: extracted.confidence,
          issues: issues.length > 0 ? issues : null,
        }, { onConflict: 'document_id' });
        return;
      } catch (e) {
        console.error('PDF-to-image extraction fallback error:', e);
      }
    }
    // Davvero nessun testo e nessun fallback riuscito -> needs_review
    await supabase.from('documents').update({
      status: 'needs_review',
      doc_type: 'other',
    }).eq('id', documentId);
    await supabase.from('extractions').upsert({
      firm_id: doc.firm_id,
      document_id: documentId,
      extracted_json: {
        doc_type: null,
        vendor_name: null,
        vendor_vat: null,
        doc_number: null,
        doc_date: null,
        net_amount: null,
        vat_amount: null,
        total_amount: null,
        currency: 'EUR',
        notes: 'Documento scansionato o immagine: inserimento manuale richiesto.',
        confidence: 0,
      },
      confidence: 0,
      issues: ['Testo non estraibile (PDF scansionato o immagine). Inserire i dati manualmente.'],
    }, { onConflict: 'document_id' });
    return;
  }

  try {
    const { data: extracted } = await extractFromText(text);
    const issues: string[] = [];

    if (extracted.confidence < 0.6) {
      issues.push('Confidenza bassa: verificare i campi.');
    }
    if (extracted.vendor_vat && !isValidItalianVat(extracted.vendor_vat)) {
      issues.push('P.IVA fornitore non valida (attese 11 cifre per Italia).');
    }
    if (!amountsConsistent(extracted.net_amount, extracted.vat_amount, extracted.total_amount)) {
      issues.push('Imponibile + IVA non coerenti con il totale.');
    }

    const status = issues.length > 0 || extracted.confidence < 0.7 ? 'needs_review' : 'extracted';

    await supabase.from('documents').update({
      status,
      doc_type: extracted.doc_type,
      doc_date: extracted.doc_date,
      doc_number: extracted.doc_number,
      total: extracted.total_amount,
    }).eq('id', documentId);

    await supabase.from('extractions').upsert({
      firm_id: doc.firm_id,
      document_id: documentId,
      extracted_json: extracted,
      confidence: extracted.confidence,
      issues: issues.length > 0 ? issues : null,
    }, { onConflict: 'document_id' });
  } catch (e) {
    console.error('Extraction error:', e);
    await supabase.from('documents').update({ status: 'failed' }).eq('id', documentId);
    await supabase.from('extractions').upsert({
      firm_id: doc.firm_id,
      document_id: documentId,
      extracted_json: { doc_type: null, vendor_name: null, vendor_vat: null, doc_number: null, doc_date: null, net_amount: null, vat_amount: null, total_amount: null, currency: null, notes: null, confidence: 0 },
      confidence: 0,
      issues: ['Errore durante l’estrazione automatica. Inserire i dati manualmente.'],
    }, { onConflict: 'document_id' });
  }
}
