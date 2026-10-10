-- Private review queue: not a public post, never exposed through public feeds.
create table if not exists public.hudhud_moderation_queue (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references auth.users(id) on delete cascade,
 body text not null check (char_length(body) between 1 and 10000),
 content_type text not null default 'post' check (content_type in ('post','comment','live_chat')),
 reason text not null,
 category text not null check (category in ('profanity','religious_insult','other')),
 status text not null default 'pending' check (status in ('pending','approved','rejected','changes_requested')),
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 review_note text,
 created_at timestamptz not null default now()
);
create index if not exists hudhud_queue_status_created_idx on public.hudhud_moderation_queue(status,created_at desc);
alter table public.hudhud_moderation_queue enable row level security;
revoke all on public.hudhud_moderation_queue from anon;
grant select,insert on public.hudhud_moderation_queue to authenticated;
create policy "Author sees own restricted submissions" on public.hudhud_moderation_queue
 for select to authenticated using (author_id=auth.uid());
create policy "Author can submit restricted content for review" on public.hudhud_moderation_queue
 for insert to authenticated with check (author_id=auth.uid() and status='pending' and reviewed_by is null and reviewed_at is null);
-- Admin review is performed by a SECURITY DEFINER function, not client-side updates.
create or replace function public.hudhud_review_submission(p_id uuid,p_status text,p_note text default null)
returns public.hudhud_moderation_queue language plpgsql security definer set search_path=public as $$
declare item public.hudhud_moderation_queue;
begin
 if coalesce(auth.jwt()->'app_metadata'->>'role','') <> 'admin' then raise exception 'Admin only'; end if;
 if p_status not in ('approved','rejected','changes_requested') then raise exception 'Invalid review status'; end if;
 update public.hudhud_moderation_queue set status=p_status,review_note=left(p_note,2000),reviewed_by=auth.uid(),reviewed_at=now()
 where id=p_id and status='pending' returning * into item;
 if item.id is null then raise exception 'Submission unavailable or already reviewed'; end if;
 return item;
end $$;
revoke all on function public.hudhud_review_submission(uuid,text,text) from public;
grant execute on function public.hudhud_review_submission(uuid,text,text) to authenticated;
create or replace function public.hudhud_admin_queue()
returns setof public.hudhud_moderation_queue language plpgsql security definer set search_path=public as $$
begin
 if coalesce(auth.jwt()->'app_metadata'->>'role','') <> 'admin' then raise exception 'Admin only'; end if;
 return query select * from public.hudhud_moderation_queue order by created_at desc limit 200;
end $$;
revoke all on function public.hudhud_admin_queue() from public;
grant execute on function public.hudhud_admin_queue() to authenticated;
