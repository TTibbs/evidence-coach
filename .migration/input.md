# input

2026-07-22, golden pair via CLI (`base-maia`). Verdict: native input → `@base-ui/react/input`.

## Changed

- `components/ui/input.tsx`: `InputPrimitive` from `@base-ui/react/input` with maia token classes. Leftover scan clean.

## Left alone

- Form consumers — same `type`/`className`/`ref` surface.

## Behavior changes

- Height `h-9`, `rounded-4xl`, `bg-input/30` vs previous `h-10` stone border styling.

## Verify by hand

- Login/signup focus ring; file upload inputs if any still accept files.
