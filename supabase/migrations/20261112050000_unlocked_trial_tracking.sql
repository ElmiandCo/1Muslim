alter table public.unlocked_subscriptions add column if not exists trial_used boolean not null default false;
update public.unlocked_subscriptions set trial_used=true where status='trialing';
