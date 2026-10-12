-- Run in the Supabase project used by 1Muslim before enabling HudHud AI.
create table if not exists public.hudhud_ai_usage (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 feature text not null default 'chat',
 model text not null,
 status text not null default 'reserved' check (status in ('reserved','completed','failed')),
 reserved_usd numeric(12,8) not null default 0,
 actual_usd numeric(12,8) not null default 0,
 input_tokens integer not null default 0,
 output_tokens integer not null default 0,
 created_at timestamptz not null default now()
);
create index if not exists hudhud_ai_usage_user_created_idx on public.hudhud_ai_usage(user_id,created_at desc);
alter table public.hudhud_ai_usage enable row level security;
revoke all on public.hudhud_ai_usage from anon,authenticated;
-- Security-definer functions use auth.uid() so callers cannot charge another user.
create or replace function public.hudhud_ai_reserve(p_feature text,p_model text,p_reserve_usd numeric)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;v_spent numeric;
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 if p_reserve_usd<=0 or p_reserve_usd>0.01 then raise exception 'invalid reservation'; end if;
 if p_feature not in ('chat','quran','lesson','vision','other') then raise exception 'invalid feature'; end if;
 perform pg_advisory_xact_lock(82640517);
 select coalesce(sum(case when status='reserved' then reserved_usd else actual_usd end),0)
 into v_spent from public.hudhud_ai_usage where status in ('reserved','completed');
 if v_spent+p_reserve_usd>5 then raise exception 'HUDHUD_BUDGET_REACHED'; end if;
 insert into public.hudhud_ai_usage(user_id,feature,model,reserved_usd)
 values(auth.uid(),p_feature,p_model,p_reserve_usd) returning id into v_id;
 return v_id;
end $$;
create or replace function public.hudhud_ai_finalize(p_id uuid,p_input_tokens integer,p_output_tokens integer,p_actual_usd numeric,p_success boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
 update public.hudhud_ai_usage set
 status=case when p_success then 'completed' else 'failed' end,
 input_tokens=greatest(0,least(p_input_tokens,100000)),
 output_tokens=greatest(0,least(p_output_tokens,100000)),
 actual_usd=case when p_success then greatest(0,least(p_actual_usd,reserved_usd)) else 0 end
 where id=p_id and user_id=auth.uid() and status='reserved';
 if not found then raise exception 'reservation not found'; end if;
end $$;
revoke all on function public.hudhud_ai_reserve(text,text,numeric) from public;
revoke all on function public.hudhud_ai_finalize(uuid,integer,integer,numeric,boolean) from public;
grant execute on function public.hudhud_ai_reserve(text,text,numeric) to authenticated;
grant execute on function public.hudhud_ai_finalize(uuid,integer,integer,numeric,boolean) to authenticated;
