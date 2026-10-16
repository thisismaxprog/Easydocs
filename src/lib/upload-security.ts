/**
 * Controlli di sicurezza per i file caricati.
 * Nessuna dipendenza esterna: usabile sia lato server sia lato client.
 */

/** Tipi di file accettati (coincidono con allowed_mime_types del bucket Storage). */
export const ALLOWED_UPLOAD_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/**
 * Dimensione massima per il link pubblico di caricamento.
 * Vercel rifiuta i body delle funzioni sopra 4,5 MB: restiamo sotto con margine.
 */
export const MAX_PUBLIC_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Limiti di caricamento per singolo link cliente. */
export const UPLOAD_LINK_LIMIT_PER_HOUR = 20;
export const UPLOAD_LINK_LIMIT_PER_DAY = 100;

export function isAllowedMimeType(mime: string | null | undefined): boolean {
  return !!mime && (ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(mime);
}

/** Tipo di file ricavato dall'estensione, per i browser che non lo dichiarano. */
export function mimeFromFilename(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  return null;
}

/**
 * Riconosce il tipo reale del file dai primi byte (non dal nome né dal tipo dichiarato,
 * che il browser o un malintenzionato possono falsificare).
 */
export function detectMimeFromBytes(bytes: Uint8Array): string | null {
  const startsWith = (sig: number[], offset = 0) =>
    bytes.length >= offset + sig.length && sig.every((b, i) => bytes[offset + i] === b);

  if (startsWith([0x25, 0x50, 0x44, 0x46])) return 'application/pdf'; // %PDF
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (startsWith([0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) {
    return 'image/webp'; // RIFF....WEBP
  }
  return null;
}

/**
 * Nome file sicuro per il percorso su Storage: niente slash, niente "..",
 * solo lettere, cifre, punto, trattino e underscore. Il nome originale resta
 * salvato a parte (colonna `filename`) per essere mostrato all'utente.
 */
export function sanitizeFilename(name: string): string {
  const base = (name.split(/[\\/]/).pop() ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[._]+/, '');

  if (!base) return 'documento';
  if (base.length <= 100) return base;

  const dot = base.lastIndexOf('.');
  const ext = dot > 0 && base.length - dot <= 10 ? base.slice(dot) : '';
  return base.slice(0, 100 - ext.length) + ext;
}

/** I token generati dall'app (e dallo script SQL) sono 24 byte in esadecimale = 48 caratteri. */
export function isWellFormedUploadToken(token: string | null | undefined): token is string {
  return !!token && /^[a-f0-9]{48}$/.test(token);
}
