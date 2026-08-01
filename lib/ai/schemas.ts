import { z } from "zod";
import { normalizeCvDate } from "@/lib/cv/dates";

export const EXPERIENCE_TYPES = [
  "employment",
  "project",
  "freelance",
  "volunteering",
  "education",
  "certificate",
  "other",
] as const;

export const experienceTypeSchema = z.enum(EXPERIENCE_TYPES);

const EXPERIENCE_TYPE_ALIASES: Record<
  string,
  (typeof EXPERIENCE_TYPES)[number]
> = {
  employment: "employment",
  job: "employment",
  work: "employment",
  "work-experience": "employment",
  workexperience: "employment",
  work_experience: "employment",
  role: "employment",
  position: "employment",
  fulltime: "employment",
  "full-time": "employment",
  full_time: "employment",
  parttime: "employment",
  "part-time": "employment",
  part_time: "employment",
  permanent: "employment",
  internship: "employment",
  intern: "employment",
  apprentice: "employment",
  apprenticeship: "employment",
  placement: "employment",
  contract: "freelance",
  contractor: "freelance",
  freelance: "freelance",
  freelancing: "freelance",
  consulting: "freelance",
  consultant: "freelance",
  selfemployed: "freelance",
  "self-employed": "freelance",
  self_employed: "freelance",
  project: "project",
  personalproject: "project",
  "personal-project": "project",
  personal_project: "project",
  sideproject: "project",
  "side-project": "project",
  side_project: "project",
  volunteering: "volunteering",
  volunteer: "volunteering",
  charity: "volunteering",
  nonprofit: "volunteering",
  "non-profit": "volunteering",
  community: "volunteering",
  education: "education",
  school: "education",
  university: "education",
  college: "education",
  degree: "education",
  study: "education",
  studying: "education",
  academic: "education",
  course: "education",
  certificate: "certificate",
  certificates: "certificate",
  certification: "certificate",
  certifications: "certificate",
  cert: "certificate",
  certs: "certificate",
  licence: "certificate",
  license: "certificate",
  licences: "certificate",
  licenses: "certificate",
  credential: "certificate",
  credentials: "certificate",
  accreditation: "certificate",
  accreditations: "certificate",
  other: "other",
};

/** Map model free-text types onto the allowed enum; unknown → other. */
export function coerceExperienceType(
  value: unknown,
): (typeof EXPERIENCE_TYPES)[number] {
  if (typeof value !== "string" || !value.trim()) return "other";
  const raw = value.trim().toLowerCase();
  const normalized = raw.replace(/[&/+,]+/g, " ").replace(/[\s_]+/g, "-");
  const compact = normalized.replace(/-/g, "");

  const aliased =
    EXPERIENCE_TYPE_ALIASES[normalized] ??
    EXPERIENCE_TYPE_ALIASES[compact] ??
    EXPERIENCE_TYPE_ALIASES[raw];
  if (aliased) return aliased;

  // Section headers like "Certificates & Licenses" or "Professional Certifications"
  if (
    /certificat|licen[cs]e|credential|accredit/.test(raw) &&
    !/education|degree|university|college|school/.test(raw)
  ) {
    return "certificate";
  }

  return "other";
}

export const coercedExperienceTypeSchema = z.preprocess(
  coerceExperienceType,
  experienceTypeSchema,
);

export const coercedCvDateSchema = z.preprocess(
  (value) => normalizeCvDate(value),
  z.string().nullable().optional(),
);

export const extractedExperienceSchema = z.object({
  type: coercedExperienceTypeSchema,
  organisation: z.string().optional().nullable(),
  title: z.string(),
  location: z.string().optional().nullable(),
  startDate: coercedCvDateSchema,
  endDate: coercedCvDateSchema,
  isCurrent: z.boolean().default(false),
  description: z.string().optional().nullable(),
  responsibilities: z.array(z.string()).default([]),
});


export const cvExtractionSchema = z.object({
  name: z.string().optional().nullable(),
  experiences: z.array(extractedExperienceSchema),
  skills: z.array(z.string()).default([]),
  skillCategories: z
    .array(
      z.object({
        label: z.string(),
        skills: z.array(z.string()).default([]),
      }),
    )
    .optional(),
});

export const evidenceMetricSchema = z.object({
  label: z.string(),
  value: z.string(),
  confirmed: z.boolean().default(false),
});

/** Coerce model quirks: string | string[] | {text}[] → string[]. */
export function coerceStringArray(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (/[\n•]/.test(trimmed) || /^\s*[-*]\s+/m.test(trimmed)) {
      return trimmed
        .split(/\r?\n|(?<=\.)\s+(?=[A-Z])/)
        .map((line) => line.replace(/^[-•*]\s+/, "").trim())
        .filter(Boolean);
    }
    return [trimmed];
  }
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === "string") {
      const t = item.trim();
      return t ? [t] : [];
    }
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const text = o.text ?? o.action ?? o.description ?? o.value ?? o.fact;
      if (typeof text === "string" && text.trim()) return [text.trim()];
      if (typeof text === "number" || typeof text === "boolean") {
        return [String(text)];
      }
    }
    if (typeof item === "number" || typeof item === "boolean") {
      return [String(item)];
    }
    return [];
  });
}

export function coerceEvidenceMetrics(value: unknown): Array<{
  label: string;
  value: string;
  confirmed: boolean;
}> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const o = item as Record<string, unknown>;
    const label = o.label ?? o.name ?? o.metric ?? o.key;
    const rawValue = o.value ?? o.amount ?? o.number ?? o.figure;
    if (label == null || rawValue == null) return [];
    const labelText = String(label).trim();
    const valueText = String(rawValue).trim();
    if (!labelText || !valueText) return [];
    return [
      {
        label: labelText,
        value: valueText,
        confirmed: Boolean(o.confirmed ?? false),
      },
    ];
  });
}

