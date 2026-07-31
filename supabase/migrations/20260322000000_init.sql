-- Evidence Coach MVP schema
create extension if not exists "pgcrypto";

create type experience_type as enum (
  'employment',
  'project',
  'freelance',
  'volunteering',
  'education',
  'other'
);

create type confidence_status as enum ('draft', 'confirmed');

create type plan_id as enum ('free', 'prepare', 'intensive');

create type generated_content_type as enum (
  'cv-bullet',
  'role-summary',
  'profile',
  'star-answer',
  'twenty-sixty-twenty',
  'application-answer',
  'tell-me-about-yourself'
);

create type practice_mode as enum ('text', 'voice');

create type usage_event_type as enum (
  'cv_import',
  'content_generation',
  'job_analysis',
  'text_practice',
  'voice_transcription',
  'practice_feedback',
  'mock_interview'
);

create type cv_import_status as enum (
  'uploaded',
  'processing',
  'ready_for_review',
  'confirmed',
  'failed'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  plan plan_id not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type experience_type not null default 'employment',
  organisation text,
  title text not null,
  location text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description text,
  responsibilities text[] not null default '{}',
  source text not null check (source in ('manual', 'cv-import')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evidence_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  experience_id uuid not null references public.experiences (id) on delete cascade,
  title text not null,
  summary text not null default '',
  situation text not null default '',
  task text,
  actions text[] not null default '{}',
  outcome text not null default '',
  reflection text,
  skills text[] not null default '{}',
  competencies text[] not null default '{}',
  metrics jsonb not null default '[]'::jsonb,
  source_facts text[] not null default '{}',
  confidence_status confidence_status not null default 'draft',
  is_favourite boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evidence_interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  experience_id uuid not null references public.experiences (id) on delete cascade,
  topic text,
  questions jsonb not null default '[]'::jsonb,
  answers jsonb not null default '[]'::jsonb,
  current_index int not null default 0,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  evidence_card_id uuid references public.evidence_cards (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  company text,
  description text,
  extracted_skills text[] not null default '{}',
  extracted_competencies text[] not null default '{}',
  match_summary jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.generated_content (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  evidence_card_ids uuid[] not null default '{}',
  job_target_id uuid references public.job_targets (id) on delete set null,
  type generated_content_type not null,
  content text not null,
  user_edited_content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  job_target_id uuid references public.job_targets (id) on delete set null,
  evidence_card_id uuid references public.evidence_cards (id) on delete set null,
  question text not null,
  mode practice_mode not null default 'text',
  created_at timestamptz not null default now()
);

create table public.practice_attempts (
  id uuid primary key default gen_random_uuid(),
  practice_session_id uuid not null references public.practice_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  answer_text text not null,
  audio_path text,
  duration_seconds int,
  scores jsonb not null default '{}'::jsonb,
  feedback jsonb not null default '{}'::jsonb,
  structure_breakdown jsonb,
  attempt_number int not null default 1,
  created_at timestamptz not null default now()
);

create table public.cv_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  file_path text not null,
  original_filename text,
  status cv_import_status not null default 'uploaded',
  extracted_draft jsonb,
  error_message text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type usage_event_type not null,
  units int not null default 1,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index experiences_user_id_idx on public.experiences (user_id);
create index evidence_cards_user_id_idx on public.evidence_cards (user_id);
create index evidence_cards_experience_id_idx on public.evidence_cards (experience_id);
create index job_targets_user_id_idx on public.job_targets (user_id);
create index generated_content_user_id_idx on public.generated_content (user_id);
create index practice_sessions_user_id_idx on public.practice_sessions (user_id);
create index practice_attempts_session_id_idx on public.practice_attempts (practice_session_id);
create index usage_events_user_type_created_idx on public.usage_events (user_id, type, created_at);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger experiences_updated_at before update on public.experiences
  for each row execute function public.set_updated_at();
create trigger evidence_cards_updated_at before update on public.evidence_cards
  for each row execute function public.set_updated_at();
create trigger evidence_interviews_updated_at before update on public.evidence_interviews
  for each row execute function public.set_updated_at();
create trigger job_targets_updated_at before update on public.job_targets
  for each row execute function public.set_updated_at();
create trigger generated_content_updated_at before update on public.generated_content
  for each row execute function public.set_updated_at();
create trigger cv_imports_updated_at before update on public.cv_imports
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.experiences enable row level security;
alter table public.evidence_cards enable row level security;
alter table public.evidence_interviews enable row level security;
alter table public.job_targets enable row level security;
alter table public.generated_content enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.practice_attempts enable row level security;
alter table public.cv_imports enable row level security;
alter table public.usage_events enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users manage own experiences"
  on public.experiences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own evidence cards"
  on public.evidence_cards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own evidence interviews"
  on public.evidence_interviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own job targets"
  on public.job_targets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own generated content"
  on public.generated_content for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own practice sessions"
  on public.practice_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own practice attempts"
  on public.practice_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own cv imports"
  on public.cv_imports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can view own usage events"
  on public.usage_events for select using (auth.uid() = user_id);
create policy "Users can insert own usage events"
  on public.usage_events for insert with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false), ('practice-audio', 'practice-audio', false)
on conflict (id) do nothing;

create policy "Users can upload own cvs"
  on storage.objects for insert
  with check (bucket_id = 'cvs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read own cvs"
  on storage.objects for select
  using (bucket_id = 'cvs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own cvs"
  on storage.objects for delete
  using (bucket_id = 'cvs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload own practice audio"
  on storage.objects for insert
  with check (bucket_id = 'practice-audio' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read own practice audio"
  on storage.objects for select
  using (bucket_id = 'practice-audio' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own practice audio"
  on storage.objects for delete
  using (bucket_id = 'practice-audio' and auth.uid()::text = (storage.foldername(name))[1]);
