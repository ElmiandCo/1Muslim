-- Member identity discoverability is independent of aggregate location consent.
-- Legacy region shares continue counting toward the map, but never expose a
-- public name/avatar through country discovery without fresh explicit opt-in.
alter table public.member_region_preferences
 add column if not exists directory_visible boolean not null default false;
comment on column public.member_region_preferences.directory_visible is
 'Separate opt-in to show the user public name/avatar in country-level member discovery; false for legacy consents.';
create index if not exists member_region_directory_recent_idx
 on public.member_region_preferences (consented_at desc)
 where directory_visible = true;