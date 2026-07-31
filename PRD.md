# Product Requirements Document

## Working Title: Evidence Coach

**Version:** MVP 1.0
**Product type:** Web application
**Primary platform:** Desktop and mobile web
**Core purpose:** Help users identify evidence from their real experience, turn it into stronger job-search material, and practise explaining it in interviews.

---

# 1. Product Summary

Evidence Coach helps users who struggle to explain their experience, write effective CV content, or answer interview questions confidently.

The product creates a reusable **evidence bank** from the user’s jobs, projects, education, volunteering, and other relevant experiences.

Users can:

1. Upload a CV or manually add experience.
2. Answer guided questions to create structured evidence cards.
3. Use those cards to improve CV content and generate interview answers.
4. Practise answering role-specific interview questions.
5. Receive feedback based on the evidence they previously provided.

The evidence bank acts as the central source of truth across the product.

The application must not invent achievements, metrics, responsibilities, or outcomes that the user has not confirmed.

---

# 2. Problem

Many job seekers have relevant experience but struggle to communicate it effectively.

Common problems include:

- describing duties instead of achievements
- spending too long explaining the situation
- failing to explain their personal contribution
- forgetting useful examples during interviews
- providing vague or unsupported outcomes
- using generic CV wording
- struggling to tailor experience to a specific role
- memorising scripted answers that sound unnatural
- becoming overwhelmed during interviews

Existing CV and interview tools often generate generic content without first understanding what the user has genuinely done.

Evidence Coach addresses this by building structured, verified evidence before generating or evaluating content.

---

# 3. Product Proposition

> Turn your real experience into stronger CV evidence and interview answers.

Supporting proposition:

> Add your experience once, then reuse it across your CV, applications, and interview practice.

---

# 4. Product Goals

The MVP should allow users to:

- quickly import or add their work history
- uncover useful examples hidden within each experience
- create reusable evidence cards
- improve CV bullets using verified evidence
- generate structured interview answers
- practise explaining their experience through text or voice
- receive clear and actionable feedback
- identify gaps in their evidence bank

---

# 5. Non-Goals

The MVP will not include:

- full job-board functionality
- automatic job applications
- live human interview coaching
- facial-expression analysis
- eye-contact analysis
- emotion detection
- advanced speech coaching
- video interview recording
- complete drag-and-drop CV design
- recruiter accounts
- employer dashboards
- social networking
- career personality tests
- automated background research on employers
- fabricated performance metrics
- guaranteed interview or employment outcomes

---

# 6. Target Users

## Primary user

A job seeker who has relevant experience but struggles to communicate it clearly.

Typical characteristics:

- limited interview confidence
- unsure how to describe achievements
- weak or generic CV wording
- difficulty identifying transferable skills
- may have experience across different industries
- may not have formal performance metrics
- may struggle under pressure despite preparing beforehand

## Secondary users

- career changers
- junior developers
- graduates
- people returning to work
- warehouse, retail, care, hospitality, and service workers
- freelancers presenting client work
- people with project or volunteering experience but limited formal employment

---

# 7. Core Product Model

The central object in the product is an **evidence card**.

An evidence card represents one specific example from a user’s experience.

A single role may contain multiple evidence cards.

Example:

```text
Warehouse Operative
├── Worked effectively during a high-volume shift
├── Helped a new starter understand the picking system
├── Identified and corrected a stock issue
├── Adapted to a new process
└── Maintained accuracy under time pressure
```

Evidence cards are used by:

- the CV builder
- the interview answer builder
- the mock interview system
- the feedback system
- job-description matching

---

# 8. MVP Features

The MVP contains three primary features.

---

# Feature 1: Experience and Evidence Bank

## 8.1 Objective

Allow users to import or manually add experience, then convert it into structured evidence cards through guided questions.

## 8.2 Entry Methods

Users can begin in one of two ways:

### CV upload

Supported MVP file types:

- PDF
- DOCX

The system extracts:

- name
- job titles
- employers
- dates
- responsibilities
- education
- projects
- skills
- volunteering experience

The user must review and confirm extracted information before it is saved.

### Manual entry

Users can manually add:

- job
- freelance project
- personal project
- volunteering
- education
- training
- other relevant experience

