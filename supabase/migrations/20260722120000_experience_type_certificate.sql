-- Add certificate as a first-class experience type for CV certifications.

alter type public.experience_type add value if not exists 'certificate';
