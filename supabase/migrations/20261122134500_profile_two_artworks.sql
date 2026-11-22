-- Two independent public artwork slots: existing banner and optional portrait.
-- Preserve the original avatar_config profileCoverUrl used by legacy clients.
alter table public.profiles
 add column if not exists profile_background_image_url text,
 add column if not exists profile_main_image_url text;

comment on column public.profiles.profile_background_image_url is
 'Profile banner/background artwork URL; synchronized with the legacy avatar_config profileCoverUrl field.';
comment on column public.profiles.profile_main_image_url is
 'Optional separate portrait artwork for the full-screen cinematic public profile; falls back to banner until selected.';

-- Non-destructive backfill. No cover image changes and no avatars moved.
update public.profiles
 set profile_background_image_url = nullif(avatar_config->>'profileCoverUrl','')
 where profile_background_image_url is null
   and avatar_config ? 'profileCoverUrl'
   and nullif(avatar_config->>'profileCoverUrl','') is not null;
