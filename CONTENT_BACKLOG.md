# Evidence Coach Content Backlog

Source of truth for launch-safe, verified content ideas based on the current Evidence Coach app.

Last updated: 2026-08-01

## Readiness Notes

This backlog is based on the current repository, route surface, commit history, TODO files, product audit, and implemented code.

Important distinction:

- **Ready** means implemented and honestly demonstrable from the current app with prepared local data.
- **Partially ready** means implemented in code but not yet fully launch-safe because realistic browser, data, device, or production testing is still outstanding.
- **Planned** means present in PRD/TODO/product audit but not yet implemented as a usable flow.
- **Archive** means low-priority, too internal, too trivial, or weakly connected to Evidence Coach user value.

Known launch-readiness caveats from `TODO.md`:

- Realistic manual smoke tests are still incomplete.
- Fresh database testing is still incomplete.
- Mobile and accessibility passes are still incomplete.
- Live Gemini-with-real-data checks are not fully marked complete.
- Browser microphone recording UX still needs end-to-end verification.

## Part 1: Ranked Content Backlog

| Rank | Content topic | Specific project event, feature or decision it is based on | Current readiness | Evidence that it is ready | Primary audience | Main takeaway | Content category | Best platform | Recommended format | Required asset | Effort | Directly promotes Evidence Coach | Evergreen value | Discussion potential | Product relevance | Ease of production | Overall priority score | Recommended timing |
|---:|---|---|---|---|---|---|---|---|---|---|---|---|---:|---:|---:|---:|---:|---|
| 1 | Evidence bank as the product model | Core PRD plus implemented evidence cards, builder, practice, and job targets | Ready | Evidence routes, builder uses confirmed cards, practice uses cards | Job seekers | Add experience once, reuse it everywhere | Product demonstration | LinkedIn | Carousel | Evidence-bank diagram | Medium | Yes | 10 | 8 | 10 | 8 | 10 | Launch |
| 2 | Why Evidence Coach does not invent experience | Grounding rules, confirmed-only generation, metric guardrails | Ready | `lib/ai/prompts.ts`, confirmed metric tests, generate API filters confirmed cards | Job seekers | AI should help express truth, not fabricate it | AI trust and safety | LinkedIn | Text or carousel | Draft/confirmed state screenshot | Low | Yes | 10 | 9 | 10 | 8 | 10 | Launch |
| 3 | Duties vs evidence | Product problem from PRD; guided evidence interview implemented | Ready | Evidence interview route/UI creates draft cards from Q&A | Job seekers | Duties describe work; evidence proves ability | Job-seeker education | LinkedIn | Carousel | Example role to evidence card | Medium | Yes | 10 | 8 | 10 | 8 | 9 | Launch |
| 4 | CV upload to review to experiences | CV upload, extraction review, confirm experiences | Ready | `/onboarding`, `/onboarding/review/[id]`, CV extraction code | Job seekers | Your CV becomes editable source material, not hidden AI output | Product demonstration | TikTok/LinkedIn | Short video | Screen recording | High | Yes | 9 | 7 | 10 | 6 | 9 | Launch |
| 5 | Turn a job gap into an evidence prompt | Job target gaps link to focused experiences | Ready | Job target pages link gaps to `/experiences?focus=` | Job seekers | A gap should become a next action | Product demonstration | LinkedIn | Screenshot/carousel | Job gap screenshot | Medium | Yes | 9 | 8 | 10 | 7 | 9 | Launch |
| 6 | Interview Prep Pack first version | Requirements matrix, best evidence, gaps, likely questions | Ready | `/job-targets/[id]/prep`, `lib/prep-pack.ts`, tests | Job seekers | Prepare for a role using confirmed examples | Product demonstration | LinkedIn | Carousel | Prep pack screenshots | Medium | Yes | 9 | 8 | 10 | 7 | 9 | Launch |
| 7 | Practice answers against your own evidence | Practice and feedback compare answers to evidence card | Ready | Practice routes, feedback API, comparison pages | Job seekers | Better interview practice starts from your real examples | Product demonstration | TikTok | Short video | Practice flow recording | High | Yes | 9 | 7 | 10 | 6 | 9 | Launch |
| 8 | Voice dictation for evidence answers | Transcript-only dictation added to guided evidence interview | Partially ready | Component/API/tests exist; browser/mic E2E still TODO | Job seekers | Speak rough answers, then edit before continuing | Accessibility/product demo | LinkedIn/TikTok | Short video | Browser recording after mic test | High | Yes | 8 | 8 | 9 | 5 | 8 | Post-launch |
| 9 | CVs page: uploaded CVs are now discoverable | User feedback: no place to see uploaded CV after import | Ready | `/cv`, `/cv/[id]`, sidebar CVs link | Job seekers/build-in-public | Discoverability matters after upload | UX iteration | LinkedIn | Before/after | Sidebar and CV page screenshot | Low | Yes | 8 | 7 | 9 | 9 | 8.5 | Launch |
| 10 | Evidence card confirmation step | Draft card must be reviewed before confirmed | Ready | Evidence detail/confirm API; draft cards not used by builder | Job seekers | You stay in control before AI output is reused | AI trust and safety | LinkedIn | Screenshot | Draft vs confirmed card | Low | Yes | 9 | 7 | 10 | 8 | 8.5 | Launch |
| 11 | Add missing details to a draft evidence card | Enrich existing draft card flow | Ready | Enrich API, tests, evidence detail supports draft review | Job seekers | Remembered something late? Add it without restarting | Product demonstration | LinkedIn | Short video | Draft card enrichment recording | Medium | Yes | 8 | 7 | 9 | 7 | 8.4 | Post-launch |
| 12 | Multi-role experience checkpoint | Final "what else did you do in this role?" question | Ready | `lib/evidence-interview-flow.ts`, tests, API branch | Career changers | Multi-role histories need extra coverage | Job-seeker education | LinkedIn | Text/screenshot | Question screenshot | Low | Yes | 8 | 7 | 9 | 8 | 8.3 | Launch |
| 13 | Responsibility-scoped card starts | "Create card for this" per responsibility | Ready | Experience detail page uses responsibility-focused links | Job seekers | Start from one duty when a role is broad | Product demonstration | LinkedIn | Screenshot | Experience detail screenshot | Low | Yes | 8 | 6 | 9 | 8 | 8.2 | Launch |
| 14 | Generic AI CV tools vs evidence-first tools | Based on implemented confirmed-evidence workflow | Ready | Builder requires confirmed evidence cards | Job seekers/founders | Generic output is weaker than grounded evidence | Product decision | LinkedIn | Text/carousel | Comparison graphic | Medium | Yes | 9 | 8 | 9 | 7 | 8.2 | Launch |
| 15 | Turn warehouse/service work into reusable examples | Target user from PRD; manual/CV experience plus evidence cards | Ready | Experience and evidence-card flow implemented | Job seekers | Ordinary work can produce strong evidence | Job-seeker education | LinkedIn/TikTok | Before/after | Example role card | Medium | Yes | 10 | 7 | 9 | 7 | 8.1 | Evergreen |
| 16 | Builder generates content only from confirmed cards | Builder page plus generate API guard | Ready | `/builder`, `app/api/generate/route.ts` confirmed-card query | Job seekers | CV/interview content should cite proven examples | Product demonstration | LinkedIn | Screenshot | Builder input/output screenshot | Medium | Yes | 8 | 6 | 9 | 7 | 8 | Launch |
| 17 | Voice practice without personality/emotion scoring | PRD non-goal plus feedback prompt | Ready for principle, flow partially live | Feedback prompt prohibits personality/employability inference | Job seekers/AI builders | Ethical interview tools should avoid creepy scoring | AI trust and safety | LinkedIn | Text | None | Low | Yes | 9 | 9 | 8 | 9 | 8 | Evergreen |
| 18 | Job description matching must not invent missing skills | JD analysis prompt and gap UI | Ready | Job-target flow, JD schema tests, gap warnings | Job seekers | A gap is not a claim | AI trust and safety | LinkedIn | Carousel | Job gap screenshot | Medium | Yes | 9 | 8 | 9 | 7 | 8 | Launch |
| 19 | CV import edge case: Additional Experience line | Real CV-inspired parser hardening | Ready as technical/user education | Splitter helper/tests exist | Developers/job seekers | Real CVs are messy; import needs review | Technical/product lesson | LinkedIn/X | Before/after | Input/output snippet | Low | Indirect | 8 | 8 | 8 | 8 | 7.9 | Post-launch |
| 20 | Technical Experience heading parser fix | CV section rule added | Ready | Section parser/test added | Developers | Small labels can break extraction quality | Technical lesson | X | Code snippet | Parser diff | Low | No | 7 | 6 | 7 | 9 | 7.4 | Post-launch |
| 21 | AI schema validation saved a failed job-analysis response | Gemini invalid output normalized | Ready | Commit `74c4b95`, JD schema tests | Developers | Production AI needs validators and coercion | Technical lesson | X/Reddit | Code snippet | Error plus schema snippet | Low | No | 8 | 8 | 7 | 8 | 7.8 | Post-launch |
| 22 | Confirmed vs suggested metrics | Evidence metrics stay unconfirmed until user confirms | Ready | Evidence prompt/API/test; generate filters confirmed metrics | Job seekers/developers | Numbers need user confirmation | AI trust and safety | LinkedIn | Carousel | Metric state example | Medium | Yes | 9 | 8 | 9 | 7 | 8 | Evergreen |
| 23 | Re-extract CV after editing text | CV detail/source panel supports save and re-extract | Ready | `/cv/[id]`, SourceCvPanel reextract | Job seekers | Fix imported text without reuploading | Product demonstration | TikTok | Short video | CV detail recording | Medium | Yes | 7 | 5 | 8 | 6 | 7.2 | Post-launch |
| 24 | Bulk delete imported experiences | User cleanup flow after CV import | Ready | ExperiencesList bulk selection/delete | Job seekers | Clean up imports faster | UX iteration | X/LinkedIn | Before/after | Experiences page recording | Low | Yes | 6 | 5 | 7 | 8 | 6.8 | Post-launch |
| 25 | Bulk selection toolbar polish | User feedback fixed awkward UI alignment | Ready | Commit `5140ea1`; component changed | UX designers | Functional is not the same as usable | UX iteration | X | Before/after | Screenshot | Low | No | 7 | 6 | 6 | 9 | 6.8 | Post-launch |
| 26 | Sidebar replaced top nav | Authenticated app sidebar implemented | Ready | `components/app-sidebar.tsx`, app layout | Developers/UX | Navigation matured as routes grew | UX iteration | LinkedIn | Before/after | Sidebar screenshots | Medium | Indirect | 7 | 6 | 7 | 7 | 6.8 | Post-launch |
| 27 | Collapsed sidebar bug: labels leaked | Bug fixed after screenshot feedback | Ready | Commits `109490b`, `fb78100` | Developers/designers | Tiny visual bugs affect trust | UX iteration | X | Before/after | Bug screenshot | Low | No | 6 | 7 | 5 | 9 | 6.4 | Archive/Post-launch |
| 28 | Supabase RLS and private storage | Auth, RLS, CV/audio storage documented | Ready technically, not direct user demo | README plus migrations | Developers | Private career data needs private storage | Technical lesson | Reddit | Diagram/code | RLS/storage snippet | Medium | Indirect | 8 | 7 | 6 | 6 | 7 | Post-launch |
| 29 | Signed URLs for CV downloads | File proxy route | Ready | `app/api/files/cv/route.ts` | Developers | Do not make CV uploads public | Technical lesson | X/Reddit | Code snippet | Route snippet | Low | No | 8 | 6 | 6 | 8 | 7 | Evergreen |
| 30 | Usage events vs AI usage events | Entitlement/cost telemetry split | Ready technically | README plus usage tables/helpers | Founders/developers | Separate user limits from provider monitoring | Technical/founder | LinkedIn | Diagram | Architecture diagram | Medium | Indirect | 7 | 7 | 6 | 6 | 6.8 | Post-launch |
| 31 | Gemini active, OpenAI retained but disabled | Provider policy | Ready technically | README plus provider tests | Developers/founders | Provider choice is a product decision | Product decision | X/LinkedIn | Text | None | Low | No | 6 | 7 | 5 | 9 | 6.5 | Post-launch |
| 32 | Mock AI provider for offline testing | Mock provider plus tests | Ready | `lib/ai/providers/mock.ts`, provider tests | Developers | Test AI workflows without network | Technical lesson | X | Code snippet | Mock provider snippet | Low | No | 8 | 6 | 5 | 9 | 6.7 | Evergreen |
| 33 | Retention copy reused across app | Privacy constants | Ready | `lib/retention.ts`, onboarding/settings/practice copy | Founders/developers | Privacy copy should match stored artifacts | Launch preparation | LinkedIn | Text | Privacy UI screenshots | Medium | Indirect | 7 | 6 | 6 | 7 | 6.5 | Post-launch |
| 34 | Account export and deletion | Settings supports export/delete | Ready technically; user-sensitive | Settings/account API | Privacy-minded users | Users should be able to leave with their data | Trust/safety | LinkedIn | Screenshot/text | Settings screenshot | Medium | Yes | 8 | 7 | 7 | 6 | 7 | Post-launch |
| 35 | TTS question playback | Practice TTS route/helper | Partially ready | Route exists; TTS env/manual verification not confirmed | Job seekers | Hearing questions can make practice more realistic | Product demo | TikTok | Video | Practice recording with TTS | High | Yes | 7 | 6 | 7 | 4 | 6.2 | Post-launch |
| 36 | Practice answer comparison | Compare route exists | Ready with sample attempts | `/practice/[id]/compare` | Job seekers | See how retry answers changed | Product demo | LinkedIn | Screenshot | Compare screen | Medium | Yes | 7 | 5 | 8 | 6 | 6.8 | Post-launch |
| 37 | Error boundaries and resilience states | App/auth/onboarding error pages | Ready technically | Error routes exist | Developers | MVPs still need graceful failure states | Technical lesson | X | Text | Error screen screenshot | Low | No | 6 | 5 | 5 | 8 | 6 | Archive/Post-launch |
| 38 | Entitlement limits by plan | Usage endpoint/plan config | Partially ready | Backend exists; paywall UI incomplete | Founders | AI SaaS needs limits before pricing UI | Founder journey | LinkedIn | Text | Plan config snippet | Low | No | 7 | 7 | 5 | 8 | 6.4 | Roadmap |
| 39 | Gemini free-tier disclosure | Onboarding/settings copy | Ready | AiDisclosure component | Founders/AI builders | Data-use disclosure matters in beta | AI trust | LinkedIn | Text | Disclosure screenshot | Low | Indirect | 7 | 7 | 6 | 8 | 6.8 | Post-launch |
| 40 | Production build sandbox failure | Repeated Turbopack sandbox port-bind issue | Archive | Environment-specific, not product value | Developers | Separate environment failure from app failure | Technical lesson | X | Text | Build error snippet | Low | No | 4 | 5 | 2 | 8 | 4.2 | Archive |