## 8.3 Experience Entry Structure

Each experience should contain:

```ts
type Experience = {
  id: string;
  userId: string;
  type:
    | "employment"
    | "project"
    | "freelance"
    | "volunteering"
    | "education"
    | "other";
  organisation?: string;
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  responsibilities: string[];
  source: "manual" | "cv-import";
  createdAt: string;
  updatedAt: string;
};
```

## 8.4 Evidence Discovery

After an experience is created, the application asks guided questions to uncover evidence.

Questions should adapt to the user’s previous answers.

Example question categories:

- What were you responsible for?
- What made the work difficult?
- What problem did you encounter?
- What did you personally do?
- Why did you choose that approach?
- Did you help another person?
- Did you improve anything?
- Did you deal with pressure?
- Did you make or correct a mistake?
- Did you learn a new system or process?
- What changed because of your actions?
- Did you receive feedback?
- Is there a number, timeframe, target, or measurable result?

The system should ask approximately five to eight questions per evidence card.

It should stop when it has enough information to create a credible example.

## 8.5 Evidence Card Structure

```ts
type EvidenceCard = {
  id: string;
  userId: string;
  experienceId: string;

  title: string;
  summary: string;

  situation: string;
  task?: string;
  actions: string[];
  outcome: string;
  reflection?: string;

  skills: string[];
  competencies: string[];
  metrics: EvidenceMetric[];

  sourceFacts: string[];
  confidenceStatus: "draft" | "confirmed";
  createdAt: string;
  updatedAt: string;
};

type EvidenceMetric = {
  label: string;
  value: string;
  confirmed: boolean;
};
```

## 8.6 Evidence Card Rules

The system must:

- clearly separate user-provided facts from generated wording
- avoid inventing numbers
- avoid exaggerating responsibility
- avoid changing team actions into individual actions
- prompt for clarification when the result is vague
- allow the user to edit every field
- require confirmation before the card becomes reusable
- show which experience the card came from

## 8.7 Competency Tags

Evidence cards may be tagged with competencies such as:

- teamwork
- leadership
- communication
- problem-solving
- working under pressure
- organisation
- adaptability
- conflict resolution
- customer service
- initiative
- learning quickly
- attention to detail
- technical ability
- reliability
- ownership
- decision-making

The system may suggest tags, but the user can change them.

## 8.8 Evidence Bank Interface

The evidence bank should allow users to:

- view all evidence cards
- filter by experience
- filter by skill
- filter by competency
- search cards
- edit cards
- archive cards
- mark favourites
- identify evidence gaps

Example gap message:

> You have several examples covering teamwork and pressure, but no confirmed examples for conflict resolution or leadership.

## 8.9 Acceptance Criteria

- A user can upload a CV and review extracted experience.
- A user can manually create an experience.
- A user can answer guided questions.
- The system can create an evidence card from those answers.
- The user can edit and confirm the card.
- One experience can contain multiple evidence cards.
- No generated metric is presented as fact without confirmation.

---

# Feature 2: CV and Answer Builder

## 9.1 Objective

Turn confirmed evidence cards into useful CV content, application content, and interview answers.

## 9.2 Supported Outputs

The MVP should support:

- CV bullet point
- CV role summary
- professional profile paragraph
- interview answer
- STAR answer
- 20/60/20 answer
- application question response
- “Tell me about yourself” response

## 9.3 CV Improvement Flow

The user can:

1. Select an experience.
2. Select one or more evidence cards.
3. Choose the target role.
4. Optionally paste a job description.
5. Generate improved CV content.
6. Compare the original and improved versions.
7. edit, copy, or save the result.

## 9.4 CV Output Rules

Generated CV content must:

- use confirmed evidence
- remain concise
- prioritise actions and impact
- avoid unsupported claims
- avoid fabricated metrics
- avoid excessive buzzwords
- use language appropriate for the target role
- distinguish between responsibilities and achievements
- preserve the user’s actual level of seniority

## 9.5 Job Description Matching

Users may paste a job description.

The system should identify:

- important skills
- repeated requirements
- likely competencies
- relevant keywords
- evidence cards that match
- unsupported requirements
- evidence gaps

Example output:

