-- Fix RLS: permetti agli utenti autenticati di creare un nuovo studio (tabella firms)
-- Esegui in Supabase → SQL Editor se ricevi "new row violates row-level security policy for table firms"

-- Rimuovi la policy di insert esistente (se presente)
drop policy if exists "Users can insert firms" on public.firms;

-- Ricrea la policy: chi è loggato (auth.uid() non null) può inserire una riga in firms
create policy "Users can insert firms"
  on public.firms for insert
  with check (auth.uid() is not null);
