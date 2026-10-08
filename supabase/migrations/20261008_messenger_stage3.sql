-- Messenger stage 3: media, replies and emoji reactions.
alter table public.dm_messages add column if not exists attachment_path text;
alter table public.dm_messages add column if not exists attachment_type text;
alter table public.dm_messages add column if not exists reply_to_id uuid references public.dm_messages(id) on delete set null;
alter table public.dm_messages add constraint dm_attachment_metadata_check check (
 (attachment_path is null and attachment_type is null) or
 (attachment_path is not null and attachment_type in ('image','video','audio','file'))
);
create table if not exists public.dm_reactions (
 message_id uuid not null references public.dm_messages(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 emoji text not null check (char_length(emoji) between 1 and 16),
 created_at timestamptz not null default now(),
 primary key(message_id,user_id,emoji)
);
alter table public.dm_reactions enable row level security;
create policy dm_reactions_read on public.dm_reactions for select to authenticated using (
 exists(select 1 from public.dm_messages m where m.id=message_id and public.dm_is_participant(m.conversation_id))
);
create policy dm_reactions_insert on public.dm_reactions for insert to authenticated with check (
 user_id=auth.uid() and exists(select 1 from public.dm_messages m join public.dm_conversations c on c.id=m.conversation_id where m.id=message_id and c.request_status='accepted' and public.dm_is_participant(m.conversation_id))
);
create policy dm_reactions_delete on public.dm_reactions for delete to authenticated using (user_id=auth.uid());
grant select,insert,delete on public.dm_reactions to authenticated;
-- Restrict attachment metadata and reply references to the same conversation.
drop policy if exists dm_messages_send on public.dm_messages;
create policy dm_messages_send on public.dm_messages for insert to authenticated with check (
 sender_id=auth.uid() and public.dm_is_participant(conversation_id)
 and exists(select 1 from public.dm_conversations c where c.id=conversation_id and c.request_status='accepted')
 and (reply_to_id is null or exists(select 1 from public.dm_messages parent where parent.id=reply_to_id and parent.conversation_id=conversation_id))
 and (attachment_path is null or (attachment_path like conversation_id::text||'/'||auth.uid()::text||'/%' and length(attachment_path)<512))
);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('dm-attachments','dm-attachments',false,26214400,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','audio/webm','audio/mp4','audio/mpeg','audio/ogg','application/pdf','text/plain'])
on conflict(id) do update set public=false,file_size_limit=26214400,allowed_mime_types=excluded.allowed_mime_types;
create policy dm_attachment_read on storage.objects for select to authenticated using (
 bucket_id='dm-attachments' and public.dm_is_participant((split_part(name,'/',1))::uuid)
);
create policy dm_attachment_upload on storage.objects for insert to authenticated with check (
 bucket_id='dm-attachments'
 and split_part(name,'/',2)=auth.uid()::text
 and public.dm_is_participant((split_part(name,'/',1))::uuid)
 and exists(select 1 from public.dm_conversations c where c.id=(split_part(name,'/',1))::uuid and c.request_status='accepted')
);
