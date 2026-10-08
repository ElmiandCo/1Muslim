-- Stage 2: private read receipts
create policy "dm_participants_update_read" on public.dm_participants for update to authenticated
 using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
grant update(last_read_at) on public.dm_participants to authenticated;
create index if not exists dm_messages_unread_idx on public.dm_messages(conversation_id,created_at);
