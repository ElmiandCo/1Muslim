create or replace function public.qibla_update_published(p_id uuid,p_title text,p_subtitle text,p_body text,p_cover text)
returns void language plpgsql security definer set search_path=public as $$
declare v public.qibla_submissions%rowtype; v_previous jsonb;
begin
 if not public.qibla_is_superadmin() then raise exception 'Only SuperAdmin can edit published stories'; end if;
 if length(trim(coalesce(p_title,''))) not between 3 and 200 then raise exception 'Invalid title'; end if;
 select * into v from public.qibla_submissions where id=p_id and status='published' for update;
 if not found or v.published_page_id is null then raise exception 'Published submission not found'; end if;
 v_previous=jsonb_build_object('title',v.title,'subtitle',v.subtitle,'body',v.body,'cover_url',v.cover_url);
 update public.qibla_submissions set title=trim(p_title),subtitle=coalesce(p_subtitle,''),body=coalesce(p_body,''),cover_url=coalesce(p_cover,''),updated_at=now() where id=p_id;
 update public.qibla_pages set title=trim(p_title),hero_media_path=nullif(p_cover,''),section_one=jsonb_build_object('text',coalesce(p_subtitle,'')),section_two=jsonb_build_object('text',coalesce(p_body,'')) where id=v.published_page_id;
 if not found then raise exception 'Published page missing'; end if;
 insert into public.qibla_audit(actor_id,subject_id,action,details) values(auth.uid(),p_id,'live_edited',jsonb_build_object('page_id',v.published_page_id,'before',v_previous,'after',jsonb_build_object('title',trim(p_title),'subtitle',p_subtitle,'body',p_body,'cover_url',p_cover)));
end $$;