```text
Strong matches
- Working under pressure
- Following operational processes
- Supporting colleagues

Partial matches
- Stock management
- Health and safety

No confirmed evidence
- Supervising a team
- Reporting performance data
```

The system must not add missing requirements to the user’s CV unless the user provides evidence.

## 9.6 Interview Answer Builder

The user selects:

- an interview question
- a competency
- an evidence card
- an answer structure
- desired answer length

Supported structures:

### 20/60/20

- approximately 20% context
- approximately 60% action
- approximately 20% outcome

### STAR

- situation
- task
- action
- result

### Concise

- direct answer
- supporting example
- outcome or reflection

## 9.7 Ratio Guidance

The 20/60/20 ratio should be treated as guidance rather than a strict rule.

The system should display an approximate breakdown:

```text
Context: 24%
Action: 58%
Outcome: 18%
```

It should flag obvious imbalance:

> The answer spends too much time explaining the situation. Reduce the opening and expand on your individual actions.

## 9.8 Generated Answer Views

The interface should support:

- structured view
- plain answer view
- highlighted sections
- copy to clipboard
- save to practice queue
- regenerate with a different length
- simplify wording
- make more conversational
- make more formal

## 9.9 User Editing

Users must be able to:

- directly edit generated content
- save edited versions
- mark a version as preferred
- restore the generated version
- return to the supporting evidence card

## 9.10 Acceptance Criteria

- A user can select evidence and generate a CV bullet.
- A user can paste a job description.
- The system can rank relevant evidence cards.
- The system can identify unsupported requirements.
- A user can generate a STAR or 20/60/20 answer.
- Generated content does not include unconfirmed claims.
- The user can save generated content for later use.

---

# Feature 3: Interview Practice and Feedback

## 10.1 Objective

Help users practise explaining their evidence in response to realistic interview questions.

## 10.2 Practice Modes

The MVP should support:

### Text mode

The user types an answer.

### Voice mode

The user records an answer.

The application transcribes the recording and analyses the transcript.

Voice analysis in the MVP should focus on:

- answer content
- duration
- filler-word frequency
- long pauses where reliably detectable
- repeated phrases

The MVP should not claim to assess personality, emotion, honesty, or employability.

## 10.3 Question Sources

Questions may be generated from:

- selected evidence card
- selected competency
- target job title
- pasted job description
- common interview question templates
- evidence gaps

Example questions:

- Tell me about a time you worked under pressure.
- Describe a problem you solved.
- Give an example of when you supported a colleague.
- Tell me about a mistake you made.
- Describe a time you had to adapt quickly.
- What would you do differently next time?
- How does this experience prepare you for this role?

## 10.4 Practice Flow

1. User chooses a target role or job description.
2. System selects a question.
3. User chooses text or voice.
4. User answers.
5. System analyses the response.
6. User receives structured feedback.
7. User reviews relevant evidence.
8. User retries the question.
9. Attempts are compared.

## 10.5 Feedback Categories

Each answer should be evaluated across:

### Relevance

Did the user answer the question asked?

### Ownership

Is it clear what the user personally did?

### Specificity

Did the user describe concrete actions?

### Structure

Was the answer logically organised?

### Evidence

Was the answer supported by the evidence card?

### Outcome

Did the user explain what changed or what they learned?

### Conciseness

Was the answer appropriately focused?

### Delivery

For voice answers:

- duration
- pace
- filler words
- repeated phrasing
- excessive pauses

## 10.6 Feedback Format

Feedback should be specific and actionable.

Example:

```text
What worked

You clearly explained that you personally broke the process into smaller steps and demonstrated it to the new starter.

What to improve

The opening takes up too much of the answer. Reduce the description of the warehouse environment to one sentence.

Your outcome is vague. Mention that the colleague required less support later in the shift.

Try again

Keep the context under 20 seconds and spend more time explaining why you chose that approach.
```

## 10.7 Scoring

Scores should be used as progress indicators rather than authoritative assessments.

Suggested categories:

```ts
type PracticeScores = {
  relevance: number;
  ownership: number;
  specificity: number;
  structure: number;
  evidence: number;
  outcome: number;
  conciseness: number;
  delivery?: number;
};
```

Each score should range from 0 to 100.

Scores should include written reasoning.

The system should avoid presenting one overall number as a definitive measure of interview ability.

