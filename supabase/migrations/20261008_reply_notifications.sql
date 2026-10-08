-- Notify the author of a message or featured-video comment when someone replies.
-- Apply only after confirming the production Supabase project and notifications schema.
create or replace function public.notify_dm_reply()
returns trigger language plpgsql security definer set search_path = public as $$
declare original_sender uuid;
begin
  if new.reply_to_id is null then return new; end if;
  select sender_id into original_sender from public.dm_messages
  where id = new.reply_to_id and conversation_id = new.conversation_id;
  if original_sender is not null and original_sender <> new.sender_id then
    insert into public.notifications(recipient_id,type,title,body,entity_type,entity_id)
    values(original_sender,'dm_reply','Someone replied to your message',
      left(new.body,160),'dm_message',new.id::text);
  end if;
  return new;
end;
$$;
drop trigger if exists notify_dm_reply_insert on public.dm_messages;
create trigger notify_dm_reply_insert after insert on public.dm_messages
for each row execute function public.notify_dm_reply();

create or replace function public.notify_featured_comment_reply()
returns trigger language plpgsql security definer set search_path = public as $$
declare original_author uuid;
begin
  if new.parent_id is null then return new; end if;
  select user_id into original_author from public.featured_video_comments
  where id = new.parent_id and video_id = new.video_id;
  if original_author is not null and original_author <> new.user_id then
    insert into public.notifications(recipient_id,type,title,body,entity_type,entity_id)
    values(original_author,'featured_comment_reply','Someone replied to your comment',
      left(new.body,160),'featured_video_comment',new.id::text);
  end if;
  return new;
end;
$$;
drop trigger if exists notify_featured_comment_reply_insert on public.featured_video_comments;
create trigger notify_featured_comment_reply_insert after insert on public.featured_video_comments
for each row execute function public.notify_featured_comment_reply();
