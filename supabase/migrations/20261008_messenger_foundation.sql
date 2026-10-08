-- Stage 1: Messenger foundation. Run in the 1Muslim Supabase SQL editor.
create extension if not exists pgcrypto;
create table if not exists public.dm_conversations (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.dm_participants (
 conversation_id uuid not null references public.dm_conversations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 joined_at timestamptz not null default now(),
 last_read_at timestamptz,
 primary key(conversation_id,user_id)
);
create table if not exists public.dm_messages (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null references public.dm_conversations(id) on delete cascade,
 sender_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 body text not null check (char_length(trim(body)) between 1 and 4000),
 created_at timestamptz not null default now(),
 deleted_at timestamptz
);
create index if not exists dm_messages_thread_idx on public.dm_messages(conversation_id,created_at desc);
create index if not exists dm_participants_user_idx on public.dm_participants(user_id);
create or replace function public.dm_is_participant(cid uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.dm_participants where conversation_id=cid and user_id=(select auth.uid()));
$$;
revoke all on function public.dm_is_participant(uuid) from public;
grant execute on function public.dm_is_participant(uuid) to authenticated;
alter table public.dm_conversations enable row level security;
alter table public.dm_participants enable row level security;
alter table public.dm_messages enable row level security;
create policy "dm_conversations_read" on public.dm_conversations for select to authenticated using (public.dm_is_participant(id));
create policy "dm_participants_read" on public.dm_participants for select to authenticated using (public.dm_is_participant(conversation_id));
create policy "dm_messages_read" on public.dm_messages for select to authenticated using (public.dm_is_participant(conversation_id));
create policy "dm_messages_send" on public.dm_messages for insert to authenticated with check (sender_id=(select auth.uid()) and public.dm_is_participant(conversation_id));
-- Conversations must be created through a controlled RPC to avoid unauthorized membership injection.
create or replace function public.dm_start_conversation(other_user uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare cid uuid; me uuid := auth.uid();
begin
 if me is null or other_user is null or other_user=me then raise exception 'Invalid recipient'; end if;
 if not exists(select 1 from auth.users where id=other_user) then raise exception 'Recipient not found'; end if;
 select p.conversation_id into cid from public.dm_participants p
 join public.dm_participants q on q.conversation_id=p.conversation_id and q.user_id=other_user
 where p.user_id=me and (select count(*) from public.dm_participants z where z.conversation_id=p.conversation_id)=2
 limit 1;
 if cid is not null then return cid; end if;
 insert into public.dm_conversations default values returning id into cid;
 insert into public.dm_participants(conversation_id,user_id) values(cid,me),(cid,other_user);
 return cid;
end $$;
revoke all on function public.dm_start_conversation(uuid) from public;
grant execute on function public.dm_start_conversation(uuid) to authenticated;
-- Phase 5 will add request approval and blocking checks before enabling new conversations in production.
