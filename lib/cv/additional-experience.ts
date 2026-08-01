import { normalizeCvDate } from "@/lib/cv/dates";

type ExtractedExperienceLike = {
  type: string;
  title: string;
  organisation?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
  description?: string | null;
  responsibilities?: string[] | null;
};

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function candidateText(experience: ExtractedExperienceLike) {
  return cleanText(
    [
      experience.description,
      ...(experience.responsibilities ?? []),
    ]
      .filter((value): value is string => Boolean(value?.trim()))
      .join("; "),
  );
}

function parseRoleSegment(segment: string) {
  const match = cleanText(segment).match(
    /^(.+?),\s+(.+?)\s+\(([^()]+?)\s+-\s+([^()]+?)\)$/i,
  );
  if (!match) return null;

  const [, title, organisation, startRaw, endRaw] = match;
  const endLabel = cleanText(endRaw);
  const isCurrent = /^(present|current|now)$/i.test(endLabel);

  return {
    title: cleanText(title),
    organisation: cleanText(organisation),
    startDate: normalizeCvDate(startRaw),
    endDate: isCurrent ? null : normalizeCvDate(endRaw),
    isCurrent,
  };
}

/**
 * CVs often compress earlier roles into one "Additional Experience" sentence.
 * Split clear semicolon-delimited role fragments so users can review each role
 * separately instead of fixing one muddy catch-all entry.
 */
export function expandCompressedAdditionalExperienceEntries<
  T extends ExtractedExperienceLike,
>(experiences: T[]): T[] {
  return experiences.flatMap((experience) => {
    const text = candidateText(experience);
    if (!text.includes(";")) return [experience];

    const segments = text
      .split(";")
      .map(cleanText)
      .filter(Boolean);
    const parsedRoles = segments.map(parseRoleSegment);

    if (parsedRoles.filter(Boolean).length < 2) return [experience];

    const expanded = parsedRoles.flatMap((role, index) => {
      if (role) {
        return [
          {
            ...experience,
            type: "employment",
            title: role.title,
            organisation: role.organisation,
            startDate: role.startDate,
            endDate: role.endDate,
            isCurrent: role.isCurrent,
            description: null,
            responsibilities: [],
          } as T,
        ];
      }

      const segment = segments[index];
      if (!segment || !/^earlier roles?\b/i.test(segment)) return [];

      return [
        {
          ...experience,
          type: "employment",
          title: "Earlier roles",
          organisation: null,
          startDate: null,
          endDate: null,
          isCurrent: false,
          description: null,
          responsibilities: [segment],
        } as T,
      ];
    });

    return expanded.length > 0 ? expanded : [experience];
  });
}
