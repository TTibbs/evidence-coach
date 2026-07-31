# textarea

2026-07-22, golden pair via CLI (`base-maia`). Verdict: native textarea restyled to maia tokens (no Base UI primitive).

## Changed

- `components/ui/textarea.tsx`: maia classes, `field-sizing-content`, `min-h-16`, `rounded-xl`. Leftover scan clean.

## Left alone

- Builder / practice / interview textareas — prop API unchanged.

## Behavior changes

- Visual token shift; auto field sizing may change growth vs previous fixed `min-h-[80px]`.

## Verify by hand

- Practice answer box and builder edited-output textarea resize/type normally.
