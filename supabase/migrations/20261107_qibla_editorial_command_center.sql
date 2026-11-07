-- Qibla editorial roles: backend-authorized and auditable.
create table if not exists public.qibla_staff (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check(role in ('writer','editor','approver','publisher','admin')),
 assigned_by uuid references auth.users(id),
 assigned_at timestamptz not null default now()
);
create table if not exists public.qibla_audit (
 id bigint generated always as identity primary key,
 actor_id uuid references auth.users(id),
 subject_id uuid,
 action text not null,
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists qibla_audit_created_idx on public.qibla_audit(created_at desc);
alter table public.qibla_staff enable row level security;
alter table public.qibla_audit enable row level security;
create or replace function public.qibla_is_superadmin()
returns boolean language sql stable security definer set search_path=public as $$
 select auth.uid() is not null and exists (
  select 1 from auth.users u where u.id=auth.uid()
  and lower(u.email)='hudhudbyelmi@gmail.com'
  and u.email_confirmed_at is not null
 );
$$;
create or replace function public.qibla_has_role(p_roles text[])
returns boolean language sql stable security definer set search_path=public as $$
 select public.qibla_is_superadmin() or exists (
  select 1 from public.qibla_staff s where s.user_id=auth.uid() and s.role=any(p_roles)
 ) or (public.qibla_is_admin() and 'admin'=any(p_roles));
$$;
drop policy if exists "qibla staff read" on public.qibla_staff;
create policy "qibla staff read" on public.qibla_staff for select to authenticated
 using(user_id=auth.uid() or public.qibla_has_role(array['admin']));
drop policy if exists "qibla audit read" on public.qibla_audit;
create policy "qibla audit read" on public.qibla_audit for select to authenticated
 using(public.qibla_has_role(array['admin']));
create or replace function public.qibla_assign_role(p_user_id uuid,p_role text)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.qibla_has_role(array['admin']) then raise exception 'Qibla admin permission required'; end if;
 if p_user_id is null or p_role not in ('writer','editor','approver','publisher','admin') then raise exception 'Invalid staff assignment'; end if;
 if p_role='admin' and not public.qibla_is_superadmin() then raise exception 'Only the SuperAdmin can appoint admins'; end if;
 if exists(select 1 from auth.users where id=p_user_id and lower(email)='hudhudbyelmi@gmail.com') then
  raise exception 'The SuperAdmin account cannot be reassigned';
 end if;
 insert into public.qibla_staff(user_id,role,assigned_by) values(p_user_id,p_role,auth.uid())
 on conflict(user_id) do update set role=excluded.role,assigned_by=excluded.assigned_by,assigned_at=now();
 insert into public.qibla_audit(actor_id,subject_id,action,details)
 values(auth.uid(),p_user_id,'role_assigned',jsonb_build_object('role',p_role));
end $$;
create or replace function public.qibla_remove_role(p_user_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_role text;
begin
 if not public.qibla_has_role(array['admin']) then raise exception 'Qibla admin permission required'; end if;
 select role into v_role from public.qibla_staff where user_id=p_user_id;
 if v_role='admin' and not public.qibla_is_superadmin() then raise exception 'Only SuperAdmin can remove admins'; end if;
 if exists(select 1 from auth.users where id=p_user_id and lower(email)='hudhudbyelmi@gmail.com') then raise exception 'Cannot remove SuperAdmin'; end if;
 delete from public.qibla_staff where user_id=p_user_id;
 insert into public.qibla_audit(actor_id,subject_id,action,details)
 values(auth.uid(),p_user_id,'role_removed',jsonb_build_object('previous_role',v_role));
end $$;
-- Existing editorial functions retain their signatures; enforce distinct responsibilities.
create or replace function public.qibla_review_submission(p_id uuid,p_action text,p_note text default '')
returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.qibla_has_role(array['approver','admin']) then raise exception 'Approver permission required'; end if;
 if p_action not in ('approved','changes_requested','rejected') then raise exception 'Invalid review action'; end if;
 if p_action in ('changes_requested','rejected') and length(trim(coalesce(p_note,'')))=0 then raise exception 'A review note is required'; end if;
 update public.qibla_submissions set status=p_action,review_note=coalesce(p_note,''),reviewer_id=auth.uid(),reviewed_at=now(),updated_at=now()
 where id=p_id and status='submitted';
 if not found then raise exception 'Only submitted items may be reviewed'; end if;
 insert into public.qibla_audit(actor_id,subject_id,action,details) values(auth.uid(),p_id,p_action,jsonb_build_object('note',coalesce(p_note,'')));
end $$;
create or replace function public.qibla_publish_submission(p_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v public.qibla_submissions%rowtype; v_page uuid;
begin
 if not public.qibla_has_role(array['publisher','admin']) then raise exception 'Publisher permission required'; end if;
 select * into v from public.qibla_submissions where id=p_id and status='approved' for update;
 if not found then raise exception 'Approval required before publishing'; end if;
 insert into public.qibla_pages(title,template_type,hero_media_path,section_one,section_two,published,created_by)
 values(v.title,'image',nullif(v.cover_url,''),jsonb_build_object('text',v.subtitle),jsonb_build_object('text',v.body),true,auth.uid()) returning id into v_page;
 update public.qibla_submissions set status='published',published_page_id=v_page,updated_at=now() where id=p_id;
 insert into public.qibla_audit(actor_id,subject_id,action,details) values(auth.uid(),p_id,'published',jsonb_build_object('page_id',v_page,'kind',v.kind));
end $$;
-- Live edits are limited to admins and publishers, preserving submission/page identity.
create or replace function public.qibla_update_published(p_id uuid,p_title text,p_subtitle text,p_body text,p_cover text)
returns void language plpgsql security definer set search_path=public as $$
declare v_page uuid;
begin
 if not public.qibla_has_role(array['admin','publisher']) then raise exception 'Publisher permission required'; end if;
 if length(trim(coalesce(p_title,''))) not between 3 and 200 then raise exception 'Invalid title'; end if;
 select published_page_id into v_page from public.qibla_submissions where id=p_id and status='published' for update;
 if v_page is null then raise exception 'Published submission not found'; end if;
 update public.qibla_submissions set title=trim(p_title),subtitle=coalesce(p_subtitle,''),body=coalesce(p_body,''),cover_url=coalesce(p_cover,''),updated_at=now() where id=p_id;
 update public.qibla_pages set title=trim(p_title),hero_media_path=nullif(p_cover,''),section_one=jsonb_build_object('text',coalesce(p_subtitle,'')),section_two=jsonb_build_object('text',coalesce(p_body,'')) where id=v_page;
 insert into public.qibla_audit(actor_id,subject_id,action,details) values(auth.uid(),p_id,'live_edited',jsonb_build_object('page_id',v_page));
end $$;
create or replace function public.qibla_unpublish(p_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_page uuid;
begin
 if not public.qibla_has_role(array['admin']) then raise exception 'Admin permission required'; end if;
 select published_page_id into v_page from public.qibla_submissions where id=p_id and status='published' for update;
 if v_page is null then raise exception 'Published submission not found'; end if;
 update public.qibla_pages set published=false where id=v_page;
 update public.qibla_submissions set status='approved',updated_at=now() where id=p_id;
 insert into public.qibla_audit(actor_id,subject_id,action,details) values(auth.uid(),p_id,'unpublished',jsonb_build_object('page_id',v_page));
end $$;
revoke all on function public.qibla_is_superadmin() from public;
revoke all on function public.qibla_has_role(text[]) from public;
revoke all on function public.qibla_assign_role(uuid,text) from public;
revoke all on function public.qibla_remove_role(uuid) from public;
revoke all on function public.qibla_update_published(uuid,text,text,text,text) from public;
revoke all on function public.qibla_unpublish(uuid) from public;
grant execute on function public.qibla_is_superadmin() to authenticated;
grant execute on function public.qibla_has_role(text[]) to authenticated;
grant execute on function public.qibla_assign_role(uuid,text) to authenticated;
grant execute on function public.qibla_remove_role(uuid) to authenticated;
grant execute on function public.qibla_update_published(uuid,text,text,text,text) to authenticated;
grant execute on function public.qibla_unpublish(uuid) to authenticated;
