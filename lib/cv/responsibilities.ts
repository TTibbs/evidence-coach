/**
 * When a CV uses prose (not bullets) under a role, models often dump the
 * text into `description` and leave `responsibilities` empty. Promote and
 * lightly split so review UI has usable duty lines.
 */

function cleanLines(lines: string[]): string[] {
  return lines.map((line) => line.trim()).filter(Boolean);
}

/** Split prose into duty-sized chunks without inventing content. */
export function splitDutyProse(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Prefer existing line / bullet breaks
  const byLine = cleanLines(
    trimmed.split(/\r?\n/).map((line) => line.replace(/^[-•*]\s+/, "")),
  );
  if (byLine.length > 1) return byLine;

  const single = byLine[0] ?? trimmed;

  // Sentence boundaries (avoid splitting Oxford-comma lists like "A, B, and C")
  const bySentence = cleanLines(
    single.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ])/),
  );
  if (bySentence.length > 1) return bySentence;

  // Only split on clause joiners that clearly start a new duty (not list commas)
  if (
    single.length > 120 &&
    /,\s+and\s+(?:being|also|then|later)\b/i.test(single)
  ) {
    const byClause = cleanLines(
      single.split(/,\s+and\s+(?=being|also|then|later)\b/i),
    );
    if (byClause.length > 1) {
      return byClause.map((part, i) => {
        const body = part.trim().replace(/\.$/, "");
        if (i === 0) return body.endsWith(".") ? body : `${body}.`;
        const capped = body.charAt(0).toUpperCase() + body.slice(1);
        return capped.endsWith(".") ? capped : `${capped}.`;
      });
    }
  }

  return [single];
}

export function normalizeExperienceResponsibilities<
  T extends {
    description?: string | null;
    responsibilities?: string[] | null;
  },
>(experience: T): T {
  const existing = cleanLines(experience.responsibilities ?? []);
  if (existing.length > 0) {
    return { ...experience, responsibilities: existing };
  }

  const description = experience.description?.trim() ?? "";
  if (!description) {
    return { ...experience, responsibilities: [] };
  }

  const fromDescription = splitDutyProse(description);
  return {
    ...experience,
    // Avoid duplicating the same text in description + responsibilities.
    description: null,
    responsibilities: fromDescription,
  };
}

export function normalizeExtractedResponsibilities<
  T extends {
    description?: string | null;
    responsibilities?: string[] | null;
  },
>(experiences: T[]): T[] {
  return experiences.map(normalizeExperienceResponsibilities);
}
