-- Stage 5: enforce blocks, privacy, reporting at database boundary.
create table if not exists public.dm_blocks (
 blocker_id uuid not null references auth.users(id) on delete cascade,
 blocked_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(blocker_id,blocked_id),
 check(blocker_id<>blocked_id)
);
create table if not exists public.dm_privacy (
 user_id uuid primary key references auth.users(id) on delete cascade,
 allow_requests boolean not null default true,
 updated_at timestamptz not null default now()
);
create table if not exists public.dm_reports (
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 reported_id uuid not null references auth.users(id) on delete cascade,
 conversation_id uuid not null references public.dm_conversations(id) on delete cascade,
 message_id uuid references public.dm_messages(id) on delete set null,
 reason text not null check(reason in ('spam','harassment','hate','sexual_content','other')),
 details text not null default '' check(char_length(details)<=1000),
 status text not null default 'open' check(status in ('open','reviewing','resolved')),
 created_at timestamptz not null default now(),
 check(reporter_id<>reported_id)
);
create index if not exists dm_blocks_target_idx on public.dm_blocks(blocked_id);
create index if not exists dm_reports_status_idx on public.dm_reports(status,created_at desc);
alter table public.dm_blocks enable row level security;
alter table public.dm_privacy enable row level security;
alter table public.dm_reports enable row level security;
create policy dm_blocks_read on public.dm_blocks for select to authenticated using(blocker_id=(select auth.uid()));
create policy dm_blocks_add on public.dm_blocks for insert to authenticated with check(blocker_id=(select auth.uid()));
create policy dm_blocks_remove on public.dm_blocks for delete to authenticated using(blocker_id=(select auth.uid()));
create policy dm_privacy_read on public.dm_privacy for select to authenticated using(user_id=(select auth.uid()));
create policy dm_privacy_insert on public.dm_privacy for insert to authenticated with check(user_id=(select auth.uid()));
create policy dm_privacy_update on public.dm_privacy for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy dm_reports_insert on public.dm_reports for insert to authenticated with check(
 reporter_id=(select auth.uid()) and public.dm_is_participant(conversation_id)
 and exists(select 1 from public.dm_participants p where p.conversation_id=dm_reports.conversation_id and p.user_id=dm_reports.reported_id)
 and (message_id is null or exists(select 1 from public.dm_messages m where m.id=message_id and m.conversation_id=dm_reports.conversation_id and m.sender_id=reported_id))
);
create policy dm_reports_read_own on public.dm_reports for select to authenticated using(reporter_id=(select auth.uid()));
grant select,insert,delete on public.dm_blocks to authenticated;
grant select,insert,update on public.dm_privacy to authenticated;
grant select,insert on public.dm_reports to authenticated;
create or replace function public.dm_can_contact(a uuid,b uuid) returns boolean language sql stable security definer set search_path='' as $$
 select a is not null and b is not null and not exists(select 1 from public.dm_blocks where (blocker_id=a and blocked_id=b) or (blocker_id=b and blocked_id=a))
$$;
revoke all on function public.dm_can_contact(uuid,uuid) from public;
grant execute on function public.dm_can_contact(uuid,uuid) to authenticated;
create or replace function public.dm_start_conversation(other_user uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare cid uuid; me uuid:=auth.uid();
begin
 if me is null or other_user is null or other_user=me then raise exception 'Invalid recipient'; end if;
 if not exists(select 1 from auth.users where id=other_user) then raise exception 'Recipient not found'; end if;
 if not public.dm_can_contact(me,other_user) then raise exception 'Messaging unavailable'; end if;
 select p.conversation_id into cid from public.dm_participants p
 join public.dm_participants q on q.conversation_id=p.conversation_id and q.user_id=other_user
 where p.user_id=me and (select count(*) from public.dm_participants z where z.conversation_id=p.conversation_id)=2 limit 1;
 if cid is not null then return cid; end if;
 if exists(select 1 from public.dm_privacy where user_id=other_user and not allow_requests) then raise exception 'This member is not accepting message requests'; end if;
 perform pg_advisory_xact_lock(hashtextextended(least(me::text,other_user::text)||':'||greatest(me::text,other_user::text),0));
 select p.conversation_id into cid from public.dm_participants p join public.dm_participants q on q.conversation_id=p.conversation_id and q.user_id=other_user where p.user_id=me limit 1;
 if cid is not null then return cid; end if;
 insert into public.dm_conversations(requested_by) values(me) returning id into cid;
 insert into public.dm_participants(conversation_id,user_id) values(cid,me),(cid,other_user);
 return cid;
end $$;
create or replace function public.dm_accept_conversation(cid uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.dm_participants p join public.dm_participants q on q.conversation_id=p.conversation_id and q.user_id<>p.user_id
 where p.conversation_id=cid and p.user_id=auth.uid() and not public.dm_can_contact(p.user_id,q.user_id)) then raise exception 'Messaging unavailable'; end if;
 update public.dm_conversations c set request_status='accepted',updated_at=now()
 where c.id=cid and c.request_status='pending' and c.requested_by<>auth.uid()
 and exists(select 1 from public.dm_participants p where p.conversation_id=cid and p.user_id=auth.uid());
 if not found then raise exception 'Request unavailable'; end if;
end $$;
drop policy if exists dm_messages_send on public.dm_messages;
create policy dm_messages_send on public.dm_messages for insert to authenticated with check(
 sender_id=(select auth.uid()) and public.dm_is_participant(conversation_id)
 and exists(select 1 from public.dm_conversations c where c.id=conversation_id and c.request_status='accepted')
 and not exists(select 1 from public.dm_participants peer where peer.conversation_id=dm_messages.conversation_id and peer.user_id<>sender_id and not public.dm_can_contact(sender_id,peer.user_id))
 and (attachment_path is null or attachment_path like conversation_id::text||'/'||sender_id::text||'/%')
 and (reply_to_id is null or exists(select 1 from public.dm_messages original where original.id=reply_to_id and original.conversation_id=dm_messages.conversation_id))
);
