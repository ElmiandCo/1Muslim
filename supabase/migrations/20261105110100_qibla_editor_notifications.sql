-- 1Qibla first-editor-save notification, emitted only for the unique event insertion.
create or replace function public.qibla_notify_first_editor_save()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_title text; v_actor uuid;
begin
 if new.event_key<>'first_editor_save' then return new; end if;
 select title,editor_id into v_title,v_actor from public.qibla_articles where id=new.article_id;
 insert into public.notifications(recipient_id,actor_id,type,title,body,entity_type,entity_id)
 select s.user_id,v_actor,'qibla_approval_needed','1Qibla article ready for approval',
  left(coalesce(v_title,'Untitled article'),200),'qibla_article',new.article_id
 from public.qibla_staff s
 where s.role='approver' and s.user_id<>coalesce(v_actor,'00000000-0000-0000-0000-000000000000'::uuid);
 return new;
end $$;
revoke all on function public.qibla_notify_first_editor_save() from public,anon,authenticated;
drop trigger if exists trg_qibla_first_editor_save on public.qibla_editorial_events;
create trigger trg_qibla_first_editor_save after insert on public.qibla_editorial_events
for each row execute function public.qibla_notify_first_editor_save();
