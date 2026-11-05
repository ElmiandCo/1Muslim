-- 1Qibla private applications and author submission. Additive; no existing Posts changes.
-- Storage objects must use path <auth.uid()>/<random-uuid>.pdf (or .doc/.docx).
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('qibla-resumes','qibla-resumes',false,10485760,
 array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public=false,file_size_limit=10485760,
allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists qibla_resume_upload_self on storage.objects;
create policy qibla_resume_upload_self on storage.objects for insert to authenticated
with check (
 bucket_id='qibla-resumes'
 and (storage.foldername(name))[1]=auth.uid()::text
 and array_length(storage.foldername(name),1)=1
 and lower(storage.extension(name)) in ('pdf','doc','docx')
);
-- Applicants may read their own resumes; approvers may review applications.
drop policy if exists qibla_resume_read on storage.objects;
create policy qibla_resume_read on storage.objects for select to authenticated
using (
 bucket_id='qibla-resumes'
 and (
  (storage.foldername(name))[1]=auth.uid()::text
  or exists (select 1 from public.qibla_staff where user_id=auth.uid() and role='approver')
 )
);
-- No UPDATE or DELETE policy; avoid replacing another user's application attachment.

create or replace function public.qibla_apply_to_editorial(
 p_desired_role text,p_experience text,p_motivation text,
 p_portfolio_url text,p_resume_path text
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_id uuid;
begin
 if v_actor is null then raise exception 'Authentication required'; end if;
 if p_desired_role not in ('writer','editor','approver') then raise exception 'Invalid role'; end if;
 if length(coalesce(p_experience,''))>10000 or length(coalesce(p_motivation,''))>10000
 or length(coalesce(p_portfolio_url,''))>2000 then raise exception 'Input too long'; end if;
 if p_resume_path is null
 or p_resume_path !~ ('^'||v_actor::text||'/[0-9a-fA-F-]{36}[.](pdf|doc|docx))
 or not exists(select 1 from storage.objects where bucket_id='qibla-resumes' and name=p_resume_path)
 then raise exception 'Valid uploaded resume required'; end if;
 insert into public.qibla_applications(applicant_id,desired_role,experience,motivation,portfolio_url,resume_path)
 values(v_actor,p_desired_role,coalesce(p_experience,''),coalesce(p_motivation,''),nullif(p_portfolio_url,''),p_resume_path)
 returning id into v_id;
 return v_id;
end $$;

create or replace function public.qibla_submit_article(p_article_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();
begin
 if v_actor is null or not exists(select 1 from public.qibla_staff
 where user_id=v_actor and role='writer') then raise exception 'Writer role required'; end if;
 update public.qibla_articles set status='submitted',updated_at=now()
 where id=p_article_id and author_id=v_actor and status='draft'
 and length(trim(title))>0 and length(trim(body))>0;
 if not found then raise exception 'Draft missing, incomplete, or already submitted'; end if;
 return true;
end $$;

revoke all on function public.qibla_apply_to_editorial(text,text,text,text,text) from public,anon;
revoke all on function public.qibla_submit_article(uuid) from public,anon;
grant execute on function public.qibla_apply_to_editorial(text,text,text,text,text) to authenticated;
grant execute on function public.qibla_submit_article(uuid) to authenticated;
)
 or not exists(select 1 from storage.objects where bucket_id='qibla-resumes' and name=p_resume_path)
 then raise exception 'Valid uploaded resume required'; end if;
 insert into public.qibla_applications(applicant_id,desired_role,experience,motivation,portfolio_url,resume_path)
 values(v_actor,p_desired_role,coalesce(p_experience,''),coalesce(p_motivation,''),nullif(p_portfolio_url,''),p_resume_path)
 returning id into v_id;
 return v_id;
end $$;

create or replace function public.qibla_submit_article(p_article_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();
begin
 if v_actor is null or not exists(select 1 from public.qibla_staff
 where user_id=v_actor and role='writer') then raise exception 'Writer role required'; end if;
 update public.qibla_articles set status='submitted',updated_at=now()
 where id=p_article_id and author_id=v_actor and status='draft'
 and length(trim(title))>0 and length(trim(body))>0;
 if not found then raise exception 'Draft missing, incomplete, or already submitted'; end if;
 return true;
end $$;

revoke all on function public.qibla_apply_to_editorial(text,text,text,text,text) from public,anon;
revoke all on function public.qibla_submit_article(uuid) from public,anon;
grant execute on function public.qibla_apply_to_editorial(text,text,text,text,text) to authenticated;
grant execute on function public.qibla_submit_article(uuid) to authenticated;
