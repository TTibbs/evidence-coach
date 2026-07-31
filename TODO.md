# Evidence Coach Todo

Source of truth for current implementation status and recommended next work.

Last updated: 2026-07-31

## Current Status

The repo now contains an MVP-shaped Evidence Coach app built around the PRD's three core product areas:

- Experience and evidence bank
- CV and answer builder
- Interview practice and feedback

Recent commits grouped the work into product-direction docs, app foundation, Supabase/auth, AI workflows, CV onboarding, evidence/job targeting, practice, and setup documentation.

## Done

- [x] Product requirements captured in `PRD.md`.
- [x] Root app shell renamed and branded as Evidence Coach.
- [x] Shared Tailwind theme, font setup, toaster, and UI primitives added.
- [x] shadcn-style component config and imported component migration notes added.
- [x] Vitest test setup added.
- [x] Supabase auth clients, server helpers, middleware, and route protection added.
- [x] Login, signup, reset, authenticated app layout, dashboard, and settings screens added.
- [x] Supabase schema migrations and rollback files added.
- [x] Database migration script and npm commands added.
- [x] Entitlement plan config, usage checks, and usage recording helpers added.
- [x] AI provider abstraction added for Gemini, OpenAI, and mock provider.
- [x] Gemini configured as the active MVP provider, with OpenAI retained but gated.
- [x] AI schema validation, prompts, error handling, usage limits, and workflow wrappers added.
- [x] AI tests added for provider behavior, schemas, confirmed metrics, and certificate type coercion.
- [x] CV upload onboarding flow added for PDF/DOCX import.
- [x] CV text extraction, recovery, re-extraction, date normalization, section parsing, and responsibility normalization added.
- [x] CV extraction review screen added before saving imported experience.
- [x] Responsibility improvement control added with review-before-confirm behavior.
- [x] Experience CRUD routes and screens added.
- [x] Evidence bank list/detail routes and screens added.
- [x] Guided evidence interview route and UI added.
- [x] Builder page and generation API added.
- [x] Job target list/detail routes and AI analysis flow added.
- [x] Practice setup, session, feedback, and comparison screens added.
- [x] Practice session and attempt APIs added.
- [x] Voice transcription endpoint added through the AI provider.
- [x] ElevenLabs TTS helper and practice TTS route added.
- [x] CV and practice audio file proxy routes added.
- [x] README updated with setup, AI provider, and manual workflow checks.
- [x] Supabase local CLI state ignored in `.gitignore`.

## Next Verification Pass

- [x] Run `npm test` and fix any failing unit tests.
- [x] Run `npm run lint` and fix lint/type issues surfaced by ESLint.
- [x] Run `npm run build` and fix Next.js build errors.
- [ ] Manually test a clean signup/login/reset flow.
- [ ] Manually test middleware redirects for signed-in and signed-out users.
- [ ] Apply migrations to a real Supabase project using `npm run db:migrate:dry` then `npm run db:migrate`.
- [ ] Confirm Supabase storage buckets exist: `cvs` and `practice-audio`.
- [x] Confirm RLS policies allow only intended user-owned reads/writes.
- [x] Test the app with `AI_PROVIDER=mock` for offline local verification.
- [ ] Test the app with Gemini env vars configured and OpenAI env vars absent.
- [ ] Confirm Gemini failures do not fall back to OpenAI.
- [ ] Confirm all AI-generated payloads are schema-validated before persistence.

## MVP Completion Todos

- [x] Create `.env.example` matching README setup instructions.
- [x] Add explicit onboarding or settings copy for Gemini free-tier data-use disclosure.
- [x] Verify every user-facing AI flow handles rate limits and provider errors gracefully.
- [ ] Add empty/loading/error states across dashboard, experiences, evidence, builder, job targets, and practice screens.
- [x] Add destructive confirmation or undo behavior where records can be deleted or overwritten.
- [ ] Check mobile layouts for onboarding review, builder, practice session, and feedback comparison.
- [ ] Add accessibility pass for forms, labels, focus states, keyboard navigation, and color contrast.
- [ ] Add integration tests for protected API routes and Supabase auth assumptions.
- [ ] Add smoke tests for the critical journey: upload CV, confirm experience, create evidence, generate content, practice answer.
- [ ] Add seed or demo data for local development.
- [x] Document required Supabase storage policies.
- [x] Document required environment variables in one canonical table.
- [ ] Decide whether `.migration/` notes should remain committed long-term or be removed after component migration is complete.

## Feature 1: Experience And Evidence Bank

- [x] CV upload entry method.
- [x] Manual experience entry.
- [x] Experience list and detail screens.
- [x] Evidence card list and detail screens.
- [x] Guided evidence interview flow.
- [x] Evidence filtering component.
- [ ] Confirm extracted CV fields cover all PRD requirements: name, roles, employers, dates, responsibilities, education, projects, skills, volunteering.
- [ ] Add clearer evidence card review/confirmation states if any AI draft can currently be stored ambiguously.
- [ ] Add gap detection for missing evidence categories.
- [ ] Add competency tag editing and filtering if not already fully wired.
- [x] Ensure draft/unconfirmed evidence is never reused in generation.

