# project

2026-07-22, whole-project golden pair via CLI (`base-maia`). Verdict: all `components/ui` wrappers are on Base UI / native; radix packages removed; typecheck clean.

## Changed

- `components.json` already `style: "base-maia"` / `base: "base"` — no flip needed.
- Installed components overwritten via `npx shadcn@latest add <c> --overwrite`: label, progress, badge, card, input, textarea. Button already matched registry (skipped).
- Badge: re-applied app-specific `success` / `warning` variants after overwrite.
- Consumer sweep: 16 `Button asChild` → `render={<Link ... />}` across 9 files.
- Removed unused `@radix-ui/react-*` packages (checkbox, dialog, dropdown-menu, label, progress, select, separator, slot, tabs, toast).
- Baseline typecheck had only `asChild` errors; final `tsc --noEmit` clean.
- Leftover scan: `grep -n "radix-ui\|@radix-ui" components/ui` → clean. **0 wrappers remain on Radix.**

## Left alone

- `sonner` (toast) — third-party, not radix; intentionally untouched.
- No cmdk / vaul / input-otp / calendar / chart wrappers present.

## Behavior changes

- UI tokens shifted from hardcoded stone/teal classes to CSS variables (`bg-card`, `bg-primary`, etc.) for card/input/textarea/badge/progress — visual restyle expected.
- Card anatomy: `CardTitle` is a `div` (was `h3`); spacing via `--card-spacing` / ring instead of border+shadow.
- Progress fill width computed by Base UI (no manual `translateX`); track height/radius follows maia.
- Label is native `<label>` (lost Radix double-click text-select prevention; mitigated by `select-none`).

## Verify by hand

- Click every `Button` that navigates via Link (home, dashboard CTA, experiences empty state, practice feedback/compare).
- Interview progress bar advances with answers (`/evidence/interview/new`).
- Forms: labels still associate via `htmlFor` (login, signup, experience form).
- Badges: `success` / `warning` still readable on evidence detail and job-target match summary.
