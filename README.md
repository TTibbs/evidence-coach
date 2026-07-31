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
   - Set `BETA_PLAN_OVERRIDE=prepare` for local testing of voice / JD matching entitlements
   - Use `AI_PROVIDER=mock` for offline/local tests without live Gemini calls

5. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

## Notes

- AI outputs are validated with Zod before storage.
- Draft evidence cards are never reused for generation until confirmed.
- Product entitlements: `usage_events` + `PLAN_CONFIG`.
- Provider telemetry: `ai_usage_events` + daily/monthly `AI_FREE_*_REQUEST_LIMIT`.
