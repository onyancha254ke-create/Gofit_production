-- Run this AFTER creating a bucket named 'transformation-photos' in Supabase Storage.
-- IMPORTANT: leave this bucket PRIVATE (do not toggle "Public bucket" on) — these are
-- personal photos. Access is controlled entirely by these policies instead.
--
-- Files must be uploaded under a path like: <client's own auth uid>/<filename>
-- so these policies can tell whose photo it is.

create policy "clients upload own transformation photos"
on storage.objects for insert
with check (
  bucket_id = 'transformation-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "clients view own transformation photos"
on storage.objects for select
using (
  bucket_id = 'transformation-photos'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_trainer_of(((storage.foldername(name))[1])::uuid)
    or public.is_admin()
  )
);

create policy "clients delete own transformation photos"
on storage.objects for delete
using (
  bucket_id = 'transformation-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
