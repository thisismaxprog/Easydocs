-- Storage bucket and policies for Easydocs
-- In Supabase Dashboard: Storage -> New bucket -> name: "documents", public: false
-- Then run the policies below (or create via Dashboard).

-- Create bucket (if not exists via UI, run this in SQL):
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

-- Policy: users can read files in paths for their firm
-- Path format: firm/{firm_id}/client/{client_id}/{doc_id}-{filename}
create policy "Users can read documents of own firm"
  on storage.objects for select
  using (
    bucket_id = 'documents' and
    (storage.foldername(name))[1] = 'firm' and
    (storage.foldername(name))[2] in (select user_firm_ids()::text)
  );

-- Policy: users can upload to their firm's path
create policy "Users can upload documents to own firm"
  on storage.objects for insert
  with check (
    bucket_id = 'documents' and
    (storage.foldername(name))[1] = 'firm' and
    (storage.foldername(name))[2] in (select user_firm_ids()::text)
  );

-- Policy: users can update/delete their firm's files
create policy "Users can update documents of own firm"
  on storage.objects for update
  using (
    bucket_id = 'documents' and
    (storage.foldername(name))[1] = 'firm' and
    (storage.foldername(name))[2] in (select user_firm_ids()::text)
  );

create policy "Users can delete documents of own firm"
  on storage.objects for delete
  using (
    bucket_id = 'documents' and
    (storage.foldername(name))[1] = 'firm' and
    (storage.foldername(name))[2] in (select user_firm_ids()::text)
  );
