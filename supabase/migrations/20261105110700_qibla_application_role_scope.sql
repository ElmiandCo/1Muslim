-- Editorial applications are invitations to apply for Writer or Editor only.
-- Approver authority is an administrator-assigned trust role, never an application choice.
-- Additive migration; does not touch regular Posts/comments or existing staff grants.
create or replace function public.qibla_apply_to_editorial(
 p_desired_role text,p_experience text,p_motivation text,
 p_portfolio_url text,p_resume_path text
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_id uuid;
begin
 if v_actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_desired_role is null or p_desired_role not in ('writer','editor')
 then raise exception 'Only writer or editor applications are accepted'; end if;
 if length(coalesce(p_experience,''))>10000 or length(coalesce(p_motivation,''))>10000
 or length(coalesce(p_portfolio_url,''))>2000 then raise exception 'Input too long'; end if;
 if p_resume_path is null
 or p_resume_path !~ ('^'||v_actor::text||'/[0-9a-fA-F-]{36}[.](pdf|doc|docx)$')
 or not exists(select 1 from storage.objects where bucket_id='qibla-resumes' and name=p_resume_path)
 then raise exception 'Valid uploaded resume required'; end if;
 insert into public.qibla_applications(applicant_id,desired_role,experience,motivation,portfolio_url,resume_path)
 values(v_actor,p_desired_role,coalesce(p_experience,''),coalesce(p_motivation,''),nullif(p_portfolio_url,''),p_resume_path)
 returning id into v_id;
 return v_id;
end $$;
revoke all on function public.qibla_apply_to_editorial(text,text,text,text,text) from public,anon;
grant execute on function public.qibla_apply_to_editorial(text,text,text,text,text) to authenticated;
