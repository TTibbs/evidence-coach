# badge

2026-07-22, golden pair via CLI + customization replay. Verdict: Base UI `useRender`/`mergeProps` badge; app `success`/`warning` variants preserved.

## Changed

- `components/ui/badge.tsx`: overwritten from `base-maia`, then restored `success` / `warning` variants used by evidence, practice, AI disclosure, job-target match summary. Leftover scan clean. Exports `badgeVariants`.

## Left alone

- Call sites — variant names unchanged.

## Behavior changes

- Default/secondary/outline now use design tokens + `rounded-4xl`; gains `render` polymorphism and focus-ring styles.

## Verify by hand

- Evidence detail: success/warning metric badges.
- Job target match: strong/partial/gaps badges.
- AI disclosure: success / warning chips.