## Part 2: Selected Content Sets

### 10 Launch-Stage Posts

| Position | Topic | Why it belongs in the launch sequence | Main takeaway | Best format | Required screenshot, recording, diagram or example |
|---:|---|---|---|---|---|
| 1 | The problem: relevant experience, weak evidence | Opens with user pain, not product UI | Many people have examples but struggle to express them | Text/carousel | Simple duties vs evidence example |
| 2 | Evidence bank model | Explains the core product idea | One confirmed example can support CVs, applications, and interviews | Carousel | Evidence-bank diagram |
| 3 | CV upload to review flow | Shows how users get started | Import your CV, review extracted experience, stay in control | Short video | `/onboarding` to review screen recording |
| 4 | Guided evidence interview | Demonstrates evidence capture | The app asks questions before creating a draft card | Short video | Evidence interview flow |
| 5 | Draft vs confirmed evidence | Builds trust | AI drafts are not treated as facts until reviewed | Screenshot/carousel | Draft card and confirm action |
| 6 | Confirmed evidence in Builder | Connects evidence to output | Generated CV/interview content comes from confirmed cards only | Screenshot | Builder page with selected cards |
| 7 | Job target gaps to action | Shows role-specific value | Missing requirement becomes "build evidence for this gap" | Screenshot/carousel | Job target detail gap section |
| 8 | Interview Prep Pack | Strongest "why pay attention" feature | Prep around role requirements, evidence, gaps, and questions | Carousel | Prep pack screenshots |
| 9 | Practice with evidence | Completes the loop | Interview feedback is grounded in your selected evidence | Short video | Practice session to feedback |
| 10 | Why it is different from generic AI CV tools | Positioning close | Evidence Coach helps communicate truth, not fabricate polish | Text/carousel | Comparison graphic |

