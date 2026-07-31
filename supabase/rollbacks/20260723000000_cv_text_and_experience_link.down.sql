drop index if exists public.experiences_cv_import_id_idx;

alter table public.experiences
  drop column if exists cv_import_id;

alter table public.cv_imports
  drop column if exists extracted_text;
