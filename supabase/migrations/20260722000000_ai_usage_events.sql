-- AI provider usage telemetry (additive to usage_events entitlements)

create type ai_provider_name as enum ('gemini', 'openai', 'mock');

create type ai_usage_operation as enum (
  'cv_extraction',
  'evidence_topics',
  'evidence_questions',
  'evidence_card',
  'job_analysis',
  'career_content',
  'practice_question',
  'practice_feedback',
  'voice_transcription'
);

create table public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null,
  model text not null,
  operation ai_usage_operation not null,
  success boolean not null default true,
  latency_ms int not null default 0,
  input_tokens int,
  output_tokens int,
  error_category text,
  created_at timestamptz not null default now()
);

create index ai_usage_events_user_created_idx
  on public.ai_usage_events (user_id, created_at);
create index ai_usage_events_user_success_created_idx
  on public.ai_usage_events (user_id, success, created_at);

alter table public.ai_usage_events enable row level security;

create policy "Users can view own ai usage events"
  on public.ai_usage_events for select
  using (auth.uid() = user_id);

create policy "Users can insert own ai usage events"
  on public.ai_usage_events for insert
  with check (auth.uid() = user_id);
