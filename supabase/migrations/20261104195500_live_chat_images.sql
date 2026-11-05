-- Image attachments for Live Chat: image and caption are one realtime row.
alter table public.live_chat_messages add column if not exists image_path text;
alter table public.live_chat_messages drop constraint if exists live_chat_image_path_valid;
alter table public.live_chat_messages add constraint live_chat_image_path_valid
check (image_path is null or (image_path = stream_id::text || '/' || sender_id::text || '/' || split_part(image_path,'/',3) and image_path like '%.webp' and length(image_path) < 350));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('live-chat-images','live-chat-images',false,5242880,array['image/webp'])
on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists live_chat_image_upload on storage.objects;
create policy live_chat_image_upload on storage.objects for insert to authenticated
with check (bucket_id='live-chat-images'
 and split_part(name,'/',2)=(select auth.uid())::text
 and exists(select 1 from public.live_streams s where s.id::text=split_part(name,'/',1))
 and not exists(select 1 from public.live_chat_mutes m where m.stream_id::text=split_part(name,'/',1) and m.user_id=(select auth.uid()))
);

drop policy if exists live_chat_image_read on storage.objects;
create policy live_chat_image_read on storage.objects for select to authenticated
using (bucket_id='live-chat-images'
 and exists(select 1 from public.live_chat_messages m where m.image_path=name));

drop policy if exists live_chat_image_cleanup on storage.objects;
create policy live_chat_image_cleanup on storage.objects for delete to authenticated
using (bucket_id='live-chat-images' and split_part(name,'/',2)=(select auth.uid())::text
 and not exists(select 1 from public.live_chat_messages m where m.image_path=name));
