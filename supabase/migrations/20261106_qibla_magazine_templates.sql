-- Store the selected magazine design on each editorial submission.
alter table public.qibla_submissions add column if not exists template_style text not null default 'classic'
check(template_style in ('classic','cinematic','editorial','journal','newsletter'));
create or replace function public.qibla_set_submission_template(p_id uuid,p_template text)
returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if p_template not in ('classic','cinematic','editorial','journal','newsletter') then raise exception 'Invalid template'; end if;
 update public.qibla_submissions set template_style=p_template,updated_at=now()
 where id=p_id and author_id=auth.uid() and status in ('draft','submitted','changes_requested','rejected');
 if not found then raise exception 'You cannot edit this publication template'; end if;
end $$;
revoke all on function public.qibla_set_submission_template(uuid,text) from public;
grant execute on function public.qibla_set_submission_template(uuid,text) to authenticated;
-- Persist visual style metadata in the published story payload.
create or replace function public.qibla_publish_submission(p_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v public.qibla_submissions%rowtype; v_page uuid;
begin
 if not public.qibla_is_admin() then raise exception 'Publisher permission required'; end if;
 select * into v from public.qibla_submissions where id=p_id and status='approved' for update;
 if not found then raise exception 'Approval required before publishing'; end if;
 insert into public.qibla_pages(title,template_type,hero_media_path,section_one,section_two,published,created_by)
 values(v.title,'image',nullif(v.cover_url,''),jsonb_build_object('text',v.subtitle,'magazine_template',v.template_style),jsonb_build_object('text',v.body),true,auth.uid()) returning id into v_page;
 update public.qibla_submissions set status='published',published_page_id=v_page,updated_at=now() where id=p_id;
end $$;