## 10.8 Evidence Comparison

The application should compare the answer with the selected evidence card.

It may identify:

- useful facts the user omitted
- unsupported claims added during the answer
- contradictions
- actions described too vaguely
- outcomes not mentioned
- irrelevant details

Example:

> Your evidence card mentions that you demonstrated the scanner workflow and checked the colleague’s understanding. Neither detail appeared in your answer.

## 10.9 Attempt History

For each question, store:

- question
- evidence card used
- transcript or text answer
- duration
- scores
- feedback
- date
- attempt number

Users should be able to compare attempts.

Example:

```text
Attempt 1
Ownership: 54
Specificity: 48
Structure: 61

Attempt 2
Ownership: 76
Specificity: 72
Structure: 78
```

## 10.10 Acceptance Criteria

- A user can answer a question using text.
- A user can record and transcribe a voice answer.
- Feedback references the selected evidence card.
- The system identifies missing actions and outcomes.
- The user can retry the same question.
- The user can compare attempts.
- Feedback provides actionable guidance rather than only scores.

---

# 11. Primary User Journey

## First-Time User

```text
Create account
    ↓
Upload CV or add experience manually
    ↓
Review extracted roles and projects
    ↓
Select an experience
    ↓
Answer guided evidence questions
    ↓
Confirm evidence card
    ↓
Generate improved CV content
    ↓
Select target role or paste job description
    ↓
Generate interview questions
    ↓
Practise answer
    ↓
Receive feedback
    ↓
Retry and compare
```

---

# 12. Dashboard

The dashboard should prioritise actions rather than statistics.

Suggested dashboard sections:

## Continue preparing

- incomplete evidence cards
- unanswered evidence questions
- saved interview practice sessions

## Evidence overview

- total experiences
- confirmed evidence cards
- competencies covered
- evidence gaps

## Recent outputs

- CV bullets
- saved interview answers
- recent practice attempts

## Suggested next action

Examples:

- Build another evidence card for your latest role.
- Add an example covering conflict resolution.
- Retry your working-under-pressure answer.
- Tailor your evidence for the saved job description.

---

# 13. Information Architecture

Suggested primary navigation:

```text
Dashboard
Experiences
Evidence Bank
Builder
Practice
Job Targets
Settings
```

## Experiences

Contains jobs, projects, volunteering, education, and other source entries.

## Evidence Bank

Contains structured examples derived from experiences.

## Builder

Creates CV content, application content, and interview answers.

## Practice

Contains mock questions, attempts, feedback, and progress.

## Job Targets

Contains saved target roles and job descriptions.

---

# 14. Suggested Data Model

```ts
type User = {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
};

type Experience = {
  id: string;
  userId: string;
  type: ExperienceType;
  organisation?: string;
  title: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  responsibilities: string[];
  source: "manual" | "cv-import";
  createdAt: string;
  updatedAt: string;
};

type EvidenceCard = {
  id: string;
  userId: string;
  experienceId: string;
  title: string;
  summary: string;
  situation: string;
  task?: string;
  actions: string[];
  outcome: string;
  reflection?: string;
  skills: string[];
  competencies: string[];
  metrics: EvidenceMetric[];
  sourceFacts: string[];
  confidenceStatus: "draft" | "confirmed";
  createdAt: string;
  updatedAt: string;
};

type JobTarget = {
  id: string;
  userId: string;
  title: string;
  company?: string;
  description?: string;
  extractedSkills: string[];
  extractedCompetencies: string[];
  createdAt: string;
};

type GeneratedContent = {
  id: string;
  userId: string;
  evidenceCardIds: string[];
  jobTargetId?: string;
  type:
    | "cv-bullet"
    | "role-summary"
    | "profile"
    | "star-answer"
    | "twenty-sixty-twenty"
    | "application-answer"
    | "tell-me-about-yourself";
  content: string;
  userEditedContent?: string;
  createdAt: string;
};

type PracticeSession = {
  id: string;
  userId: string;
  jobTargetId?: string;
  evidenceCardId?: string;
  question: string;
  mode: "text" | "voice";
  createdAt: string;
};

type PracticeAttempt = {
  id: string;
  practiceSessionId: string;
  answerText: string;
  audioUrl?: string;
  durationSeconds?: number;
  scores: PracticeScores;
  feedback: PracticeFeedback;
  structureBreakdown?: {
    contextPercentage: number;
    actionPercentage: number;
    outcomePercentage: number;
  };
  createdAt: string;
};
```

