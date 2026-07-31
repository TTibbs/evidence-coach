export type PrepPackJobTarget = {
  id: string;
  title: string;
  company?: string | null;
  extracted_skills?: string[] | null;
  extracted_competencies?: string[] | null;
  match_summary?: {
    strong?: string[];
    partial?: string[];
    gaps?: string[];
  } | null;
};

export type PrepPackEvidenceCard = {
  id: string;
  title: string;
  summary?: string | null;
  outcome?: string | null;
  skills?: string[] | null;
  competencies?: string[] | null;
  confidence_status?: string | null;
};

export type PrepPackRequirement = {
  label: string;
  kind: "competency" | "skill" | "gap";
  coverage: "strong" | "partial" | "gap";
  evidence: PrepPackEvidenceCard[];
  prompt?: string;
  question: string;
};

export type InterviewPrepPack = {
  targetLabel: string;
  requirements: PrepPackRequirement[];
  bestEvidence: PrepPackEvidenceCard[];
  gaps: PrepPackRequirement[];
  likelyQuestions: string[];
};

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function display(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function unique(values: (string | null | undefined)[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (!value) continue;
    const label = display(value);
    if (!label) continue;
    const key = normalize(label);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(label);
  }

  return result;
}

function includesRequirement(card: PrepPackEvidenceCard, requirement: string) {
  const needle = normalize(requirement);
  const fields = [
    card.title,
    card.summary,
    card.outcome,
    ...(card.skills ?? []),
    ...(card.competencies ?? []),
  ];

  return fields.some((field) => field && normalize(field).includes(needle));
}

function coverageFor(
  requirement: string,
  matchSummary: PrepPackJobTarget["match_summary"],
  evidence: PrepPackEvidenceCard[],
): PrepPackRequirement["coverage"] {
  const strong = new Set((matchSummary?.strong ?? []).map(normalize));
  const partial = new Set((matchSummary?.partial ?? []).map(normalize));
  const gaps = new Set((matchSummary?.gaps ?? []).map(normalize));
  const key = normalize(requirement);

  if (gaps.has(key) || evidence.length === 0) return "gap";
  if (strong.has(key)) return "strong";
  if (partial.has(key)) return "partial";
  return evidence.length > 1 ? "strong" : "partial";
}

export function buildInterviewPrepPack(
  target: PrepPackJobTarget,
  cards: PrepPackEvidenceCard[],
): InterviewPrepPack {
  const confirmedCards = cards.filter(
    (card) => !card.confidence_status || card.confidence_status === "confirmed",
  );
  const gapLabels = unique(target.match_summary?.gaps ?? []);
  const competencyLabels = unique([
    ...(target.extracted_competencies ?? []),
    ...(target.match_summary?.strong ?? []),
    ...(target.match_summary?.partial ?? []),
  ]);
  const skillLabels = unique(target.extracted_skills ?? []);
  const requirementInputs = [
    ...competencyLabels.map((label) => ({ label, kind: "competency" as const })),
    ...skillLabels.map((label) => ({ label, kind: "skill" as const })),
    ...gapLabels.map((label) => ({ label, kind: "gap" as const })),
  ];
  const seenRequirements = new Set<string>();

  const requirements = requirementInputs
    .filter(({ label }) => {
      const key = normalize(label);
      if (seenRequirements.has(key)) return false;
      seenRequirements.add(key);
      return true;
    })
    .map(({ label, kind }) => {
      const evidence = confirmedCards
        .filter((card) => includesRequirement(card, label))
        .slice(0, 3);
      const coverage = coverageFor(label, target.match_summary, evidence);

      return {
        label,
        kind,
        coverage,
        evidence,
        prompt:
          coverage === "gap"
            ? `Add a confirmed example that proves ${label} for this role.`
            : undefined,
        question:
          coverage === "gap"
            ? `What real example could show ${label} for ${target.title}?`
            : `Tell me about a time you demonstrated ${label}.`,
      };
    });

  const bestEvidence = confirmedCards
    .filter((card) =>
      requirements.some((requirement) =>
        requirement.evidence.some((match) => match.id === card.id),
      ),
    )
    .slice(0, 6);
  const gaps = requirements.filter((requirement) => requirement.coverage === "gap");

  return {
    targetLabel: target.company ? `${target.title} at ${target.company}` : target.title,
    requirements,
    bestEvidence,
    gaps,
    likelyQuestions: requirements.map((requirement) => requirement.question).slice(0, 8),
  };
}
