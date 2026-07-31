# card

2026-07-22, golden pair via CLI (`base-maia`). Verdict: plain layout wrapper aligned to maia tokens (no radix).

## Changed

- `components/ui/card.tsx`: maia Card with `--card-spacing`, ring, size prop, CardAction/CardFooter exports. Leftover scan clean (never radix).

## Left alone

- Consumers; composition APIs (`CardHeader`/`Title`/`Description`/`Content`) unchanged in name.

## Behavior changes

- Visual: ring + token colors vs previous border/shadow stone styling.
- `CardTitle` element is `div` (was `h3`) — heading semantics now depend on page context.
- Default content padding via `--card-spacing` (no `pt-0` on content by default).

## Verify by hand

- Dashboard / experiences / auth cards: spacing and nested content still readable.
- Cards with custom `className` (e.g. teal highlight on dashboard) still override correctly.