---

# 15. AI Behaviour Requirements

## 15.1 Evidence Grounding

All generated content must be grounded in:

- confirmed evidence cards
- user-entered experience
- user-confirmed CV data
- supplied job descriptions

The model should not treat its own previous output as verified evidence.

## 15.2 Missing Information

When useful information is missing, the system should:

1. ask the user for clarification
2. use neutral qualitative language
3. mark uncertain content clearly

It must not fabricate:

- percentages
- revenue
- savings
- team sizes
- customer numbers
- performance rankings
- productivity targets
- awards
- promotions
- qualifications
- management responsibilities

## 15.3 Ownership Language

The system should distinguish between:

- “I did”
- “I contributed to”
- “I supported”
- “My team did”
- “I was responsible for”

It must not convert collaborative work into sole ownership.

## 15.4 Tone

Generated content should be:

- clear
- professional
- natural
- specific
- credible
- appropriate to the user’s seniority

It should avoid:

- excessive corporate language
- inflated claims
- unnatural confidence
- generic motivational wording
- repetitive action verbs
- overly polished answers that sound memorised

## 15.5 Feedback Behaviour

Feedback must:

- cite specific parts of the user’s answer
- explain why something is weak
- suggest one or more concrete improvements
- recognise useful details
- avoid insulting or discouraging language
- avoid claiming certainty about how an interviewer would react

---

# 16. CV Parsing Requirements

The parser should attempt to extract:

- personal summary
- employment history
- education
- skills
- projects
- volunteering
- certifications

The application must show an import review screen.

The user should be able to:

- correct titles
- correct dates
- merge duplicate entries
- remove irrelevant sections
- add missing experience
- confirm imported information

A CV upload should never directly create confirmed evidence cards.

It only creates initial experience entries.

---

# 17. Privacy and Data Handling

The product will contain sensitive career and personal information.

The MVP should include:

- encrypted transport
- secure authenticated access
- private user data by default
- clear deletion controls
- account deletion
- CV deletion
- audio recording deletion
- visible data retention information
- no public profiles
- no sharing without explicit user action

Audio should be removable independently from transcripts.

The application should avoid storing raw files longer than necessary after processing unless the user chooses to retain them.

---

# 18. Accessibility Requirements

The MVP should meet WCAG 2.2 AA where practical.

Requirements include:

- full keyboard navigation
- visible focus states
- semantic form labels
- accessible validation messages
- screen-reader-friendly progress indicators
- sufficient colour contrast
- no information conveyed using colour alone
- captions or transcripts for audio content
- reduced-motion support
- clearly structured headings
- accessible file-upload controls

---

# 19. Responsive Design

The application should work across:

- desktop
- tablet
- mobile browser

Desktop should be optimised for:

- CV editing
- comparing content
- reviewing evidence
- longer practice sessions

Mobile should be optimised for:

- voice practice
- reviewing evidence cards
- quick edits
- answering guided questions

---

# 20. Suggested MVP Screens

## Authentication

- sign in
- create account
- reset password

## Onboarding

- upload CV
- add experience manually
- review CV extraction

## Dashboard

- current progress
- suggested next action
- incomplete evidence
- recent practice

## Experience List

- experiences grouped by type
- evidence count for each experience

## Experience Detail

- responsibilities
- imported content
- evidence cards
- create evidence card

## Evidence Interview

- one question at a time
- progress indicator
- save and exit
- review answers

## Evidence Card Review

- structured fields
- source facts
- competency tags
- confirm or edit

## Evidence Bank

- searchable and filterable card list
- evidence gaps
- favourites

## Builder

- select output type
- choose evidence cards
- choose target role
- generate and edit content

## Job Target

- paste job description
- extracted skills
- evidence matches
- evidence gaps

## Practice Setup

- choose role
- choose competency
- choose evidence card
- choose text or voice

## Practice Session

- interview question
- answer input or recorder
- timer
- submit answer

## Feedback

