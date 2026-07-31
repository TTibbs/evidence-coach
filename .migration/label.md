# label

2026-07-22, golden pair via CLI (`base-maia`). Verdict: Radix Label → native `<label>`.

## Changed

- `components/ui/label.tsx`: replaced `@radix-ui/react-label` with native `<label data-slot="label">`. Leftover scan clean.

## Left alone

- Form call sites already used `htmlFor` / nesting — no consumer prop changes.

## Behavior changes

- Lost Radix-only “prevent text selection on double-click”; maia classes include `select-none` as the documented substitute.

## Verify by hand

- Login/signup: click label focuses matching input.
- Experience form: checkbox label for “current role” still toggles.
