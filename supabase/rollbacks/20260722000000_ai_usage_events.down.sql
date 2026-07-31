-- Rollback: AI usage events

drop policy if exists "Users can insert own ai usage events" on public.ai_usage_events;
drop policy if exists "Users can view own ai usage events" on public.ai_usage_events;

drop index if exists public.ai_usage_events_user_success_created_idx;
drop index if exists public.ai_usage_events_user_created_idx;

drop table if exists public.ai_usage_events;

drop type if exists public.ai_usage_operation;
drop type if exists public.ai_provider_name;