- strengths
- improvements
- structure breakdown
- evidence comparison
- retry button

## Attempt Comparison

- side-by-side attempts
- score changes
- transcript comparison

---

# 21. Suggested Technical Architecture

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- accessible component primitives - use shadcn/ui
- React Hook Form
- Zod validation

## Backend

- Next.js API routes
- Supabase
- structured object storage for CV and audio files
- background document parsing where required

## Authentication

- email and password
- optional OAuth after MVP

## AI

Use structured outputs for:

- CV extraction
- evidence card generation
- competency tagging
- job description extraction
- answer generation
- practice feedback

Every AI-generated object should be validated against a schema before being stored.

## Voice

The MVP requires:

- browser recording
- audio upload
- speech-to-text transcription
- transcript review before analysis

---

# 22. Suggested AI Workflows

## CV Extraction

```text
CV file
    ↓
Text extraction
    ↓
Structured CV parsing
    ↓
Schema validation
    ↓
User review
    ↓
Confirmed experience entries
```

## Evidence Creation

```text
Experience entry
    ↓
Suggested evidence topic
    ↓
Adaptive questions
    ↓
User answers
    ↓
Draft evidence card
    ↓
User confirmation
```

## CV Generation

```text
Confirmed evidence cards
    +
Target role or job description
    ↓
Relevant evidence selection
    ↓
Generated CV content
    ↓
User edit and save
```

## Practice Feedback

```text
Interview question
    +
Evidence card
    +
User response
    ↓
Response analysis
    ↓
Evidence comparison
    ↓
Structured feedback
    ↓
Retry
```

---

# 23. MVP Success Metrics

## Activation

- percentage of users who create at least one experience
- percentage of users who confirm at least one evidence card
- average time to first confirmed evidence card

## Core usage

- evidence cards created per user
- generated CV outputs per user
- practice attempts per user
- percentage of users who retry an interview answer

## Product value

- percentage of users who save generated content
- percentage of generated content edited rather than discarded
- improvement between first and second practice attempts
- number of competencies covered per user

## Retention

- users returning within seven days
- users returning to practise before an interview
- users adding evidence for more than one experience

## Qualitative validation

Ask users:

- Did the app uncover experience you had not considered useful?
- Did the generated wording still feel accurate?
- Did the practice feedback help improve your answer?
- Did you feel more prepared after using the app?
- Did any output exaggerate or misrepresent your experience?

---

# 24. MVP Release Criteria

The MVP is ready for initial testing when users can complete the following full journey:

1. Create an account.
2. Upload a CV or add an experience.
3. Review imported information.
4. Create and confirm an evidence card.
5. Generate a CV bullet from the card.
6. Generate an interview answer.
7. Complete a text or voice practice attempt.
8. Receive evidence-based feedback.
9. Retry the same question.
10. Compare both attempts.
11. Delete their uploaded CV and practice audio.

---

# 25. Post-MVP Features

Potential later additions include:

- full CV document editor
- multiple CV versions
- cover-letter builder
- recruiter-style interview mode
- timed mock interviews
- industry-specific question packs
- interview scheduling integrations
- calendar reminders
- confidence tracking
- role-specific competency frameworks
- collaborative review with mentors
- shareable evidence packs
- browser extension for job descriptions
- job-board imports
- mobile application
- offline voice practice
- human coaching marketplace
- employer research
- salary negotiation practice
- application tracking

These should not delay the initial evidence-to-practice workflow.

---

# 26. MVP Product Principles

## Evidence before generation

The application should understand what the user has done before rewriting it.

## User confirmation before reuse

Generated evidence remains a draft until the user confirms it.

## Action over context

Interview guidance should prioritise what the user personally did.

## Improvement over replacement

Practice feedback should teach the user how to answer better rather than simply replacing their answer.

## Credibility over exaggeration

A modest but defensible example is more useful than an impressive fabricated claim.

## One evidence bank, multiple uses

The same evidence should support CVs, applications, and interviews.

---

# 27. Core MVP Statement

> Evidence Coach helps job seekers uncover useful examples from their real experience, turn them into stronger CV and interview content, and practise explaining them with structured feedback.

The MVP succeeds when a user can begin with a vague statement such as:

> “I worked in a warehouse and helped new starters.”

