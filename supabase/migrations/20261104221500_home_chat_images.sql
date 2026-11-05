-- Home room chat image attachments. Apply before deploying the chat UI.
alter table public.home_room_chat_messages
 add column if not exists image_path text;
alter table public.home_room_chat_messages
 alter column body set default '';
alter table public.home_room_chat_messages
 drop constraint if exists home_room_chat_image_path_safe;
alter table public.home_room_chat_messages
 add constraint home_room_chat_image_path_safe
 check (image_path is null or (image_path ~ ('^' || sender_id::text || '/[0-9a-f-]{36}\\.(jpg|png|webp|gif)$')));
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
 values ('home-chat-images','home-chat-images',true,5242880,array['image/jpeg','image/png','image/webp','image/gif'])
 on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "home_chat_images_insert_own" on storage.objects;
create policy "home_chat_images_insert_own" on storage.objects for insert to authenticated
 with check (bucket_id='home-chat-images' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "home_chat_images_delete_own" on storage.objects;
create policy "home_chat_images_delete_own" on storage.objects for delete to authenticated
 using (bucket_id='home-chat-images' and (storage.foldername(name))[1]=auth.uid()::text);
-- Existing home_room_chat_messages RLS continues to enforce authenticated posting.
