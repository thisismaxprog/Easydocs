-- Fix "Link non valido": aggiungi upload_token ai clienti se manca
-- Esegui in Supabase → SQL Editor (progetto di produzione)

-- 1. Aggiungi la colonna se non esiste (safe se hai già eseguito 001_upgrade_saas.sql)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS upload_token text UNIQUE;

-- 2. Assegna un token a tutti i clienti che non ce l'hanno
UPDATE public.clients
SET upload_token = encode(gen_random_bytes(24), 'hex')
WHERE upload_token IS NULL;

-- 3. Verifica: dovresti vedere tutti i clienti con un token (es. 48 caratteri hex)
SELECT id, name, company_name, left(upload_token, 12) || '...' AS token_preview, length(upload_token) AS token_len
FROM public.clients
ORDER BY created_at DESC
LIMIT 10;
