-- Safe, repeatable DeepWatch catalog import from the existing approved registry.
-- Run only AFTER 20261111013000_deepwatch_catalog_recommendations.sql.
-- Never deletes source records or overwrites curated video metadata.
insert into public.dw_videos(provider,provider_video_id,title,format,published_at,metadata)
select 'youtube',r.video_id,r.title,r.format,r.published_at,
       jsonb_build_object('legacy_categories',coalesce(to_jsonb(r.categories),'[]'::jsonb),'import_source','islamic_video_registry')
from public.islamic_video_registry r
where r.status='approved'
  and r.video_id ~ '^[A-Za-z0-9_-]{11}$'
  and nullif(btrim(r.title),'') is not null
on conflict(provider,provider_video_id) do nothing;

-- Create category vocabulary only from meaningful existing tags; don't
-- infer theology, audience, publisher, or creators from video title keywords.
insert into public.dw_categories(slug,name)
select distinct lower(regexp_replace(btrim(tag),'[^a-zA-Z0-9]+','-','g')),btrim(tag)
from public.islamic_video_registry r
cross join lateral unnest(coalesce(r.categories,array[]::text[])) as tag
where r.status='approved'
  and length(btrim(tag)) between 3 and 80
  and btrim(tag) ~ '[[:alpha:]]'
  and lower(regexp_replace(btrim(tag),'[^a-zA-Z0-9]+','-','g')) <> ''
on conflict(slug) do nothing;

-- Imported tags are unverified until reviewed by a catalog editor.
insert into public.dw_video_categories(video_id,category_id,verified)
select distinct v.id,c.id,false
from public.islamic_video_registry r
join public.dw_videos v on v.provider='youtube' and v.provider_video_id=r.video_id
cross join lateral unnest(coalesce(r.categories,array[]::text[])) as tag
join public.dw_categories c on c.slug=lower(regexp_replace(btrim(tag),'[^a-zA-Z0-9]+','-','g'))
where r.status='approved'
on conflict(video_id,category_id) do nothing;

-- Audit: compare counts; zero missing approved valid YouTube IDs is the goal.
create or replace view public.dw_catalog_import_audit as
select
 (select count(distinct video_id) from public.islamic_video_registry where status='approved' and video_id ~ '^[A-Za-z0-9_-]{11}$' and nullif(btrim(title),'') is not null) as approved_source_ids,
 (select count(*) from public.dw_videos where provider='youtube') as imported_youtube_videos,
 (select count(*) from public.islamic_video_registry r where r.status='approved' and r.video_id ~ '^[A-Za-z0-9_-]{11}$' and nullif(btrim(r.title),'') is not null and not exists(select 1 from public.dw_videos v where v.provider='youtube' and v.provider_video_id=r.video_id)) as missing_source_videos,
 (select count(*) from public.dw_video_categories) as category_assignments,
 (select count(*) from public.dw_video_categories where verified) as reviewed_assignments;
grant select on public.dw_catalog_import_audit to authenticated;
