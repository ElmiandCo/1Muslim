-- Video ownership is checked with TikTok Display API before the server invokes this RPC.
revoke execute on function public.share_tiktok_to_ummah(text,text,text) from public, anon, authenticated;

create or replace function public.publish_verified_tiktok_video(p_user_id uuid, p_connected_at timestamptz, p_video_id text, p_title text, p_url text)
returns table(post_id uuid,already_shared boolean)
language plpgsql security definer set search_path=public as $$
declare v_user uuid:=p_user_id;v_post uuid;v_existing uuid;v_body text;
begin
 if v_user is null then raise exception 'Sign in required';end if;
 if p_video_id is null or p_video_id !~ '^[0-9]{8,30}$' then raise exception 'Invalid TikTok video ID';end if;
 if p_url is null or p_url !~ '^https://(www[.])?tiktok[.]com/' then raise exception 'Invalid TikTok URL';end if;
 -- Serialize publication with disconnect/reconnect and reject stale verifications.
 perform 1 from public.tiktok_connections
 where user_id = v_user and connected_at = p_connected_at
 for update;
 if not found then raise exception 'TikTok connection changed'; end if;
 select t.post_id into v_existing from public.tiktok_shared_videos t where t.user_id=v_user and t.video_id=p_video_id;
 if v_existing is not null then return query select v_existing,true;return;end if;
 v_body:=left(trim(coalesce(p_title,'TikTok video')),300)||E'\n'||p_url;
 insert into public.ummah_feed_posts(author_id,body,post_theme) values(v_user,left(v_body,2000),'obsidian') returning id into v_post;
 insert into public.tiktok_shared_videos(user_id,video_id,post_id) values(v_user,p_video_id,v_post);
 return query select v_post,false;
exception when unique_violation then
 select t.post_id into v_existing from public.tiktok_shared_videos t where t.user_id=v_user and t.video_id=p_video_id;
 if v_existing is not null then return query select v_existing,true;return;end if;
 raise;
end $$;
revoke all on function public.publish_verified_tiktok_video(uuid,timestamptz,text,text,text) from public, anon, authenticated;
grant execute on function public.publish_verified_tiktok_video(uuid,timestamptz,text,text,text) to service_role;
