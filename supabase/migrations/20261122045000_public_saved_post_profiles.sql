-- Saved posts are visible in every member's public profile.
-- Saves still belong to the saver: the existing INSERT/DELETE ownership policies stay in place.
drop policy if exists "Members can view public saved posts" on public.saved_posts;
create policy "Members can view public saved posts"
 on public.saved_posts for select to authenticated using (true);

-- Notify authors when someone bookmarks a post in either the Ummah feed or legacy posts.
-- Use the existing permitted 'reaction' notification type and direct-post deep links.
create or replace function public.notify_post_saved()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
 v_author uuid;
 v_actor uuid;
 v_actor_name text;
 v_entity_type text;
 v_post_id uuid;
begin
 if tg_table_name = 'ummah_post_reactions' then
  if new.kind is distinct from 'save' then return new; end if;
  v_post_id := new.post_id;
  select author_id into v_author from public.ummah_feed_posts where id = v_post_id;
  v_entity_type := 'ummah_post';
 else
  v_post_id := new.post_id;
  select user_id into v_author from public.posts where id = v_post_id;
  v_entity_type := 'post';
 end if;

 -- Avoid notifying on self-saves or deleted/orphaned authors.
 if v_author is null or v_author = new.user_id then return new; end if;
 if not exists (select 1 from public.profiles where id = v_author) then return new; end if;
 select coalesce(nullif(trim(display_name),''),nullif(trim(username),''),'A member')
   into v_actor_name from public.profiles where id = new.user_id;
 v_actor := case when found then new.user_id else null end;

 insert into public.notifications
  (recipient_id,actor_id,type,title,body,entity_type,entity_id,metadata)
 values
  (v_author,v_actor,'reaction','🔖 Your post was saved',
   left(coalesce(v_actor_name,'A member') || ' saved your post.',500),
   v_entity_type,v_post_id,
   jsonb_build_object('action','saved_post'));

 return new;
end;
$$;
-- This is a trigger-only privileged routine, not a public callable RPC.
revoke all on function public.notify_post_saved() from public, anon, authenticated;

drop trigger if exists notify_ummah_post_saved on public.ummah_post_reactions;
create trigger notify_ummah_post_saved
 after insert on public.ummah_post_reactions
 for each row execute function public.notify_post_saved();

drop trigger if exists notify_legacy_post_saved on public.saved_posts;
create trigger notify_legacy_post_saved
 after insert on public.saved_posts
 for each row execute function public.notify_post_saved();
