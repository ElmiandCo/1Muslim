-- Defense-in-depth for 1Qibla editorial publication. Additive; Posts/comments untouched.
-- Reject oversized or NULL editor edits before writing revisions or firing notifications.
create or replace function public.qibla_save_editor_revision(
 p_article_id uuid,p_title text,p_subtitle text,p_body text
) returns integer language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_revision integer;
begin
 if v_actor is null or not exists (
  select 1 from public.qibla_staff where user_id=v_actor and role in ('editor','approver')
 ) then raise exception 'Editorial role required' using errcode='42501'; end if;
 if p_title is null or length(trim(p_title))=0 or length(p_title)>250
  or p_subtitle is null or length(p_subtitle)>500
  or p_body is null or length(trim(p_body))=0 or length(p_body)>1000000
 then raise exception 'Invalid article content'; end if;
 perform 1 from public.qibla_articles
  where id=p_article_id and status in ('submitted','editing','awaiting_approval') for update;
 if not found then raise exception 'Article not editable'; end if;
 update public.qibla_articles set
  title=p_title,subtitle=p_subtitle,body=p_body,editor_id=v_actor,
  revision=revision+1,status='awaiting_approval',updated_at=now(),
  first_editor_save_at=coalesce(first_editor_save_at,now())
 where id=p_article_id returning revision into v_revision;
 insert into public.qibla_article_revisions(article_id,editor_id,revision,title,subtitle,body)
 values(p_article_id,v_actor,v_revision,p_title,p_subtitle,p_body);
 insert into public.qibla_editorial_events(article_id,event_key)
 values(p_article_id,'first_editor_save') on conflict do nothing;
 return v_revision;
end $$;

-- The first successful editorial save is mandatory before publishing.
-- A locked article row serializes concurrent approvals; the XP award primary key
-- ensures only one increment on first publication, even after retries.
create or replace function public.qibla_publish_article(p_article_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_author uuid; v_inserted integer;
begin
 if v_actor is null or not exists (
  select 1 from public.qibla_staff where user_id=v_actor and role='approver'
 ) then raise exception 'Approver role required' using errcode='42501'; end if;
 select author_id into v_author from public.qibla_articles
 where id=p_article_id
  and status in ('awaiting_approval','published')
  and first_editor_save_at is not null
  and length(trim(title))>0 and length(trim(body))>0
 for update;
 if not found then raise exception 'Article is not ready for approval'; end if;
 update public.qibla_articles set status='published',
  published_at=coalesce(published_at,now()),updated_at=now()
 where id=p_article_id;
 insert into public.qibla_xp_awards(article_id,user_id)
 values(p_article_id,v_author) on conflict do nothing;
 get diagnostics v_inserted=row_count;
 if v_inserted=1 then
  update public.profiles set xp_total=coalesce(xp_total,0)+2000 where id=v_author;
  if not found then raise exception 'Author profile not found'; end if;
 end if;
 return v_inserted=1;
end $$;

revoke all on function public.qibla_save_editor_revision(uuid,text,text,text) from public,anon;
revoke all on function public.qibla_publish_article(uuid) from public,anon;
grant execute on function public.qibla_save_editor_revision(uuid,text,text,text) to authenticated;
grant execute on function public.qibla_publish_article(uuid) to authenticated;