## Feature 2: CV And Answer Builder

- [x] Builder page.
- [x] Generate API using confirmed evidence.
- [x] Job target creation and detail screens.
- [x] Job description analysis flow.
- [x] Confirmed-metrics guardrails in AI generation.
- [x] Verify supported output types match PRD: CV bullet, cover-letter paragraph, interview answer, application statement.
- [x] Add generated answer structure options if incomplete: 20/60/20, STAR, concise.
- [ ] Add edit-revision history for generated outputs.
- [x] Add export/copy affordances for generated outputs.
- [x] Add clearer warnings where job description matching finds evidence gaps.

## Feature 3: Interview Practice And Feedback

- [x] Practice setup and session screens.
- [x] Text answer attempts.
- [x] Voice transcription endpoint.
- [x] TTS question route.
- [x] Feedback and comparison screens.
- [x] Attempt storage APIs.
- [ ] Verify microphone recording UX end-to-end in browser.
- [x] Add voice duration limits by plan.
- [x] Add feedback categories from PRD if any are missing: relevance, ownership, specificity, structure, evidence, outcome, conciseness, delivery.
- [x] Ensure feedback does not claim to assess emotion, honesty, personality, or employability.
- [x] Add attempt history filtering and clearer comparison navigation.
- [x] Add audio upload/playback retention policy and user-visible privacy note.

## Monetization And Entitlements

- [x] Plan config and usage event helpers added.
- [x] Usage endpoint added.
- [x] Align implemented plan limits with PRD launch structure: Free, Prepare, Intensive, Interview Pass.
- [ ] Add UI paywall states after first evidence workflow, voice practice, job description analysis, and repeated practice attempts.
- [x] Track the PRD's recommended cost drivers: generation, evidence creation, JD analysis, transcription, TTS, feedback.
- [ ] Add admin/debug view or logs for approximate AI cost per activated user.
- [ ] Decide whether AI credits should stay internal or become user-visible.

## Privacy, Safety, And Trust

- [x] Add privacy copy for CV uploads, practice audio, AI processing, and data retention.
- [x] Add delete/export account data workflows.
- [ ] Confirm the product never fabricates achievements, metrics, responsibilities, or outcomes.
- [x] Add tests for confirmed metric filtering and unsupported metric rejection around generation routes.
- [x] Add visible distinction between user-confirmed content and AI suggestions.
- [ ] Add audit trail fields if needed for AI-generated drafts versus confirmed user edits.

## Release Readiness

- [x] Run a full production build.
- [ ] Test with a fresh database and no existing user data.
- [ ] Test with missing optional env vars.
- [ ] Test with missing required env vars and confirm clear startup/runtime errors.
- [ ] Test common file failures: unsupported CV type, too-large file, scanned PDF, empty DOCX.
- [ ] Test browser support for recording and playback on desktop and mobile.
- [x] Add deployment notes for Vercel and Supabase.
- [x] Add monitoring/logging plan for AI errors and upload/transcription failures.
- [ ] Add basic analytics for PRD success metrics: activation, evidence cards created, generated outputs, practice attempts.

## Recommended From Implementation Passes

- [x] Record ElevenLabs TTS calls in usage telemetry or a dedicated provider-cost table.
- [x] Decide whether TTS should have its own monthly plan limit or share practice-attempt limits.
- [ ] Revisit whether TTS needs a separate visible allowance after beta usage data.
- [ ] Add a generated-content revision table if every saved edit needs historical recovery.
- [ ] Add API contract tests for `requireUser()` protected routes using mocked Supabase clients.
- [ ] Add database migration tests or a disposable local Supabase smoke script.
- [x] Add a route-level error boundary for authenticated app pages.
- [x] Add top-level public/auth route error boundaries if needed after QA.
- [x] Add copy-to-clipboard fallback text selection for browsers without Clipboard API support.
- [x] Add explicit max upload size checks in API routes, not only client-side upload controls.
- [x] Add retention policy constants for CV files, extracted text, audio files, transcripts, and generated content.
- [x] Decide whether account deletion should also remove storage objects through an explicit cleanup job.
- [ ] Verify Supabase auth redirect URLs for local, preview, and production deployments.
- [ ] Replace generic entitlement toasts with plan-aware upgrade/paywall UI.
- [ ] Paginate account data exports if large accounts can exceed single-query export limits.
- [ ] Decide whether account exports should include signed file manifests or zipped CV/audio binaries.

## Post-MVP Ideas From PRD

- [ ] Browser extension for job descriptions.
- [ ] Job-board imports.
- [ ] Offline voice practice.
- [ ] More CV export formats.
- [ ] Paid add-ons such as urgent interview pass or review packs.
- [ ] More advanced attempt trends and preparation progress.
- [ ] OAuth sign-in after MVP.
