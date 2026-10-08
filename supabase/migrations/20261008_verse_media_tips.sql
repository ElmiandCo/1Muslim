-- Verse-specific curated learning resources. Review and apply to the verified 1Muslim database.
create table if not exists public.verse_media_tips (
 id uuid primary key default gen_random_uuid(),
 verse_key text not null check (verse_key ~ '^[0-9]{1,3}:[0-9]{1,3}$'),
 title text not null check (length(trim(title)) between 1 and 160),
 description text,
 media_type text not null check (media_type in ('image','video','youtube')),
 media_url text not null check (media_url ~ '^https://'),
 credit text,
 published boolean not null default false,
 sort_order integer not null default 0,
 created_at timestamptz not null default now()
);
create index if not exists verse_media_tips_lookup on public.verse_media_tips(verse_key,published,sort_order);
alter table public.verse_media_tips enable row level security;
create policy "Read published verse media tips" on public.verse_media_tips for select to anon,authenticated using (published=true);
-- Publishing/editing requires an admin-only server endpoint with verified authorization.
-- No direct client insert/update/delete policies.

-- Reuse the existing is_1muslim_admin() authorization function.
-- Admins may read drafts and manage resources; public users see published rows only.
create policy "Admins read all verse media tips" on public.verse_media_tips for select to authenticated using (public.is_1muslim_admin());
create policy "Admins create verse media tips" on public.verse_media_tips for insert to authenticated with check (public.is_1muslim_admin());
create policy "Admins update verse media tips" on public.verse_media_tips for update to authenticated using (public.is_1muslim_admin()) with check (public.is_1muslim_admin());
create policy "Admins delete verse media tips" on public.verse_media_tips for delete to authenticated using (public.is_1muslim_admin());
