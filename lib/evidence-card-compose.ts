type EvidenceMetric = {
  label?: string;
  value?: string;
  confirmed?: boolean;
  [key: string]: unknown;
};

export type EvidenceCardForCompose = {
  id: string;
  experience_id: string;
  title: string;
  summary?: string | null;
  situation?: string | null;
  task?: string | null;
  actions?: string[] | null;
  outcome?: string | null;
  reflection?: string | null;
  skills?: string[] | null;
  competencies?: string[] | null;
  metrics?: EvidenceMetric[] | null;
  source_facts?: string[] | null;
};

function clean(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function uniqueStrings(values: (string | null | undefined)[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const text = clean(value);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }

  return result;
}

function longest(values: (string | null | undefined)[]) {
  return uniqueStrings(values).sort((a, b) => b.length - a.length)[0] ?? "";
}

function unconfirmMetrics(metrics: EvidenceMetric[] | null | undefined) {
  return (metrics ?? []).map((metric) => ({ ...metric, confirmed: false }));
}

function uniqueMetrics(cards: EvidenceCardForCompose[]) {
  const seen = new Set<string>();
  const result: EvidenceMetric[] = [];

  for (const metric of cards.flatMap((card) => card.metrics ?? [])) {
    const key = `${clean(metric.label)}|${clean(metric.value)}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ ...metric, confirmed: false });
  }

  return result;
}

export function buildDuplicatedEvidenceDraft(card: EvidenceCardForCompose) {
  return {
    experience_id: card.experience_id,
    title: `${card.title} (copy)`,
    summary: card.summary ?? "",
    situation: card.situation ?? "",
    task: card.task ?? null,
    actions: card.actions ?? [],
    outcome: card.outcome ?? "",
    reflection: card.reflection ?? null,
    skills: card.skills ?? [],
    competencies: card.competencies ?? [],
    metrics: unconfirmMetrics(card.metrics),
    source_facts: card.source_facts ?? [],
    confidence_status: "draft" as const,
    is_favourite: false,
    archived_at: null,
  };
}

export function buildMergedEvidenceDraft(cards: EvidenceCardForCompose[]) {
  if (cards.length < 2) {
    throw new Error("Select at least two evidence cards to merge");
  }

  const experienceIds = new Set(cards.map((card) => card.experience_id));
  if (experienceIds.size !== 1) {
    throw new Error("Merge cards from the same source experience");
  }

  const titles = uniqueStrings(cards.map((card) => card.title));
  const summaries = uniqueStrings(cards.map((card) => card.summary));
  const reflections = uniqueStrings(cards.map((card) => card.reflection));

  return {
    experience_id: cards[0]!.experience_id,
    title:
      titles.length > 2
        ? `Merged draft: ${titles.slice(0, 2).join(" + ")} + ${titles.length - 2} more`
        : `Merged draft: ${titles.join(" + ")}`,
    summary: summaries.join(" "),
    situation: longest(cards.map((card) => card.situation)),
    task: longest(cards.map((card) => card.task)) || null,
    actions: uniqueStrings(cards.flatMap((card) => card.actions ?? [])),
    outcome: longest(cards.map((card) => card.outcome)),
    reflection: reflections.length > 0 ? reflections.join(" ") : null,
    skills: uniqueStrings(cards.flatMap((card) => card.skills ?? [])),
    competencies: uniqueStrings(cards.flatMap((card) => card.competencies ?? [])),
    metrics: uniqueMetrics(cards),
    source_facts: uniqueStrings(cards.flatMap((card) => card.source_facts ?? [])),
    confidence_status: "draft" as const,
    is_favourite: false,
    archived_at: null,
  };
}
