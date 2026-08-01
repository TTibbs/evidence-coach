# Evidence Coach

Turn real experience into stronger CV evidence and interview answers.

## Stack

- Next.js (App Router) + TypeScript + Tailwind + shadcn-style UI
- Supabase (Auth, Postgres, Storage)
- **Google Gemini** (`gemini-3.6-flash` via `@google/genai`) — active MVP AI provider
- OpenAI — retained for future paid use; **disabled for users** during MVP
- ElevenLabs (practice question TTS)

## Setup

1. Copy env file:

```bash
cp .env.example .env.local
```

2. Create a Supabase project, set `DATABASE_URL` in `.env.local`, then apply migrations:

```bash
npm run db:status          # see applied vs pending
npm run db:migrate:dry     # preview pending SQL (no changes)
npm run db:migrate         # prompts y/N, then applies only pending migrations
npm run db:rollback:dry    # preview rollback
npm run db:rollback        # prompts y/N, rolls back the latest migration
```

Migrations are tracked in `public.schema_migrations`, so re-running `db:migrate` skips already-applied files. Each forward file (`*.sql`) should have a matching `*.down.sql` for rollbacks.

Alternatively, use the Supabase CLI:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

3. Confirm storage buckets `cvs` and `practice-audio` exist.

4. Fill `.env.local`:
   - **Required for AI:** `GEMINI_API_KEY` (and optional `GEMINI_MODEL`, default `gemini-3.6-flash`)
   - **Optional:** `OPENAI_API_KEY` (not required while OpenAI is disabled)
   - **Optional auth:** set `NEXT_PUBLIC_AUTH_OAUTH_PROVIDERS=google` after configuring the matching Supabase Auth provider
   - Set `BETA_PLAN_OVERRIDE=prepare` for local testing of voice / JD matching entitlements
   - Use `AI_PROVIDER=mock` for offline/local tests without live Gemini calls

5. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL for auth and database clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase browser/server anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only admin access for storage/file proxy operations |
| `NEXT_PUBLIC_AUTH_OAUTH_PROVIDERS` | No | Comma-separated Supabase OAuth providers to show, e.g. `google` or `google,github` |
| `DATABASE_URL` | Yes for migrations | Postgres connection string used by `npm run db:*` |
| `AI_PROVIDER` | Yes | `gemini`, `mock`, or gated `openai` |
| `GEMINI_API_KEY` | Yes for live AI | Gemini API key for MVP AI workflows |
| `GEMINI_MODEL` | No | Defaults to `gemini-3.6-flash` |
| `OPENAI_API_KEY` | No | Reserved for future paid provider use |
| `OPENAI_MODEL` | No | Defaults to `gpt-4o-mini` when OpenAI is enabled |
| `AI_GEMINI_ENABLED` | No | Defaults enabled; set `false` to disable Gemini |
| `AI_OPENAI_ENABLED` | No | Defaults disabled for MVP |
| `AI_OPENAI_USER_ACCESS` | No | Defaults disabled for users |
| `AI_FREE_DAILY_REQUEST_LIMIT` | No | Daily AI request limit per user |
| `AI_FREE_MONTHLY_REQUEST_LIMIT` | No | Monthly AI request limit per user |
| `ELEVENLABS_API_KEY` | Yes for TTS | Practice question text-to-speech |
| `ELEVENLABS_VOICE_ID` | No | Defaults to ElevenLabs Rachel voice |
| `BETA_PLAN_OVERRIDE` | No | Local/beta plan override: `free`, `prepare`, `intensive`, or `interview-pass` |
| `DEV_BYPASS_ENTITLEMENTS` | No | Local-only entitlement bypass |

## Supabase Storage And RLS

The initial migration creates two private storage buckets:

| Bucket | Stored data | Expected object path |
|--------|-------------|----------------------|
| `cvs` | Uploaded CV files up to 10 MB | `{user_id}/{cv_import_id}-{filename}` |
| `practice-audio` | Voice practice recordings up to 25 MB | `{user_id}/{attempt_id}.webm` |

Storage policies allow authenticated users to upload, read, and delete only objects
whose first path segment matches `auth.uid()`. The app uses short-lived signed URLs
for CV downloads and deletes practice audio independently from transcripts/feedback.

All application tables have user-owned RLS policies in the base migration. Keep new
tables on the same pattern: `user_id = auth.uid()` for reads/writes, and avoid public
storage buckets for CVs or recordings.

## Supabase OAuth Setup

The app supports Supabase Auth OAuth via `/auth/callback`. Password login/signup
remain available.

To enable Google:

1. In Google Cloud, create an OAuth client for the app.
2. Add the Supabase callback URL to Google:
   `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
3. In Supabase Dashboard → Authentication → Providers → Google, enable Google and
   paste the client ID and secret.
4. In Supabase Dashboard → Authentication → URL Configuration, add allowed app
   redirects:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR_PRODUCTION_DOMAIN/auth/callback`
