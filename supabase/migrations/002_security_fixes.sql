-- Easydocs: correzioni di sicurezza
-- Esegui in Supabase → SQL Editor (progetto di produzione) DOPO aver pubblicato il nuovo codice.

-- 1. Questa policy permetteva a QUALSIASI utente registrato di aggiungersi
--    come membro (anche "owner") di uno studio qualunque, conoscendone l'ID.
--    La creazione dello studio passa da createFirm (server, chiave service role),
--    quindi la policy non serve: i nuovi membri li aggiunge solo un owner.
drop policy if exists "Users can insert self as firm member" on public.firm_members;

-- 2. Verifica: deve restituire solo "Owners can insert firm members".
select policyname
from pg_policies
where schemaname = 'public' and tablename = 'firm_members' and cmd = 'INSERT';
