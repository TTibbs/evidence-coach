export type CvSkillCategory = {
  label: string;
  skills: string[];
};

const SKILL_SECTION_MARKER = "[SECTION:skills]";
const SECTION_MARKER_PATTERN = /^\[SECTION:[^\]]+\]\s*$/;

function cleanLine(line: string) {
  return line
    .replace(/^[-•*]\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSkills(value: string) {
  return value
    .split(/[,;|/]| {2,}/)
    .map((part) => cleanLine(part))
    .filter(Boolean);
}

function titleCaseFallback(value: string) {
  return value
    .replace(/[:\-–—]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractSkillCategoriesFromAnnotatedCv(
  annotatedCvText: string,
): CvSkillCategory[] {
  const lines = annotatedCvText.split(/\r?\n/);
  const categories: CvSkillCategory[] = [];
  let inSkills = false;
  let pendingHeading = "";

  for (const rawLine of lines) {
    const line = cleanLine(rawLine);
    if (!line) continue;

    if (line === SKILL_SECTION_MARKER) {
      inSkills = true;
      pendingHeading = "";
      continue;
    }

    if (SECTION_MARKER_PATTERN.test(line)) {
      inSkills = false;
      pendingHeading = "";
      continue;
    }

    if (!inSkills) continue;

    const colonMatch = line.match(/^([^:]{2,50}):\s*(.+)$/);
    if (colonMatch) {
      const label = titleCaseFallback(colonMatch[1] ?? "");
      const skills = splitSkills(colonMatch[2] ?? "");
      if (label && skills.length > 0) categories.push({ label, skills });
      pendingHeading = "";
      continue;
    }

    const looksLikeHeading =
      line.length <= 50 &&
      !/[,.]/.test(line) &&
      !/\b(and|with|using)\b/i.test(line) &&
      splitSkills(line).length <= 2;

    if (looksLikeHeading) {
      pendingHeading = titleCaseFallback(line);
      continue;
    }

    const skills = splitSkills(line);
    if (skills.length > 0) {
      categories.push({
        label: pendingHeading || "Skills",
        skills,
      });
      pendingHeading = "";
    }
  }

  const merged = new Map<string, CvSkillCategory>();
  for (const category of categories) {
    const key = category.label.toLowerCase();
    const existing = merged.get(key) ?? { label: category.label, skills: [] };
    const seen = new Set(existing.skills.map((skill) => skill.toLowerCase()));
    for (const skill of category.skills) {
      const skillKey = skill.toLowerCase();
      if (!seen.has(skillKey)) {
        existing.skills.push(skill);
        seen.add(skillKey);
      }
    }
    merged.set(key, existing);
  }

  return [...merged.values()].filter((category) => category.skills.length > 0);
}
