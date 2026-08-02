drop trigger if exists job_trust_check_cache_updated_at on public.job_trust_check_cache;

drop index if exists public.job_trust_check_cache_expires_idx;
drop table if exists public.job_trust_check_cache;

drop index if exists public.job_targets_trust_checked_at_idx;

alter table public.job_targets
  drop column if exists official_listing_url,
  drop column if exists trust_checked_at,
  drop column if exists trust_check,
  drop column if exists source_url;
