create table if not exists public.unlocked_subscriptions (
 user_id uuid primary key references auth.users(id) on delete cascade,
 stripe_customer_id text not null,
 stripe_subscription_id text not null unique,
 stripe_price_id text not null,
 status text not null check(status in ('incomplete','incomplete_expired','trialing','active','past_due','canceled','unpaid','paused')),
 cancel_at_period_end boolean not null default false,
 updated_at timestamptz not null default now()
);
create unique index if not exists unlocked_customer_idx on public.unlocked_subscriptions(stripe_customer_id);
alter table public.unlocked_subscriptions enable row level security;
revoke all on public.unlocked_subscriptions from anon, authenticated;
grant select on public.unlocked_subscriptions to authenticated;
create policy "Members read own subscription" on public.unlocked_subscriptions for select to authenticated using (user_id=auth.uid());
create or replace function public.has_1muslim_unlocked() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.unlocked_subscriptions where user_id=auth.uid() and status in ('active','trialing'));
$$;
revoke all on function public.has_1muslim_unlocked() from public;
grant execute on function public.has_1muslim_unlocked() to authenticated;
