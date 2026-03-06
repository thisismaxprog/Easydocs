-- Easydocs schema for Supabase Postgres
-- Run this in Supabase SQL Editor after creating a new project

-- Firms (studios)
create table if not exists public.firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Firm members (users belonging to a firm)
create table if not exists public.firm_members (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('owner', 'staff')),
  created_at timestamptz default now(),
  unique(firm_id, user_id)
);

-- Clients (companies served by the firm)
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  name text not null,
  vat_number text,
  email text,
  created_at timestamptz default now()
);

-- Documents
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  filename text not null,
  storage_path text not null,
  mime_type text,
  status text not null default 'uploaded' check (status in (
    'uploaded', 'processing', 'extracted', 'needs_review', 'approved', 'failed'
  )),
  doc_type text,
  doc_date date,
  doc_number text,
  total numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Extractions (AI-extracted data per document)
create table if not exists public.extractions (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  document_id uuid not null unique references public.documents(id) on delete cascade,
  extracted_json jsonb not null,
  confidence numeric,
  issues text[] default '{}',
  created_at timestamptz default now()
);

-- Audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  user_id uuid,
  action text not null,
  entity_type text,
  entity_id uuid,
  meta jsonb default '{}',
  created_at timestamptz default now()
);

-- Indexes for common queries
create index if not exists idx_firm_members_firm_id on public.firm_members(firm_id);
create index if not exists idx_firm_members_user_id on public.firm_members(user_id);
create index if not exists idx_clients_firm_id on public.clients(firm_id);
create index if not exists idx_documents_firm_id on public.documents(firm_id);
create index if not exists idx_documents_client_id on public.documents(client_id);
create index if not exists idx_documents_status on public.documents(status);
create index if not exists idx_documents_created_at on public.documents(created_at desc);
create index if not exists idx_extractions_document_id on public.extractions(document_id);
create index if not exists idx_audit_logs_firm_id on public.audit_logs(firm_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- Trigger to update documents.updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists documents_updated_at on public.documents;
create trigger documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();