function firstNonEmptyString(...candidates: unknown[]): string {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}

/** Skills/competencies often arrive as "a, b, c". */
function coerceTagList(value: unknown): string[] {
  const items = coerceStringArray(value);
  if (items.length === 1 && items[0].includes(",")) {
    return items[0]
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return items;
}

/** Normalize free-form Gemini/OpenAI evidence drafts before Zod. */
export function coerceEvidenceCardDraft(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const o = raw as Record<string, unknown>;

  let actions = coerceStringArray(o.actions ?? o.Actions);
  const sourceFacts = coerceStringArray(
    o.sourceFacts ?? o.source_facts ?? o.sources,
  );
  // Models sometimes put personal actions only in sourceFacts / a prose blob.
  if (actions.length === 0 && sourceFacts.length > 0) {
    actions = sourceFacts.slice(0, 5);
  }

  return {
    title: firstNonEmptyString(o.title, o.Title, o.name, "Evidence example"),
    summary: firstNonEmptyString(o.summary, o.overview, o.abstract),
    situation: firstNonEmptyString(o.situation, o.context, o.Situation),
    task:
      o.task === undefined && o.Task === undefined
        ? null
        : firstNonEmptyString(o.task, o.Task) || null,
    actions,
    outcome: firstNonEmptyString(o.outcome, o.result, o.Outcome, o.impact),
    reflection:
      o.reflection === undefined
        ? null
        : firstNonEmptyString(o.reflection) || null,
    skills: coerceTagList(o.skills),
    competencies: coerceTagList(o.competencies),
    metrics: coerceEvidenceMetrics(o.metrics),
    sourceFacts,
  };
}

export const evidenceCardDraftSchema = z.preprocess(
  coerceEvidenceCardDraft,
  z.object({
    title: z.string().min(1),
    summary: z.string(),
    situation: z.string(),
    task: z.string().optional().nullable(),
    actions: z.array(z.string()),
    outcome: z.string(),
    reflection: z.string().optional().nullable(),
    skills: z.array(z.string()).default([]),
    competencies: z.array(z.string()).default([]),
    metrics: z.array(evidenceMetricSchema).default([]),
    sourceFacts: z.array(z.string()).default([]),
  }),
);

export const interviewQuestionsSchema = z.object({
  topic: z.string(),
  questions: z.array(z.string()).min(3).max(8),
});

export const nextQuestionSchema = z.object({
  done: z.boolean(),
  nextQuestion: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
});

export const generatedContentSchema = z.object({
  content: z.string(),
  notes: z.string().optional().nullable(),
});

export const RESPONSIBILITY_IMPROVE_STYLES = [
  "polish",
  "professional",
  "confident",
  "concise",
  "action",
] as const;

export const responsibilityImproveStyleSchema = z.enum(
  RESPONSIBILITY_IMPROVE_STYLES,
);

export const RESPONSIBILITY_STYLE_LABELS: Record<
  (typeof RESPONSIBILITY_IMPROVE_STYLES)[number],
  string
> = {
  polish: "Keep the same — polish wording",
  professional: "More professional / formal",
  confident: "More confident / impact-focused",
  concise: "More concise",
  action: "Stronger action verbs",
};

export const improvedResponsibilitiesSchema = z.object({
  responsibilities: z.array(z.string()).default([]),
});

export const transcriptionSchema = z.object({
  transcript: z.string().min(1),
});

export const practiceQuestionSchema = z.object({
  question: z.string().min(1),
});

function normalizeJdAnalysis(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const record = value as Record<string, unknown>;
  const matchSummary =
    record.matchSummary ??
    record.match_summary ??
    (record.strong || record.partial || record.gaps
      ? {
          strong: record.strong,
          partial: record.partial,
          gaps: record.gaps,
        }
      : undefined);

  return {
    ...record,
    extractedSkills:
      record.extractedSkills ?? record.extracted_skills ?? record.skills,
    extractedCompetencies:
      record.extractedCompetencies ??
      record.extracted_competencies ??
      record.competencies,
    matchSummary,
  };
}

export const jdAnalysisSchema = z.preprocess(
  normalizeJdAnalysis,
  z.object({
    extractedSkills: z.array(z.string()),
    extractedCompetencies: z.array(z.string()),
    matchSummary: z.object({
      strong: z.array(z.string()),
      partial: z.array(z.string()),
      gaps: z.array(z.string()),
    }),
  }),
);

export const practiceScoresSchema = z.object({
  relevance: z.number().min(0).max(100),
  ownership: z.number().min(0).max(100),
  specificity: z.number().min(0).max(100),
  structure: z.number().min(0).max(100),
  evidence: z.number().min(0).max(100),
  outcome: z.number().min(0).max(100),
  conciseness: z.number().min(0).max(100),
  delivery: z.number().min(0).max(100).optional().nullable(),
});

export const practiceFeedbackSchema = z.object({
  scores: practiceScoresSchema,
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  tryAgain: z.array(z.string()),
  evidenceComparison: z.object({
    used: z.array(z.string()),
    missed: z.array(z.string()),
  }),
  structureBreakdown: z
    .object({
      contextPercentage: z.number(),
      actionPercentage: z.number(),
      outcomePercentage: z.number(),
    })
    .optional()
    .nullable(),
  summary: z.string(),
});
