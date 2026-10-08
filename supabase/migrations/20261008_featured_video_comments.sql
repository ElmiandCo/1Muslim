-- Comments on editorially featured videos; public reading, authenticated posting.
create table if not exists public.featured_video_comments (
  id uuid primary key default gen_random_uuid(),
  video_id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists featured_video_comments_video_created_idx
  on public.featured_video_comments (video_id, created_at desc);
alter table public.featured_video_comments enable row level security;
drop policy if exists "Anyone can read featured video comments" on public.featured_video_comments;
create policy "Anyone can read featured video comments" on public.featured_video_comments
  for select to anon, authenticated using (true);
drop policy if exists "Members can comment as themselves" on public.featured_video_comments;
create policy "Members can comment as themselves" on public.featured_video_comments
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Members can delete own comments" on public.featured_video_comments;
create policy "Members can delete own comments" on public.featured_video_comments
  for delete to authenticated using (auth.uid() = user_id);

-- Three visible levels: top-level (0), reply (1), reply-to-reply (2).
alter table public.featured_video_comments
  add column if not exists parent_id uuid references public.featured_video_comments(id) on delete cascade,
  add column if not exists depth smallint not null default 0;
create index if not exists featured_video_comments_parent_idx on public.featured_video_comments(parent_id);
create or replace function public.validate_featured_video_comment_reply()
returns trigger language plpgsql security definer set search_path = public as $$
declare parent_record public.featured_video_comments%rowtype;
begin
  if new.parent_id is null then
    new.depth := 0;
  else
    select * into parent_record from public.featured_video_comments where id = new.parent_id;
    if not found then raise exception 'Parent comment not found'; end if;
    if parent_record.video_id <> new.video_id then raise exception 'Reply must belong to same video'; end if;
    if parent_record.depth >= 2 then raise exception 'Maximum comment nesting is three levels'; end if;
    new.depth := parent_record.depth + 1;
  end if;
  return new;
end;
$$;
drop trigger if exists validate_featured_video_comment_reply_trigger on public.featured_video_comments;
create trigger validate_featured_video_comment_reply_trigger before insert or update of parent_id,video_id,depth
on public.featured_video_comments for each row execute function public.validate_featured_video_comment_reply();
