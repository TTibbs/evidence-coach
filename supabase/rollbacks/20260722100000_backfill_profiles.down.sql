-- Rollback profile backfill helpers

drop function if exists public.ensure_profile();

drop policy if exists "Users can insert own profile" on public.profiles;

-- Do not delete backfilled profile rows on rollback — that would orphan user data.
