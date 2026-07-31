-- Link experiences to their source CV import and persist extracted CV text for edit/re-extract.

alter table public.cv_imports
  add column if not exists extracted_text text;

alter table public.experiences
  add column if not exists cv_import_id uuid references public.cv_imports (id) on delete set null;

create index if not exists experiences_cv_import_id_idx
  on public.experiences (cv_import_id);
