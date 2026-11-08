-- Require an approved editorial role for all unpublished submissions.
drop policy if exists "qibla submissions insert" on public.qibla_submissions;
create policy "qibla submissions insert" on public.qibla_submissions for insert to authenticated
with check (author_id=auth.uid() and status='draft' and reviewer_id is null and published_page_id is null and (public.qibla_is_superadmin() or exists(select 1 from public.qibla_staff s where s.user_id=auth.uid() and s.role in ('writer','editor','approver','publisher','admin'))));
drop policy if exists "qibla submissions read" on public.qibla_submissions;
create policy "qibla submissions read" on public.qibla_submissions for select to authenticated
using ((author_id=auth.uid() and (public.qibla_is_superadmin() or exists(select 1 from public.qibla_staff s where s.user_id=auth.uid()))) or public.qibla_has_role(array['admin','editor','approver','publisher']));
create or replace function public.qibla_save_submission(p_id uuid,p_title text,p_kind text,p_subtitle text,p_body text,p_cover text,p_submit boolean default false)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if not (public.qibla_is_superadmin() or exists(select 1 from public.qibla_staff where user_id=auth.uid() and role in ('writer','editor','approver','publisher','admin'))) then raise exception 'Approved editorial membership required'; end if;
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