5. In `.env.local`, set:

```bash
NEXT_PUBLIC_AUTH_OAUTH_PROVIDERS=google
```

For more providers, enable each one in Supabase first, then add it to the comma-
separated env list, e.g. `google,github`. If a provider is listed here but not
enabled in Supabase, the button will show but sign-in will fail with a provider
configuration error.

## Usage And Cost Tracking

Two tables track usage:

| Table | Purpose | Examples |
|-------|---------|----------|
| `usage_events` | Product entitlements and plan limits | CV imports, content generation, job analysis, practice feedback, TTS |
| `ai_usage_events` | Provider telemetry and cost monitoring | CV extraction, evidence questions/cards, JD analysis, transcription, token counts, provider errors |

For launch monitoring, review the cost-driving operations first: `cv_extraction`,
`evidence_card`, `career_content`, `job_analysis`, `voice_transcription`,
`practice_feedback`, and `tts`.

TTS currently shares the monthly practice-attempt allowance. This keeps the
ElevenLabs cost guarded without introducing a separate visible limit during the MVP.

## Retention Policy Constants

Retention language lives in `lib/retention.ts` and is reused in onboarding, settings,
and practice feedback. Keep product copy and backend cleanup behavior aligned with
those constants when adding new stored artifacts.

## Account Data Export

Settings can download a JSON export from `GET /api/account`. The export includes
user-owned database rows for profiles, experiences, evidence cards/interviews, job
targets, generated content, practice sessions/attempts, CV import metadata, and usage
events. Stored CV files and practice audio are not embedded in the JSON export; users
can download CV files separately from Settings.

## AI providers

| Provider | MVP status | Notes |
|----------|------------|--------|
| Gemini | Active / free beta | Extraction, evidence, generation, JD match, feedback, voice STT |
| OpenAI | Disabled | Code retained; factory + flags block all user requests |
| Mock | Dev/tests | `AI_PROVIDER=mock` |

Server enforcement: `getCareerAiProvider()` + `canUseProvider()` + `AI_OPENAI_*` flags. Client-supplied provider names are ignored. Gemini failures **never** fall back to OpenAI.

### Privacy / free-tier note

Gemini Developer API free-tier content may be used by Google to improve its products. Paid Gemini tiers have different data-use terms. Disclose this to beta users (see Settings / onboarding).

### Manual AI workflow checks

1. Upload CV → extraction uses Gemini
2. Evidence interview → questions + draft card via Gemini
3. Builder generate → Gemini
4. Job target analyse → Gemini
5. Practice text feedback → Gemini
6. Practice voice → Gemini transcription (not Whisper)
7. With OpenAI env unset and flags false, app still starts; no OpenAI network calls

## Tests

```bash
npm test
npm run lint
npm run build
```

## Deployment Notes

Recommended deployment shape:

1. Create/link the Supabase project and apply all migrations with `npm run db:migrate`.
2. Confirm private storage buckets `cvs` and `practice-audio` exist after migration.
3. Add the environment variables from `.env.example` to Vercel.
4. Keep `AI_PROVIDER=gemini`, `AI_OPENAI_ENABLED=false`, and
   `AI_OPENAI_USER_ACCESS=false` for the MVP unless deliberately testing another provider.
5. Set `BETA_PLAN_OVERRIDE` only for private beta environments; leave it unset for paid-plan testing.
6. Run `npm run build` in CI before deployment.

Deployment blockers to check manually before public launch:

- Signup/login/reset redirects against the production Supabase auth URL.
- Storage uploads and signed downloads for CVs and practice audio.
- Gemini live requests with OpenAI env vars absent.
- ElevenLabs TTS usage and cost telemetry.
- Account deletion behavior, including storage-object cleanup for `cvs` and `practice-audio`.

## Monitoring Plan

Watch these surfaces during beta:

| Surface | Signal | Where to inspect |
|---------|--------|------------------|
| AI provider health | Failed operations, error categories, token counts | `ai_usage_events` |
| Product limits | Monthly entitlement pressure by user/action | `usage_events` |
| CV import failures | `failed` CV imports and `error_message` values | `cv_imports` |
| Practice transcription | Failed `voice_transcription` provider events | `ai_usage_events` |
| TTS cost | `tts` usage events with character metadata | `usage_events` |
| Storage cleanup | Failed delete requests from account/CV/audio routes | server logs |

For launch, alert on repeated provider `quota`, `auth`, or `invalid_output` errors,
spikes in failed CV imports, and any account deletion storage-cleanup failures.

## Notes

- AI outputs are validated with Zod before storage.
- Draft evidence cards are never reused for generation until confirmed.
- Product entitlements: `usage_events` + `PLAN_CONFIG` for Free, Prepare, Intensive, and Interview Pass.
- Provider telemetry: `ai_usage_events` + daily/monthly `AI_FREE_*_REQUEST_LIMIT`.