And finish with:

- a confirmed evidence card
- a credible CV bullet
- a structured interview answer
- a completed practice attempt
- specific feedback
- an improved second answer

You should design monetisation into the data model now, even if the initial launch is free.

The cleanest model is **freemium subscription with monthly AI usage limits**. Do not charge separately for the three features because they work as one connected product.

# Recommended plans

## Free — £0

Enough to experience the full workflow, but not enough to use indefinitely for every application.

- 2 experience entries
- 5 confirmed evidence cards
- 1 CV upload
- 5 generated CV or interview outputs per month
- 3 interview practice attempts per month
- text practice only
- 1 saved job target
- basic feedback
- access to STAR and 20/60/20 structures

The free plan should reach the product’s main success moment:

> Upload experience → create evidence → improve CV wording → practise an answer.

Do not restrict free users to a watered-down demo where they cannot complete that loop.

---

## Prepare — approximately £7.99 per month

For someone actively applying for jobs.

- unlimited experience entries
- up to 50 evidence cards
- 5 CV uploads or versions
- 50 generated outputs per month
- 30 interview practice attempts per month
- text and voice practice
- job-description matching
- answer-attempt comparisons
- detailed evidence-based feedback
- up to 10 saved job targets
- CV profile, bullet and application-answer generation

This should probably be the main subscription.

A job seeker may only need the application intensively for one to three months, so expecting long-term SaaS retention would be unrealistic. The product should be commercially viable even with short subscriptions.

---

## Intensive — approximately £14.99 per month

For users preparing for several roles or an imminent interview.

- unlimited evidence cards
- unlimited CV versions
- higher generation allowance
- around 100 practice attempts per month
- longer voice recordings
- full mock interview sessions
- role-specific question sets
- deeper practice history
- competency-gap analysis
- multiple job targets
- exportable preparation packs
- priority processing

“Unlimited AI” would be risky. You can present most stored content as unlimited while still applying a fair-use allowance to expensive generation, transcription and feedback operations.

---

# A useful fourth option: Interview Pass

A recurring subscription is not always the best fit for job seekers. Some users will arrive three days before an interview and leave afterwards.

Offer a one-time pass such as:

## Interview Pass — £9.99 for 14 days

- full evidence bank access
- one target role
- one job-description analysis
- 25 voice or text attempts
- one or two complete mock interviews
- detailed feedback
- interview preparation export

This may convert users who actively avoid subscriptions.

It can also act as an upgrade path:

> Need longer-term access? Apply the £9.99 pass value toward your first month of Prepare.

That avoids making the one-time product compete too aggressively with the subscription.

# Recommended launch structure

I would not launch with four visible choices. Begin with:

| Plan           |       Price | Purpose                         |
| -------------- | ----------: | ------------------------------- |
| Free           |          £0 | Try the full evidence workflow  |
| Prepare        | £7.99/month | Active job search               |
| Interview Pass |  £9.99 once | Immediate interview preparation |

Add the higher tier after usage data shows that people are reaching the Prepare limits.

Too many plans before you understand usage will create arbitrary restrictions and make the pricing page harder to understand.

# What should be limited

Limit the things that cause ongoing AI or infrastructure costs:

- CV parsing
- content generation
- job-description analysis
- voice transcription
- answer analysis
- mock interview questions
- detailed practice feedback

Do not heavily limit inexpensive stored product functionality:

- viewing existing experiences
- viewing evidence cards
- editing user content
- reviewing saved answers
- accessing previous feedback
- manually adding experience

A user should never lose access to their own evidence because they stopped paying.

Paid-only content could become read-only after downgrading, but it should remain visible and exportable.

# Suggested entitlement model

Avoid hard-coding plan checks throughout the UI.

