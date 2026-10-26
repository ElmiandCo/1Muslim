create table if not exists public.hudhud_video_candidates (
 id uuid primary key default gen_random_uuid(),
 provider text not null default 'youtube',
 provider_video_id text not null,
 title text not null,
 creator text not null default '',
 description text not null default '',
 thumbnail_url text,
 source_url text not null,
 category text not null default 'Islamic content',
 review_status text not null default 'pending' check (review_status in ('pending','approved','rejected')),
 rights_status text not null default 'embed_only' check (rights_status in ('embed_only','licensed_for_clipping')),
 suggested_start_seconds integer,
 suggested_end_seconds integer,
 discovered_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid references auth.users(id),
 unique(provider,provider_video_id)
);
create index if not exists hudhud_video_candidates_review_idx on public.hudhud_video_candidates(review_status,discovered_at desc);
alter table public.hudhud_video_candidates enable row level security;
create policy "Admins view candidates" on public.hudhud_video_candidates for select to authenticated using (public.is_1muslim_admin());
create policy "Admins update candidates" on public.hudhud_video_candidates for update to authenticated using (public.is_1muslim_admin()) with check (public.is_1muslim_admin());
create policy "Public view approved candidates" on public.hudhud_video_candidates for select to anon using (review_status='approved');
