-- Allow applicants to clean up their own *unsubmitted* resume uploads.
-- Storage stays private; submitted application attachments cannot be deleted.
-- This supports the client-side cleanup after a failed application RPC.
drop policy if exists qibla_resume_delete_orphan_self on storage.objects;
create policy qibla_resume_delete_orphan_self on storage.objects
for delete to authenticated
using (
 bucket_id = 'qibla-resumes'
 and (storage.foldername(name))[1] = (select auth.uid())::text
 and not exists (
   select 1 from public.qibla_applications a
   where a.resume_path = storage.objects.name
 )
);

-- Prevent two applications from claiming the same resume object.
create unique index if not exists qibla_applications_resume_path_unique
on public.qibla_applications(resume_path);
