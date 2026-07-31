-- Backfill profiles for auth users created before migrations,
-- and allow users to insert their own profile row if missing.

insert into public.profiles (id, email, name)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))
from auth.users u
on conflict (id) do nothing;

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create or replace function public.ensure_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into result from public.profiles where id = auth.uid();
  if found then
    return result;
  end if;

  insert into public.profiles (id, email, name)
  select
    u.id,
    u.email,
    coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))
  from auth.users u
  where u.id = auth.uid()
  on conflict (id) do update
    set email = excluded.email
  returning * into result;

  return result;
end;
$$;

grant execute on function public.ensure_profile() to authenticated;
