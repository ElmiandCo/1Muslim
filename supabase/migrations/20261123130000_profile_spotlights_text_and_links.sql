-- Let owners pin their thoughts or a safe HTTPS link, as well as photos and videos.
alter table public.profile_spotlights alter column media_url drop not null;
alter table public.profile_spotlights drop constraint if exists profile_spotlights_media_kind_check;
alter table public.profile_spotlights drop constraint if exists profile_spotlights_media_url_check;
alter table public.profile_spotlights drop constraint if exists profile_spotlights_media_match_check;
alter table public.profile_spotlights add constraint profile_spotlights_media_kind_check
  check (media_kind in ('none','image','video','link'));
alter table public.profile_spotlights add constraint profile_spotlights_media_match_check
  check ((media_kind='none' and media_url is null)
    or (media_kind in ('image','video','link') and media_url is not null and char_length(media_url)<=2048 and media_url ~ '^https://[^[:space:]]+$'));
