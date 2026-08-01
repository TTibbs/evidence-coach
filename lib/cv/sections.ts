export type CvSectionKind =
  | "summary"
  | "skills"
  | "project"
  | "freelance"
  | "employment"
  | "education"
  | "certificate"
  | "education_and_certificate"
  | "volunteering";

type SectionRule = {
  kind: CvSectionKind;
  pattern: RegExp;
};

/**
 * Order matters: more specific headings before broader ones
 * (e.g. "education & certifications" before plain "education").
 */
const SECTION_RULES: SectionRule[] = [
  {
    kind: "summary",
    pattern:
      /^(professional\s+)?(summary|profile|about(\s+me)?|personal\s+statement|objective)s?$/i,
  },
  {
    kind: "skills",
    pattern:
      /^((technical|key|core|professional)\s+)?skills?(?:\s+(&|and)\s+\w+)?$|^(tech\s+stack|technologies|competencies|tools)$/i,
  },
  {
    kind: "project",
    pattern:
      /^((selected|personal|key|notable|side)\s+)?projects?(?:\s+(portfolio|experience))?$/i,
  },
  {
    kind: "freelance",
    pattern:
      /^(technical\s*[\/|]\s*)?(freelance|consulting|contractor)(\s+experience)?$|^(freelance|consulting)\s+(work|projects?|roles?)$/i,
  },
  {
    kind: "employment",
    pattern:
      /^((other|additional|relevant|professional|technical|work|employment)\s+)+(work\s+)?(experience|employment|history|roles?)?$|^(work\s+experience|employment(\s+history)?|career\s+history|professional\s+experience)$/i,
  },
  {
    kind: "education_and_certificate",
    pattern:
      /^education\s*(&|and)\s*(certifications?|certificates?|licen[cs]es?|credentials?)$/i,
  },
  {
    kind: "certificate",
    pattern:
      /^(certifications?|certificates?|licen[cs]es?|credentials?|accreditations?)(\s*(&|and)\s*\w+)?$/i,
  },
  {
    kind: "education",
    pattern:
      /^(education|academic(\s+background)?|qualifications?|degrees?|schooling)(\s*(&|and)\s*training)?$/i,
  },
  {
    kind: "volunteering",
    pattern:
      /^(volunteering|volunteer(\s+experience|\s+work)?|community(\s+work)?|charity(\s+work)?)$/i,
  },
];

function normalizeHeadingCandidate(line: string): string {
  return line
    .trim()
    // Strip common PDF artifacts / punctuation around headings
    .replace(/^[\d.\-•*]+\s*/, "")
    .replace(/[:：]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Classify a single line as a CV section heading, or null if not a heading. */
export function classifyCvSectionHeading(line: string): CvSectionKind | null {
  const normalized = normalizeHeadingCandidate(line);
  if (!normalized || normalized.length > 80) return null;

  // Headings are usually short Title Case / ALL CAPS lines without sentence punctuation.
  if (/[.!?]/.test(normalized) && normalized.split(/\s+/).length > 6) {
    return null;
  }

  for (const rule of SECTION_RULES) {
    if (rule.pattern.test(normalized)) return rule.kind;
  }

  return null;
}

/**
 * Insert `[SECTION:kind]` markers before detected headings so the model
 * gets explicit type hints without removing the original heading text.
 */
export function annotateCvSections(cvText: string): string {
  const lines = cvText.split(/\r?\n/);
  const out: string[] = [];

  for (const line of lines) {
    const kind = classifyCvSectionHeading(line);
    if (kind) {
      out.push(`[SECTION:${kind}]`);
    }
    out.push(line);
  }

  return out.join("\n");
}

/** True when an extracted experience title is actually a section heading. */
export function isCvSectionHeadingTitle(title: unknown): boolean {
  if (typeof title !== "string" || !title.trim()) return false;
  return classifyCvSectionHeading(title) !== null;
}

export function filterExperiencesDroppingSectionHeadings<
  T extends { title: string },
>(experiences: T[]): T[] {
  return experiences.filter((exp) => !isCvSectionHeadingTitle(exp.title));
}
