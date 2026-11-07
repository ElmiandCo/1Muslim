-- One active editorial application per member; staff and administrators cannot apply.
create table if not exists public.qibla_staff_applications (
 id uuid primary key default gen_random_uuid(),
 applicant_id uuid not null references auth.users(id) on delete cascade,
 requested_role text not null check (requested_role in ('writer','editor','approver','publisher')),
 ideas text not null check (char_length(trim(ideas)) between 20 and 3000),
 status text not null default 'pending' check (status in ('pending','approved','denied')),
 reviewer_id uuid references auth.users(id),
 reviewer_note text,
 created_at timestamptz not null default now(),
 reviewed_at timestamptz
);
create unique index if not exists qibla_one_pending_application on public.qibla_staff_applications(applicant_id) where status='pending';
create index if not exists qibla_applications_queue on public.qibla_staff_applications(status,created_at desc);
alter table public.qibla_staff_applications enable row level security;
grant select,insert on public.qibla_staff_applications to authenticated;
create policy "applicant or editorial admin reads requests" on public.qibla_staff_applications
 for select to authenticated using (applicant_id=(select auth.uid()) or public.qibla_has_role(array['admin']));
create policy "eligible member submits one application" on public.qibla_staff_applications
 for insert to authenticated with check (
  applicant_id=(select auth.uid()) and status='pending' and reviewer_id is null and reviewed_at is null
  and not public.qibla_has_role(array['admin'])
  and not exists(select 1 from public.qibla_staff s where s.user_id=(select auth.uid()))
 );
-- Admin review is atomic with role assignment, never trust browser authorization.
create or replace function public.qibla_review_staff_application(p_id uuid,p_approve boolean,p_note text default '')
returns void language plpgsql security definer set search_path=public as $$
declare v public.qibla_staff_applications%rowtype;
begin
 if not public.qibla_has_role(array['admin']) then raise exception 'Editorial admin permission required'; end if;
 select * into v from public.qibla_staff_applications where id=p_id and status='pending' for update;
 if not found then raise exception 'Application is no longer pending'; end if;
 if p_approve then
  if exists(select 1 from public.qibla_staff where user_id=v.applicant_id) then raise exception 'Applicant already has a role'; end if;
  perform public.qibla_assign_role(v.applicant_id,v.requested_role);
 end if;
 update public.qibla_staff_applications set status=case when p_approve then 'approved' else 'denied' end,
 reviewer_id=auth.uid(),reviewer_note=left(coalesce(p_note,''),2000),reviewed_at=now() where id=p_id;
 insert into public.qibla_audit(actor_id,subject_id,action,details)
 values(auth.uid(),v.applicant_id,case when p_approve then 'application_approved' else 'application_denied' end,
 jsonb_build_object('application_id',p_id,'requested_role',v.requested_role));
end $$;
revoke all on function public.qibla_review_staff_application(uuid,boolean,text) from public;
grant execute on function public.qibla_review_staff_application(uuid,boolean,text) to authenticated;
