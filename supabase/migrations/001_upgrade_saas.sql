-- EasyDocs SaaS upgrade: clients, documents, invitations, roles
-- Run in Supabase SQL Editor after schema.sql and rls.sql

-- Firms: add vat_number, updated_at
alter table public.firms add column if not exists vat_number text;
alter table public.firms add column if not exists updated_at timestamptz default now();
create or replace function public.set_firms_updated_at()
returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists firms_updated_at on public.firms;
create trigger firms_updated_at before update on public.firms for each row execute function public.set_firms_updated_at();

-- Firm members: allow admin/collaborator roles (keep owner/staff for backward compat)
alter table public.firm_members drop constraint if exists firm_members_role_check;
alter table public.firm_members add constraint firm_members_role_check
  check (role in ('owner', 'staff', 'admin', 'collaborator'));

-- Clients: new columns for full client profile
alter table public.clients add column if not exists company_name text;
alter table public.clients add column if not exists tax_code text;
alter table public.clients add column if not exists internal_code text;
alter table public.clients add column if not exists contact_name text;
alter table public.clients add column if not exists contact_email text;
alter table public.clients add column if not exists phone text;
alter table public.clients add column if not exists notes text;
alter table public.clients add column if not exists invitation_status text not null default 'not_invited'
  check (invitation_status in ('not_invited', 'invited', 'accepted', 'expired'));
alter table public.clients add column if not exists upload_token text unique;
alter table public.clients add column if not exists updated_at timestamptz default now();

-- Backfill: company_name from name where null
update public.clients set company_name = name where company_name is null and name is not null;
update public.clients set contact_email = email where contact_email is null and email is not null;

create index if not exists idx_clients_upload_token on public.clients(upload_token) where upload_token is not null;
create index if not exists idx_clients_invitation_status on public.clients(invitation_status);

-- Assegna un upload_token a tutti i clienti che non ce l'hanno (così il link di caricamento funziona)
-- Dopo aver eseguito questo, apri la scheda cliente nell'app per vedere/copiare il link (il token è già nel DB)
update public.clients
set upload_token = encode(gen_random_bytes(24), 'hex')
where upload_token is null;

-- Documents: source type, classification, matching, uploader
alter table public.documents add column if not exists uploaded_by_user_id uuid references auth.users(id) on delete set null;
alter table public.documents add column if not exists source_type text not null default 'firm_upload'
  check (source_type in ('client_portal', 'upload_link', 'firm_upload', 'email', 'unknown'));
alter table public.documents add column if not exists classification_status text not null default 'assigned'
  check (classification_status in ('assigned', 'suggested', 'unmatched'));
alter table public.documents add column if not exists match_confidence numeric;
alter table public.documents add column if not exists match_reason text;
alter table public.documents add column if not exists notes text;

-- Client invitations (for future invite flow)
create table if not exists public.client_invitations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_client_invitations_client_id on public.client_invitations(client_id);
create index if not exists idx_client_invitations_token on public.client_invitations(token);

-- RLS for client_invitations (firm members can manage)
alter table public.client_invitations enable row level security;
create policy "Users can read invitations for own firms"
  on public.client_invitations for select
  using (exists (
    select 1 from public.clients c where c.id = client_invitations.client_id and c.firm_id in (select user_firm_ids())
  ));
create policy "Users can insert invitations for own firms"
  on public.client_invitations for insert
  with check (exists (
    select 1 from public.clients c where c.id = client_invitations.client_id and c.firm_id in (select user_firm_ids())
  ));
create policy "Users can update invitations for own firms"
  on public.client_invitations for update
  using (exists (
    select 1 from public.clients c where c.id = client_invitations.client_id and c.firm_id in (select user_firm_ids())
  ));
