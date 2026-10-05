-- OneMuslim Live Studio: lock broadcast format and preserve live thumbnails
alter table public.live_streams
  add column if not exists thumbnail_path text,
  add column if not exists aspect_ratio text not null default '9:16',
  add column if not exists video_width integer,
  add column if not exists video_height integer;

alter table public.go_live_settings
  add column if not exists aspect_ratio text not null default '9:16',
  add column if not exists video_width integer,
  add column if not exists video_height integer;
