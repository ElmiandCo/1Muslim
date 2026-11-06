-- 1Qibla editorial approval queue. Run this migration before enabling Studio.
create table if not exists public.qibla_submissions (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references auth.users(id) default auth.uid(),
 title text not null check (length(trim(title)) between 3 and 200),
 kind text not null check(kind in ('article','newsletter')),
 subtitle text not null default '',
 body text not null default '',
 cover_url text not null default '',
 status text not null default 'draft' check(status in ('draft','submitted','changes_requested','approved','published','rejected')),
 reviewer_id uuid references auth.users(id),
 review_note text not null default '',
 published_page_id uuid,
 submitted_at timestamptz,
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists qibla_submissions_author_idx on public.qibla_submissions(author_id,updated_at desc);
create index if not exists qibla_submissions_status_idx on public.qibla_submissions(status,submitted_at desc);
alter table public.qibla_submissions enable row level security;
create or replace function public.qibla_is_admin() returns boolean language sql stable security definer set search_path=public as $$
 select auth.uid() is not null and exists(select 1 from public.admin_users where user_id=auth.uid());
$$;
revoke all on function public.qibla_is_admin() from public;
grant execute on function public.qibla_is_admin() to authenticated;
drop policy if exists "qibla submissions read" on public.qibla_submissions;
create policy "qibla submissions read" on public.qibla_submissions for select to authenticated using(author_id=auth.uid() or public.qibla_is_admin());
drop policy if exists "qibla submissions insert" on public.qibla_submissions;
create policy "qibla submissions insert" on public.qibla_submissions for insert to authenticated with check(author_id=auth.uid() and status='draft' and reviewer_id is null and published_page_id is null);
-- All state transitions happen server-side, not through client table updates.
create or replace function public.qibla_save_submission(p_id uuid,p_title text,p_kind text,p_subtitle text,p_body text,p_cover text,p_submit boolean default false)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if length(trim(p_title))<3 or length(trim(p_title))>200 or p_kind not in ('article','newsletter') then raise exception 'Invalid publication details'; end if;
 if p_submit and length(trim(p_body))<20 then raise exception 'Write at least 20 characters before submitting'; end if;
 if p_id is null then
   insert into public.qibla_submissions(author_id,title,kind,subtitle,body,cover_url,status,submitted_at)
   values(auth.uid(),trim(p_title),p_kind,coalesce(p_subtitle,''),coalesce(p_body,''),coalesce(p_cover,''),case when p_submit then 'submitted' else 'draft' end,case when p_submit then now() else null end) returning id into v_id;
 else
   update public.qibla_submissions set title=trim(p_title),kind=p_kind,subtitle=coalesce(p_subtitle,''),body=coalesce(p_body,''),cover_url=coalesce(p_cover,''),status=case when p_submit then 'submitted' else 'draft' end,submitted_at=case when p_submit then now() else null end,review_note='',reviewer_id=null,reviewed_at=null,updated_at=now()
   where id=p_id and author_id=auth.uid() and status in ('draft','changes_requested','rejected') returning id into v_id;
   if v_id is null then raise exception 'Submission is locked or not yours'; end if;
 end if;
 return v_id;
end $$;
create or replace function public.qibla_review_submission(p_id uuid,p_action text,p_note text default '')
returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.qibla_is_admin() then raise exception 'Editor permission required'; end if;
 if p_action not in ('approved','changes_requested','rejected') then raise exception 'Invalid review action'; end if;
 if p_action in ('changes_requested','rejected') and length(trim(coalesce(p_note,'')))=0 then raise exception 'A review note is required'; end if;
 update public.qibla_submissions set status=p_action,review_note=coalesce(p_note,''),reviewer_id=auth.uid(),reviewed_at=now(),updated_at=now()
 where id=p_id and status='submitted';
 if not found then raise exception 'Only submitted items may be reviewed'; end if;
end $$;
create or replace function public.qibla_publish_submission(p_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v public.qibla_submissions%rowtype; v_page uuid;
begin
 if not public.qibla_is_admin() then raise exception 'Publisher permission required'; end if;
 select * into v from public.qibla_submissions where id=p_id and status='approved' for update;
 if not found then raise exception 'Approval required before publishing'; end if;
 insert into public.qibla_pages(title,template_type,hero_media_path,section_one,section_two,published,created_by)
 values(v.title,'image',nullif(v.cover_url,''),jsonb_build_object('text',v.subtitle),jsonb_build_object('text',v.body),true,auth.uid()) returning id into v_page;
 update public.qibla_submissions set status='published',published_page_id=v_page,updated_at=now() where id=p_id;
end $$;
revoke all on function public.qibla_save_submission(uuid,text,text,text,text,text,boolean) from public;
revoke all on function public.qibla_review_submission(uuid,text,text) from public;
revoke all on function public.qibla_publish_submission(uuid) from public;
grant execute on function public.qibla_save_submission(uuid,text,text,text,text,text,boolean) to authenticated;
grant execute on function public.qibla_review_submission(uuid,text,text) to authenticated;
grant execute on function public.qibla_publish_submission(uuid) to authenticated;
