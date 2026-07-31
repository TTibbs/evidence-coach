-- Rollback note: Postgres cannot safely remove enum values once added.
-- Rows using type = 'certificate' would need remapping before any recreate.
-- This down migration is intentionally a no-op.

select 1;
