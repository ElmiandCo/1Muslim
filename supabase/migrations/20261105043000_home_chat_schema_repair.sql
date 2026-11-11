-- Follow-up to home chat image migration: allow image-only messages and guest reads.
alter table public.home_room_chat_messages drop constraint if exists home_room_chat_messages_body_check;
alter table public.home_room_chat_messages add constraint home_room_chat_messages_body_check
 check (char_length(body)<=500 and (char_length(body)>=1 or image_path is not null));
alter table public.home_room_chat_messages drop constraint if exists home_room_chat_image_path_safe;
alter table public.home_room_chat_messages add constraint home_room_chat_image_path_safe
 check (image_path is null or image_path ~ ('^' || sender_id::text || '/[0-9a-f-]{36}[.](jpg|png|webp|gif)$'));
drop policy if exists "read recent room chat for guests" on public.home_room_chat_messages;
create policy "read recent room chat for guests" on public.home_room_chat_messages
 for select to anon using (created_at > now() - interval '3 hours');
