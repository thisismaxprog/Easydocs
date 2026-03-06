-- Easydocs RLS policies for Supabase
-- Run after schema.sql. Ensures users only see data for firms they belong to.

-- Enable RLS on all tables
alter table public.firms enable row level security;
alter table public.firm_members enable row level security;
alter table public.clients enable row level security;
alter table public.documents enable row level security;
alter table public.extractions enable row level security;
alter table public.audit_logs enable row level security;

-- Helper: get current user's firm ids (user can be in multiple firms; for MVP we use first one via app logic)
create or replace function public.user_firm_ids()
returns setof uuid as $$
  select firm_id from public.firm_members where user_id = auth.uid();
$$ language sql security definer stable;

-- Firms: users can read firms they are members of
create policy "Users can read own firms"
  on public.firms for select
  using (id in (select user_firm_ids()));

-- Any authenticated user can create a new firm (onboarding)
create policy "Users can insert firms"
  on public.firms for insert
  with check (auth.uid() is not null);

create policy "Users can update own firms"
  on public.firms for update
  using (id in (select user_firm_ids()));

-- Firm members: users can read members of their firms; owners can manage (insert/update/delete)
create policy "Users can read firm members of own firms"
  on public.firm_members for select
  using (firm_id in (select user_firm_ids()));

create policy "Owners can insert firm members"
  on public.firm_members for insert
  with check (
    firm_id in (select user_firm_ids()) and
    exists (select 1 from public.firm_members fm where fm.firm_id = firm_members.firm_id and fm.user_id = auth.uid() and fm.role = 'owner')
  );

create policy "Owners can update firm members"
  on public.firm_members for update
  using (firm_id in (select user_firm_ids()) and exists (select 1 from public.firm_members fm where fm.firm_id = firm_members.firm_id and fm.user_id = auth.uid() and fm.role = 'owner'));

create policy "Owners can delete firm members"
  on public.firm_members for delete
  using (firm_id in (select user_firm_ids()) and exists (select 1 from public.firm_members fm where fm.firm_id = firm_members.firm_id and fm.user_id = auth.uid() and fm.role = 'owner'));

-- Allow user to insert themselves as first member (onboarding)
create policy "Users can insert self as firm member"
  on public.firm_members for insert
  with check (user_id = auth.uid());

-- Clients: CRUD only for own firm
create policy "Users can read clients of own firms"
  on public.clients for select
  using (firm_id in (select user_firm_ids()));

create policy "Users can insert clients in own firms"
  on public.clients for insert
  with check (firm_id in (select user_firm_ids()));

create policy "Users can update clients of own firms"
  on public.clients for update
  using (firm_id in (select user_firm_ids()));

create policy "Users can delete clients of own firms"
  on public.clients for delete
  using (firm_id in (select user_firm_ids()));

-- Documents: CRUD only for own firm
create policy "Users can read documents of own firms"
  on public.documents for select
  using (firm_id in (select user_firm_ids()));

create policy "Users can insert documents in own firms"
  on public.documents for insert
  with check (firm_id in (select user_firm_ids()));

create policy "Users can update documents of own firms"
  on public.documents for update
  using (firm_id in (select user_firm_ids()));

create policy "Users can delete documents of own firms"
  on public.documents for delete
  using (firm_id in (select user_firm_ids()));

-- Extractions: CRUD only for own firm
create policy "Users can read extractions of own firms"
  on public.extractions for select
  using (firm_id in (select user_firm_ids()));

create policy "Users can insert extractions in own firms"
  on public.extractions for insert
  with check (firm_id in (select user_firm_ids()));

create policy "Users can update extractions of own firms"
  on public.extractions for update
  using (firm_id in (select user_firm_ids()));

create policy "Users can delete extractions of own firms"
  on public.extractions for delete
  using (firm_id in (select user_firm_ids()));

-- Audit logs: read/insert only (no update/delete)
create policy "Users can read audit logs of own firms"
  on public.audit_logs for select
  using (firm_id in (select user_firm_ids()));

create policy "Users can insert audit logs in own firms"
  on public.audit_logs for insert
  with check (firm_id in (select user_firm_ids()));
