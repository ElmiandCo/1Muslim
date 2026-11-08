-- Only the verified Qibla SuperAdmin can enact role grants, changes or removals.
create table if not exists public.qibla_role_requests(
 id uuid primary key default gen_random_uuid(),
 target_user_id uuid not null references auth.users(id) on delete cascade,
 requested_role text,
 action text not null check(action in ('assign','remove')),
 requested_by uuid not null references auth.users(id),
 status text not null default 'pending' check(status in ('pending','approved','denied')),
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 constraint qibla_request_valid_role check((action='remove' and requested_role is null) or (action='assign' and requested_role in ('writer','editor','approver','publisher','admin')))
);
create unique index if not exists qibla_role_one_pending on public.qibla_role_requests(target_user_id) where status='pending';
alter table public.qibla_role_requests enable row level security;
drop policy if exists "editorial admins see role requests" on public.qibla_role_requests;
create policy "editorial admins see role requests" on public.qibla_role_requests for select to authenticated using(public.qibla_has_role(array['admin']));
grant select on public.qibla_role_requests to authenticated;

create or replace function public.qibla_assign_role(p_user_id uuid,p_role text)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.qibla_is_superadmin() then raise exception 'Only SuperAdmin may assign or change editorial roles'; end if;
 if p_user_id is null or p_role not in ('writer','editor','approver','publisher','admin') then raise exception 'Invalid staff assignment'; end if;
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'Registered verified member required'; end if;
 if exists(select 1 from auth.users where id=p_user_id and lower(email)='hudhudbyelmi@gmail.com') then raise exception 'Cannot reassign SuperAdmin'; end if;
 insert into public.qibla_staff(user_id,role,assigned_by) values(p_user_id,p_role,auth.uid())
 on conflict(user_id) do update set role=excluded.role,assigned_by=excluded.assigned_by,assigned_at=now();
 insert into public.qibla_audit(actor_id,subject_id,action,details) values(auth.uid(),p_user_id,'role_assigned',jsonb_build_object('role',p_role));
end $$;

create or replace function public.qibla_remove_role(p_user_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_role text;
begin
 if not public.qibla_is_superadmin() then raise exception 'Only SuperAdmin may remove editorial roles'; end if;
 if exists(select 1 from auth.users where id=p_user_id and lower(email)='hudhudbyelmi@gmail.com') then raise exception 'Cannot remove SuperAdmin'; end if;
 select role into v_role from public.qibla_staff where user_id=p_user_id;
 if v_role is null then raise exception 'Member has no editorial role'; end if;
 delete from public.qibla_staff where user_id=p_user_id;
 insert into public.qibla_audit(actor_id,subject_id,action,details) values(auth.uid(),p_user_id,'role_removed',jsonb_build_object('previous_role',v_role));
end $$;

create or replace function public.qibla_request_role_change(p_user_id uuid,p_role text,p_action text default 'assign')
returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.qibla_has_role(array['admin']) then raise exception 'Editorial admin permission required'; end if;
 if p_action not in ('assign','remove') or (p_action='assign' and p_role not in ('writer','editor','approver','publisher','admin')) then raise exception 'Invalid request'; end if;
 if p_action='assign' and p_role='admin' and not public.qibla_is_superadmin() then raise exception 'Only SuperAdmin may propose admin appointments'; end if;
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'Registered verified member required'; end if;
 if exists(select 1 from auth.users where id=p_user_id and lower(email)='hudhudbyelmi@gmail.com') then raise exception 'SuperAdmin cannot be reassigned'; end if;
 insert into public.qibla_role_requests(target_user_id,requested_role,action,requested_by)
 values(p_user_id,case when p_action='remove' then null else p_role end,p_action,auth.uid());
 insert into public.qibla_audit(actor_id,subject_id,action,details) values(auth.uid(),p_user_id,'role_change_requested',jsonb_build_object('role',p_role,'action',p_action));
end $$;
revoke all on function public.qibla_request_role_change(uuid,text,text) from public;
grant execute on function public.qibla_request_role_change(uuid,text,text) to authenticated;

create or replace function public.qibla_review_role_request(p_id uuid,p_approve boolean)
returns void language plpgsql security definer set search_path=public as $$
declare v public.qibla_role_requests%rowtype;
begin
 if not public.qibla_is_superadmin() then raise exception 'Only SuperAdmin can approve membership changes'; end if;
 select * into v from public.qibla_role_requests where id=p_id and status='pending' for update;
 if not found then raise exception 'Request is no longer pending'; end if;
 if p_approve then
  if v.action='remove' then perform public.qibla_remove_role(v.target_user_id);
  else perform public.qibla_assign_role(v.target_user_id,v.requested_role); end if;
 end if;
 update public.qibla_role_requests set status=case when p_approve then 'approved' else 'denied' end,reviewed_by=auth.uid(),reviewed_at=now() where id=p_id;
 insert into public.qibla_audit(actor_id,subject_id,action,details) values(auth.uid(),v.target_user_id,case when p_approve then 'role_request_approved' else 'role_request_denied' end,jsonb_build_object('request_id',p_id,'role',v.requested_role,'action',v.action));
end $$;
revoke all on function public.qibla_review_role_request(uuid,boolean) from public;
grant execute on function public.qibla_review_role_request(uuid,boolean) to authenticated;

-- Application approvals are also SuperAdmin-only to prevent bypassing the gate.
create or replace function public.qibla_review_staff_application(p_id uuid,p_approve boolean,p_note text default '')
returns void language plpgsql security definer set search_path=public as $$
declare v public.qibla_staff_applications%rowtype;
begin
 if not public.qibla_is_superadmin() then raise exception 'Only SuperAdmin can approve editorial membership applications'; end if;
 select * into v from public.qibla_staff_applications where id=p_id and status='pending' for update;
 if not found then raise exception 'Application is no longer pending'; end if;
 if p_approve then
  if exists(select 1 from public.qibla_staff where user_id=v.applicant_id) then raise exception 'Applicant already has a role'; end if;
  perform public.qibla_assign_role(v.applicant_id,v.requested_role);
 end if;
 update public.qibla_staff_applications set status=case when p_approve then 'approved' else 'denied' end,reviewer_id=auth.uid(),reviewer_note=left(coalesce(p_note,''),2000),reviewed_at=now() where id=p_id;
 insert into public.qibla_audit(actor_id,subject_id,action,details) values(auth.uid(),v.applicant_id,case when p_approve then 'application_approved' else 'application_denied' end,jsonb_build_object('application_id',p_id,'requested_role',v.requested_role));
end $$;