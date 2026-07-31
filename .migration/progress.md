# progress

2026-07-22, golden pair via CLI (`base-maia`). Verdict: Radix Progress → `@base-ui/react/progress` with Track/Indicator parts.

## Changed

- `components/ui/progress.tsx`: Base UI Root + Track + Indicator (+ Label/Value exports). Manual `translateX` indicator style removed (primitive owns fill). Leftover scan clean.
- Consumer `app/(app)/evidence/interview/new/page.tsx` still uses `<Progress value={progress} />` — compatible.

## Left alone

- No other Progress consumers.

## Behavior changes

- Track uses `h-3` / `rounded-4xl` / `bg-muted` / `bg-primary` (was `h-2` stone/teal). Fill no longer set via transform.

## Verify by hand

- Guided interview: progress bar advances as questions complete; indeterminate not used.
