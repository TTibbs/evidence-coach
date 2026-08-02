alter table public.job_targets
  add column source_url text,
  add column trust_check jsonb,
  add column trust_checked_at timestamptz,
  add column official_listing_url text;

create index job_targets_trust_checked_at_idx
  on public.job_targets (user_id, trust_checked_at desc);

create table public.job_trust_check_cache (
  cache_key text primary key,
  input jsonb not null,
  result jsonb not null,
  provider text not null default 'none',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index job_trust_check_cache_expires_idx
  on public.job_trust_check_cache (expires_at);

create trigger job_trust_check_cache_updated_at
  before update on public.job_trust_check_cache
  for each row execute function public.set_updated_at();

alter table public.job_trust_check_cache enable row level security;

revoke all on table public.job_trust_check_cache from anon;
revoke all on table public.job_trust_check_cache from authenticated;
grant select, insert, update, delete on table public.job_trust_check_cache to service_role;
