-- The "Hide my 1Muslim ID" control is an account-level visibility preference,
-- not a single-device cosmetic setting. Keep the internal username intact so
-- authentication, follow relationships and private account settings keep working.
alter table public.profiles
 add column if not exists hide_1muslim_id boolean not null default false;

comment on column public.profiles.hide_1muslim_id is
 'If true, do not render this member\'s @1Muslim ID in public UI, including cinematic profiles, directory cards and post headers. The owner can still edit the ID privately.';