### 10 Evergreen Educational Posts

| Topic | Primary audience | Main value | Recommended format |
|---|---|---|---|
| Duties vs achievements vs evidence | Job seekers | Understand what interviewers actually need | Carousel |
| How to find evidence in ordinary work | Career changers/service workers | Makes non-office work feel valid | Text |
| What to do when you have no metrics | Job seekers | Use honest outcomes without fake numbers | Carousel |
| Why interview answers sound vague | Job seekers | Missing personal action and outcome | Text |
| How to prepare stories before an interview | Job seekers | Build examples before practising scripts | Carousel |
| Turning one role into multiple evidence cards | Job seekers | A role is not one story | Diagram |
| Why "I helped" needs more detail | Job seekers | Clarify ownership and contribution | Text |
| How to use job descriptions without copying them | Job seekers | Match evidence to requirements honestly | Carousel |
| What to do when you remember details late | Job seekers | Add missing detail, then review | Text/demo |
| Why confidence comes from evidence, not memorisation | Job seekers | Practice from real examples | Text |

### 5 Technical Posts

| Topic | Why it is useful | Recommended format | Required asset |
|---|---|---|---|
| AI schema validation for generated payloads | Practical production-AI lesson | Code snippet | Zod schema plus invalid Gemini output shape |
| Confirmed vs suggested metrics | Shows trust boundary in data model | Code/carousel | Confirmed metric filter test |
| CV parsing edge cases | Real data-normalisation problem | Before/after | Additional Experience splitter |
| Supabase RLS and private CV storage | Security lesson tied to user data | Diagram/code | RLS/storage policy excerpt |
| Mock AI provider for workflow tests | Useful for local/offline AI testing | Code snippet | Mock provider/test snippet |

