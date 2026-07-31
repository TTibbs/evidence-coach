-- Rollback: Evidence Coach MVP schema

drop policy if exists "Users can delete own practice audio" on storage.objects;
drop policy if exists "Users can read own practice audio" on storage.objects;
drop policy if exists "Users can upload own practice audio" on storage.objects;
drop policy if exists "Users can delete own cvs" on storage.objects;
drop policy if exists "Users can read own cvs" on storage.objects;
drop policy if exists "Users can upload own cvs" on storage.objects;

delete from storage.buckets where id in ('cvs', 'practice-audio');

drop policy if exists "Users can insert own usage events" on public.usage_events;
drop policy if exists "Users can view own usage events" on public.usage_events;
drop policy if exists "Users manage own cv imports" on public.cv_imports;
drop policy if exists "Users manage own practice attempts" on public.practice_attempts;
drop policy if exists "Users manage own practice sessions" on public.practice_sessions;
drop policy if exists "Users manage own generated content" on public.generated_content;
drop policy if exists "Users manage own job targets" on public.job_targets;
drop policy if exists "Users manage own evidence interviews" on public.evidence_interviews;
drop policy if exists "Users manage own evidence cards" on public.evidence_cards;
drop policy if exists "Users manage own experiences" on public.experiences;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists cv_imports_updated_at on public.cv_imports;
drop trigger if exists generated_content_updated_at on public.generated_content;
drop trigger if exists job_targets_updated_at on public.job_targets;
drop trigger if exists evidence_interviews_updated_at on public.evidence_interviews;
drop trigger if exists evidence_cards_updated_at on public.evidence_cards;
drop trigger if exists experiences_updated_at on public.experiences;
drop trigger if exists profiles_updated_at on public.profiles;

drop function if exists public.handle_new_user();
drop function if exists public.set_updated_at();

drop index if exists public.usage_events_user_type_created_idx;
drop index if exists public.practice_attempts_session_id_idx;
drop index if exists public.practice_sessions_user_id_idx;
drop index if exists public.generated_content_user_id_idx;
drop index if exists public.job_targets_user_id_idx;
drop index if exists public.evidence_cards_experience_id_idx;
drop index if exists public.evidence_cards_user_id_idx;
drop index if exists public.experiences_user_id_idx;

drop table if exists public.usage_events;
drop table if exists public.cv_imports;
drop table if exists public.practice_attempts;
drop table if exists public.practice_sessions;
drop table if exists public.generated_content;
drop table if exists public.job_targets;
drop table if exists public.evidence_interviews;
drop table if exists public.evidence_cards;
drop table if exists public.experiences;
drop table if exists public.profiles;

drop type if exists public.cv_import_status;
drop type if exists public.usage_event_type;
drop type if exists public.practice_mode;
drop type if exists public.generated_content_type;
drop type if exists public.plan_id;
drop type if exists public.confidence_status;
drop type if exists public.experience_type;
