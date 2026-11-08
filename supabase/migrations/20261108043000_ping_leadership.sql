-- Ping leadership is independent from the original invitation creator.
alter table public.muslim_sync_sessions add column if not exists leader_id uuid references auth.users(id);
update public.muslim_sync_sessions set leader_id=initiator_id where leader_id is null;
create table if not exists public.muslim_sync_lead_requests (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.muslim_sync_sessions(id) on delete cascade,
 requester_id uuid not null references auth.users(id),
 status text not null default 'pending' check (status in ('pending','accepted','declined')),
 created_at timestamptz not null default now(),
 unique(session_id,requester_id)
);
alter table public.muslim_sync_lead_requests enable row level security;
create policy "lead requests visible to requester and session leader" on public.muslim_sync_lead_requests for select to authenticated using (
 requester_id=(select auth.uid()) or exists(select 1 from public.muslim_sync_sessions s where s.id=session_id and s.leader_id=(select auth.uid()))
);
create policy "accepted followers request leadership" on public.muslim_sync_lead_requests for insert to authenticated with check (
 requester_id=(select auth.uid()) and status='pending' and exists(
 select 1 from public.muslim_sync_sessions s where s.id=session_id and s.status='accepted' and s.leader_id<> (select auth.uid()) and
 (s.initiator_id=(select auth.uid()) or s.invitee_id=(select auth.uid()) or private.ping_accepted_member(s.id))
 ));
-- Approval is atomic: only the current leader can approve, and only an accepted participant can take over.
create or replace function public.ping_decide_lead_request(p_request uuid,p_accept boolean)
returns boolean language plpgsql security definer set search_path='' as $$
declare r public.muslim_sync_lead_requests%rowtype; s public.muslim_sync_sessions%rowtype;
begin
 select * into r from public.muslim_sync_lead_requests where id=p_request for update;
 if not found or r.status<>'pending' then return false; end if;
 select * into s from public.muslim_sync_sessions where id=r.session_id for update;
 if s.status<>'accepted' or coalesce(s.leader_id,s.initiator_id)<>auth.uid() then return false; end if;
 if not (r.requester_id=s.initiator_id or r.requester_id=s.invitee_id or exists(select 1 from public.muslim_sync_members m where m.session_id=s.id and m.user_id=r.requester_id and m.status='accepted')) then return false; end if;
 update public.muslim_sync_lead_requests set status=case when p_accept then 'accepted' else 'declined' end where id=r.id;
 if p_accept then update public.muslim_sync_sessions set leader_id=r.requester_id where id=s.id; update public.muslim_sync_lead_requests set status='declined' where session_id=s.id and status='pending'; end if;
 return true;
end $$;
revoke all on function public.ping_decide_lead_request(uuid,boolean) from public;
grant execute on function public.ping_decide_lead_request(uuid,boolean) to authenticated;
-- Restrict writes to leader only for navigation; existing broad update policy must be removed.
drop policy if exists "sync participants update" on public.muslim_sync_sessions;
create policy "ping session leader update" on public.muslim_sync_sessions for update to authenticated
 using (leader_id=(select auth.uid()) and status='accepted')
 with check (leader_id=(select auth.uid()) and status in ('accepted','ended'));
-- Invitee can accept or decline only a pending invitation, not change leader/navigation.
create or replace function public.ping_respond_initial(p_session uuid,p_accept boolean)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 update public.muslim_sync_sessions set status=case when p_accept then 'accepted' else 'declined' end
 where id=p_session and invitee_id=auth.uid() and status='pending';
 return found;
end $$;
revoke all on function public.ping_respond_initial(uuid,boolean) from public;
grant execute on function public.ping_respond_initial(uuid,boolean) to authenticated;
