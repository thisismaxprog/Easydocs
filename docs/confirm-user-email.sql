-- Conferma manuale email per un utente esistente
-- Esegui in Supabase → SQL Editor (una volta per ogni utente non confermato)
-- Sostituisci 'tua-email@esempio.com' con l'email dell'utente che non riesce ad accedere

UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'tua-email@esempio.com'
  AND email_confirmed_at IS NULL;
