-- Studieplattform: dokumentopplasting + AI-analyse
-- Kjør med: supabase db push  (eller lim inn i Supabase SQL editor)

-- Status-sporing for AI-analysen av opplastede dokumenter.
alter table public.documents
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'processing', 'done', 'error')),
  add column if not exists error_message text;

-- Privat Storage-bucket for opplastede pensum/undervisningsplaner.
insert into storage.buckets (id, name, public)
values ('course-documents', 'course-documents', false)
on conflict (id) do nothing;

-- Filer lagres som {user_id}/{course_id}/{filnavn} — policyene speiler
-- "own X"-mønsteret fra 0001_init.sql, men på mappenavnet i stedet for en FK.
create policy "own course-documents read" on storage.objects for select
  using (bucket_id = 'course-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own course-documents insert" on storage.objects for insert
  with check (bucket_id = 'course-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own course-documents delete" on storage.objects for delete
  using (bucket_id = 'course-documents' and (storage.foldername(name))[1] = auth.uid()::text);