```ts
export const PLAN_CONFIG = {
  free: {
    maxExperiences: 2,
    maxEvidenceCards: 5,
    maxCvImportsPerMonth: 1,
    maxJobTargets: 1,
    maxGenerationsPerMonth: 5,
    maxPracticeAttemptsPerMonth: 3,
    voicePractice: false,
    jobMatching: false,
    mockInterviews: false,
  },

  prepare: {
    maxExperiences: null,
    maxEvidenceCards: 50,
    maxCvImportsPerMonth: 5,
    maxJobTargets: 10,
    maxGenerationsPerMonth: 50,
    maxPracticeAttemptsPerMonth: 30,
    voicePractice: true,
    jobMatching: true,
    mockInterviews: false,
  },

  intensive: {
    maxExperiences: null,
    maxEvidenceCards: null,
    maxCvImportsPerMonth: 20,
    maxJobTargets: null,
    maxGenerationsPerMonth: 200,
    maxPracticeAttemptsPerMonth: 100,
    voicePractice: true,
    jobMatching: true,
    mockInterviews: true,
  },
} as const;
```

Use `null` to represent an unmetered product limit, but still maintain internal abuse and AI-cost safeguards.

You will also need a usage table rather than calculating usage from the number of saved records:

```ts
type UsageEvent = {
  id: string;
  userId: string;
  type:
    | "cv_import"
    | "content_generation"
    | "job_analysis"
    | "text_practice"
    | "voice_transcription"
    | "practice_feedback"
    | "mock_interview";
  units: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
};
```

This gives you flexibility to change limits without restructuring the core user data.

# Credit system versus simple limits

Internally, you may eventually model usage with credits because different operations have different costs.

For example:

| Action                         | Internal credits |
| ------------------------------ | ---------------: |
| Generate one CV bullet         |                1 |
| Generate one structured answer |                2 |
| Analyse a text response        |                2 |
| Transcribe and analyse voice   |                4 |
| Full mock interview            |               15 |

However, I would **not expose credits prominently in the initial product**. Job seekers do not want to calculate whether clicking “Improve answer” costs two tokens.

The interface should say:

> 18 practice attempts remaining this month

rather than:

> 72 AI credits remaining

Credits can remain an internal billing abstraction until the product contains enough different AI operations that simple limits become confusing.

# Where the paywalls should appear

The best upgrade points are moments where the user already understands the value.

## After completing the first evidence workflow

The user has successfully created several cards and tries to add another role:

> You have built five evidence examples. Upgrade to build a complete evidence bank across all your roles.

## When starting voice practice

> Text practice is included in Free. Upgrade to practise aloud and receive transcript-based feedback.

## After pasting a job description

Show a limited preview first:

> We identified seven relevant requirements and three matching evidence cards. Upgrade to see the full match and generate tailored content.

## After several practice attempts

> You have completed your three free attempts. Your latest answer improved in structure but still needs a clearer outcome.

This is stronger than blocking the user before they experience any benefit.

# Potential paid add-ons

These should come later, not in the MVP.

- additional interview-attempt packs
- one-off CV analysis
- premium role-specific question packs
- mentor or career-coach review
- downloadable branded preparation reports
- educational or employability-provider licences
- university and bootcamp accounts
- charity and Jobcentre partnerships

The business-to-business route may eventually be stronger than consumer subscriptions.

Potential buyers include:

- bootcamps
- universities
- employment charities
- training providers
- redundancy-support programmes
- recruitment agencies
- organisations running return-to-work schemes

They could pay per active learner, cohort or seat while users retain private individual evidence banks.

# Important ethical boundary

The audience may include unemployed people under financial pressure. Avoid monetisation patterns such as:

- hiding previously created evidence after cancellation
- countdown-based fake urgency
- claiming a higher score guarantees interview success
- charging to export the user’s own data
- deliberately poor free feedback
- automatically starting trials without clear consent
- describing AI output as recruiter-certified

A fair model is commercially stronger here because trust is part of the product.

# Recommended path

## Initial beta

Make the product free but still track usage as though plans already exist.

Collect:

- cards created per user
- generations per active user
- voice minutes
- repeat practice attempts
- job descriptions analysed
- which feature triggers repeat visits
- approximate AI cost per activated user

## Public launch

Introduce:

- Free
- Prepare at roughly £7.99/month
- Interview Pass at roughly £9.99 for 14 days

Give beta users either:

- several free months
- a permanent higher free allowance
- a discounted founder plan

Do not promise unlimited lifetime access unless the operational costs are close to zero.

## Later

Add Intensive only after users demonstrate that they need significantly more practice usage.

The likely commercial core is:

> **Free for occasional preparation, paid for an active job search, and a short one-time pass for urgent interviews.**