### 5 Founder Or Build-In-Public Posts

| Topic | Why it matters | Recommended format |
|---|---|---|
| User feedback revealed there was no CV library | Feature discoverability lesson | Before/after |
| Enrich card beat "combine cards" as the first fix | Product sequencing decision | Text |
| Evidence-first positioning instead of AI CV writer | Strategic differentiation | Text |
| Trust and privacy decisions for CV/audio data | Builds credibility | Text/screenshot |
| Interview Prep Pack as the customer-winning bet | Shows product focus | Product strategy thread |

### 5 Short Video Demonstrations

| Demo | Opening screen | User action | Visible result | Core takeaway | Estimated scenes/cuts |
|---|---|---|---|---|---:|
| Upload CV and review extraction | `/onboarding` | Upload sample CV | Review entries grouped by type | AI import is reviewed before saving | 4-5 |
| Create evidence from an experience | Experience detail | Click responsibility / create card | Guided questions, draft card | Evidence is uncovered through questions | 5-6 |
| Add missing details to draft card | Draft evidence card | Click add missing details, submit | Updated draft fields | You can improve a card before confirming | 4-5 |
| Job gap to evidence prompt | Job target detail | Click gap action | Focused experiences/evidence flow | Gaps become next actions | 3-4 |
| Interview Prep Pack | Job target prep page | Open pack | Matrix, evidence, gaps, likely questions | Role prep is organised around proof | 3-4 |

