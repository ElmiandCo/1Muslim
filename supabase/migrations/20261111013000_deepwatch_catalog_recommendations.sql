-- DeepWatch normalized catalog and privacy-first recommendation foundation.
-- Additive migration: existing islamic_video_registry remains the source until backfill is verified.
create extension if not exists pgcrypto;
create table if not exists public.dw_channels(id uuid primary key default gen_random_uuid(),slug text unique not null,name text not null,provider_channel_id text,created_at timestamptz not null default now());
create table if not exists public.dw_creators(id uuid primary key default gen_random_uuid(),name text not null,slug text unique not null,created_at timestamptz not null default now());
create table if not exists public.dw_videos(id uuid primary key default gen_random_uuid(),provider text not null default 'youtube',provider_video_id text not null,title text not null,description text,channel_id uuid references public.dw_channels(id) on delete set null,primary_category_id uuid,language_code text,format text,duration_seconds integer check(duration_seconds>=0),audience text not null default 'general',thumbnail_url text,published_at timestamptz,metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now(),unique(provider,provider_video_id));
create table if not exists public.dw_categories(id uuid primary key default gen_random_uuid(),slug text unique not null,name text not null,parent_id uuid references public.dw_categories(id) on delete set null,visible boolean not null default true);
alter table public.dw_videos add constraint dw_video_primary_category_fk foreign key(primary_category_id) references public.dw_categories(id) on delete set null;
create table if not exists public.dw_video_categories(video_id uuid not null references public.dw_videos(id) on delete cascade,category_id uuid not null references public.dw_categories(id) on delete cascade,verified boolean not null default false,primary key(video_id,category_id));
create table if not exists public.dw_video_creators(video_id uuid not null references public.dw_videos(id) on delete cascade,creator_id uuid not null references public.dw_creators(id) on delete cascade,role text not null default 'presenter',primary key(video_id,creator_id,role));
create table if not exists public.dw_collections(id uuid primary key default gen_random_uuid(),slug text unique not null,title text not null,channel_id uuid references public.dw_channels(id) on delete set null,description text,artwork_url text);
create table if not exists public.dw_collection_videos(collection_id uuid not null references public.dw_collections(id) on delete cascade,video_id uuid not null references public.dw_videos(id) on delete cascade,sort_order integer not null default 0,primary key(collection_id,video_id));
create table if not exists public.dw_series(id uuid primary key default gen_random_uuid(),slug text unique not null,title text not null,description text,channel_id uuid references public.dw_channels(id) on delete set null,artwork_url text);
create table if not exists public.dw_episodes(series_id uuid not null references public.dw_series(id) on delete cascade,video_id uuid not null unique references public.dw_videos(id) on delete cascade,season_number integer not null default 1,episode_number integer not null,primary key(series_id,video_id),unique(series_id,season_number,episode_number));
create table if not exists public.dw_topics(id uuid primary key default gen_random_uuid(),slug text unique not null,name text not null);
create table if not exists public.dw_video_topics(video_id uuid not null references public.dw_videos(id) on delete cascade,topic_id uuid not null references public.dw_topics(id) on delete cascade,primary key(video_id,topic_id));
create table if not exists public.dw_watch_progress(user_id uuid not null references auth.users(id) on delete cascade,video_id uuid not null references public.dw_videos(id) on delete cascade,position_seconds integer not null default 0,completed boolean not null default false,updated_at timestamptz not null default now(),primary key(user_id,video_id));
create table if not exists public.dw_watch_events(id bigint generated always as identity primary key,user_id uuid not null references auth.users(id) on delete cascade,video_id uuid not null references public.dw_videos(id) on delete cascade,event_type text not null check(event_type in ('start','pause','seek','complete')),position_seconds integer not null default 0,created_at timestamptz not null default now());
create table if not exists public.dw_user_preferences(user_id uuid primary key references auth.users(id) on delete cascade,personalization_enabled boolean not null default true,language_codes text[] not null default '{}',kids_mode boolean not null default false,updated_at timestamptz not null default now());
create table if not exists public.dw_user_interests(user_id uuid not null references auth.users(id) on delete cascade,topic_id uuid not null references public.dw_topics(id) on delete cascade,weight numeric not null default 1,primary key(user_id,topic_id));
create table if not exists public.dw_user_feedback(user_id uuid not null references auth.users(id) on delete cascade,video_id uuid not null references public.dw_videos(id) on delete cascade,feedback text not null check(feedback in ('like','dislike','not_interested')),updated_at timestamptz not null default now(),primary key(user_id,video_id));
create table if not exists public.dw_video_similarity(video_id uuid not null references public.dw_videos(id) on delete cascade,related_video_id uuid not null references public.dw_videos(id) on delete cascade,score numeric not null check(score between 0 and 1),reason text,primary key(video_id,related_video_id),check(video_id<>related_video_id));
create table if not exists public.dw_recommendation_impressions(id bigint generated always as identity primary key,user_id uuid not null references auth.users(id) on delete cascade,video_id uuid not null references public.dw_videos(id) on delete cascade,source text not null,created_at timestamptz not null default now());
create table if not exists public.dw_recommendation_interactions(id bigint generated always as identity primary key,user_id uuid not null references auth.users(id) on delete cascade,video_id uuid not null references public.dw_videos(id) on delete cascade,source text not null,action text not null,created_at timestamptz not null default now());
create table if not exists public.dw_recommendation_cache(user_id uuid not null references auth.users(id) on delete cascade,video_id uuid not null references public.dw_videos(id) on delete cascade,score numeric not null,reason text,expires_at timestamptz not null,primary key(user_id,video_id));
create index if not exists dw_videos_channel_idx on public.dw_videos(channel_id);
create index if not exists dw_video_categories_category_idx on public.dw_video_categories(category_id);
create index if not exists dw_watch_events_user_time_idx on public.dw_watch_events(user_id,created_at desc);
create index if not exists dw_watch_progress_user_time_idx on public.dw_watch_progress(user_id,updated_at desc);
create index if not exists dw_episodes_series_order_idx on public.dw_episodes(series_id,season_number,episode_number);
create index if not exists dw_recommendation_cache_user_score_idx on public.dw_recommendation_cache(user_id,score desc);
-- Catalog is public read-only; all personal data remains owner-only.
do $$ declare t text; begin
foreach t in array array['dw_channels','dw_creators','dw_videos','dw_categories','dw_video_categories','dw_video_creators','dw_collections','dw_collection_videos','dw_series','dw_episodes','dw_topics','dw_video_topics','dw_video_similarity'] loop
execute format('alter table public.%I enable row level security',t);
execute format('create policy %I on public.%I for select to anon,authenticated using (true)',t||'_read',t);
end loop;
foreach t in array array['dw_watch_progress','dw_watch_events','dw_user_preferences','dw_user_interests','dw_user_feedback','dw_recommendation_impressions','dw_recommendation_interactions','dw_recommendation_cache'] loop
execute format('alter table public.%I enable row level security',t);
execute format('create policy %I on public.%I for select to authenticated using (user_id = (select auth.uid()))',t||'_select',t);
end loop;
foreach t in array array['dw_watch_progress','dw_watch_events','dw_user_preferences','dw_user_interests','dw_user_feedback','dw_recommendation_impressions','dw_recommendation_interactions'] loop
execute format('create policy %I on public.%I for insert to authenticated with check (user_id = (select auth.uid()))',t||'_insert',t);
end loop;
foreach t in array array['dw_watch_progress','dw_user_preferences','dw_user_interests','dw_user_feedback'] loop
execute format('create policy %I on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',t||'_update',t);
execute format('create policy %I on public.%I for delete to authenticated using (user_id = (select auth.uid()))',t||'_delete',t);
end loop;
end $$;
