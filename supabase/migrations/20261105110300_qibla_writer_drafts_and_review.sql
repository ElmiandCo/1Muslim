-- 1Qibla writer draft lifecycle and controlled application review.
-- Additive migration; no changes to public.posts, comments, or existing XP paths.
create or replace function public.qibla_create_draft(
 p_title text default '', p_subtitle text default '', p_body text default '',
 p_template text default 'classic'
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_actor uuid := auth.uid(); v_id uuid;
begin
 if v_actor is null or not exists (
  select 1 from public.qibla_staff where user_id=v_actor and role='writer'
 ) then raise exception 'Writer role required' using errcode='42501'; end if;
 if p_template is null or p_template not in ('classic','feature')
 then raise exception 'Invalid template'; end if;
 if length(coalesce(p_title,''))>250 or length(coalesce(p_subtitle,''))>500
 or length(coalesce(p_body,''))>1000000 then raise exception 'Content too long'; end if;
 insert into public.qibla_articles(author_id,title,subtitle,body,template,status)
 values(v_actor,coalesce(p_title,''),coalesce(p_subtitle,''),coalesce(p_body,''),p_template,'draft')
 returning id into v_id;
 return v_id;
end $$;

create or replace function public.qibla_update_draft(
 p_article_id uuid,p_title text,p_subtitle text,p_body text,p_template text
) returns integer language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_revision integer;
begin
 if v_actor is null or not exists (
  select 1 from public.qibla_staff where user_id=v_actor and role='writer'
 ) then raise exception 'Writer role required' using errcode='42501'; end if;
 if p_template is null or p_template not in ('classic','feature')
 then raise exception 'Invalid template'; end if;
 if length(coalesce(p_title,''))>250 or length(coalesce(p_subtitle,''))>500
 or length(coalesce(p_body,''))>1000000 then raise exception 'Content too long'; end if;
 update public.qibla_articles
 set title=coalesce(p_title,''),subtitle=coalesce(p_subtitle,''),
 body=coalesce(p_body,''),template=p_template,revision=revision+1,updated_at=now()
 where id=p_article_id and author_id=v_actor and status='draft'
 returning revision into v_revision;
 if not found then raise exception 'Draft not found or not editable'; end if;
 return v_revision;
end $$;

-- Approvers can review applications but cannot grant their own staff role.
-- Staff grants must be performed by a separate trusted administrator operation.
create or replace function public.qibla_review_application(
 p_application_id uuid,p_status text
) returns boolean language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();
begin
 if v_actor is null or not exists (
  select 1 from public.qibla_staff where user_id=v_actor and role='approver'
 ) then raise exception 'Approver role required' using errcode='42501'; end if;
 if p_status not in ('reviewing','accepted','declined') then
  raise exception 'Invalid review status'; end if;
 update public.qibla_applications set status=p_status
 where id=p_application_id and status in ('pending','reviewing');
 if not found then raise exception 'Application not found or already decided'; end if;
 return true;
end $$;

revoke all on function public.qibla_create_draft(text,text,text,text) from public,anon;
revoke all on function public.qibla_update_draft(uuid,text,text,text,text) from public,anon;
revoke all on function public.qibla_review_application(uuid,text) from public,anon;
grant execute on function public.qibla_create_draft(text,text,text,text) to authenticated;
grant execute on function public.qibla_update_draft(uuid,text,text,text,text) to authenticated;
grant execute on function public.qibla_review_application(uuid,text) to authenticated;