Do not record voice dictation, TTS, or microphone practice for launch until browser/device testing is done with realistic data.

## Part 3: Excluded And Future Content

### Roadmap Or Future Discussion

| Idea | What is missing | What must be completed before it can be promoted | Could still be discussed transparently? |
|---|---|---|---|
| Full CV document editor | Only CV import/view/extracted text exists | Editing/exporting designed CV documents | Yes, as roadmap |
| Browser extension for job descriptions | Not implemented | Extension flow and auth handoff | Yes |
| Job-board imports | Not implemented | Importer and supported boards | Yes |
| Offline voice practice | Not implemented | Offline recording/transcription strategy | Yes |
| Paywall/pricing UI | Backend entitlements exist, UI paywalls incomplete | User-facing upgrade/paywall flows | Yes, founder discussion only |
| Exportable one-page prep summary | TODO only | Export UI and output generation | Yes |
| Practice queue progress | Prep pack lists questions but queue tracking incomplete | Queue state and retry progress | Yes |
| "Facts used" beside generated content | TODO | Provenance UI in Builder outputs | Yes |
| Inline source-fact highlighting | TODO | Field-to-source mapping UI | Yes |
| Card completeness indicator | TODO | Checklist/scoring UI | Yes |
| AI gap scan after draft | TODO | Non-mutating scan flow | Yes |
| Merge selected evidence cards | TODO | Multi-card merge UI/API | Yes |
| Split one employer into multiple roles | TODO | Experience-model helper | Yes |
| Skill-category preservation | TODO | Data model/UI for categories | Yes |
| Review warning for projects without dates | TODO | Import warning UI | Yes |

