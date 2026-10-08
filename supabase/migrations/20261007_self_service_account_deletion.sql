-- 1Muslim: self-service account deletion
-- Deletes the currently authenticated user's Supabase Auth account.
-- Foreign keys that reference auth.users(id) should use ON DELETE CASCADE
-- for app-owned data that should disappear with the account.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'You must be signed in to delete your account.';
  end if;

  -- Delete the auth user. Supabase will cascade to app tables whose
  -- user foreign keys are configured with ON DELETE CASCADE.
  delete from auth.users
  where id = uid;

  if not found then
    raise exception 'Account not found.';
  end if;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
