# button

2026-07-22, golden pair via CLI — already on `@base-ui/react/button` matching `base-maia`. Verdict: wrapper unchanged; consumers migrated off `asChild`.

## Changed

- `components/ui/button.tsx`: registry skip (identical to base-maia). Confirmed clean: no `radix-ui` / `@radix-ui`.
- Call sites `asChild` → `render={<Link href=... />}`:
  - `app/page.tsx:18-22`
  - `app/onboarding/page.tsx`
  - `app/(app)/dashboard/page.tsx:106,194`
  - `app/(app)/evidence/page.tsx:53`
  - `app/(app)/experiences/page.tsx`
  - `app/(app)/experiences/[id]/page.tsx:38`
  - `app/(app)/practice/[id]/page.tsx`
  - `app/(app)/practice/[id]/feedback/page.tsx`
  - `components/experience-form.tsx:151`

## Left alone

- Non-Link Button usages (submit / onClick) — no prop change needed.

## Behavior changes

- None on the wrapper. Polymorphic composition now uses Base UI `render` instead of Radix Slot/`asChild`.

## Verify by hand

- Home: Create account / Sign in links look and navigate as buttons.
- Dashboard suggested-action CTA and builder outline button.
- Experience form Cancel link still outline-styled.