### Archive Or Low-Priority

| Idea | Why it was deprioritised |
|---|---|
| Collapsed sidebar label leak | Too small and mostly developer/design-process content |
| Sidebar icon centering bug | Fine for X, weak product value |
| Turbopack sandbox port-bind failure | Environment-specific, not useful to job seekers |
| Error boundary implementation | Important engineering, weak user-facing story |
| Exact ElevenLabs TTS cost handling | Too internal until TTS is launch-validated |
| OpenAI retained but disabled | Interesting to builders, not relevant to users yet |
| Migration/rollback process | Good engineering hygiene, low marketing value |
| Account export pagination | Future technical concern |
| Generic "I shipped a feature" updates | Weak unless tied to user insight |
| Top nav to sidebar alone | Useful only if framed as navigation maturity, not standalone launch content |

## Part 4: Recommended First 4-Week Posting Order

Use only verified-ready content in this sequence. Avoid placing two highly technical posts consecutively.

| Week | Post | Topic | Platform | Format |
|---:|---:|---|---|---|
| 1 | 1 | Why relevant experience often fails to become interview evidence | LinkedIn | Text/carousel |
| 1 | 2 | Evidence bank model | LinkedIn | Carousel |
| 1 | 3 | CV upload to review flow | TikTok/LinkedIn | Short video |
| 2 | 4 | Duties vs evidence | LinkedIn | Educational carousel |
| 2 | 5 | Why Evidence Coach does not invent achievements | LinkedIn | Trust post |
| 2 | 6 | Guided evidence interview demo | TikTok/LinkedIn | Short video |
| 3 | 7 | Confirmed evidence powers Builder outputs | LinkedIn | Screenshot/demo |
| 3 | 8 | Real CV edge case: Additional Experience compression | X/LinkedIn | Before/after |
| 3 | 9 | Job description gaps become evidence actions | LinkedIn | Carousel |
| 4 | 10 | Interview Prep Pack walkthrough | LinkedIn/TikTok | Carousel/video |
| 4 | 11 | Practice answers using your own evidence | LinkedIn | Product demo |
| 4 | 12 | User feedback: "where do I see my uploaded CV?" | LinkedIn/X | Build-in-public |

## Production Notes

Before turning any item into a post:

- Re-check the route locally with representative data.
- Avoid implying production launch readiness until fresh database, auth redirect, storage, mobile, and accessibility checks are complete.
- Avoid promoting microphone-based flows until browser/device testing is complete.
- Label roadmap features transparently when discussing unfinished ideas.
- Prefer screenshots and recordings from actual implemented flows rather than mockups.
