import { describe, expect, it } from "vitest";
import { extractSkillCategoriesFromAnnotatedCv } from "@/lib/cv/skill-categories";

describe("extractSkillCategoriesFromAnnotatedCv", () => {
  it("preserves labelled skill groups from skills sections", () => {
    expect(
      extractSkillCategoriesFromAnnotatedCv(`
[SECTION:skills]
Technical Skills
Languages: TypeScript, SQL, Python
Tools: Supabase; Figma; Jira
[SECTION:employment]
Developer
`),
    ).toEqual([
      { label: "Languages", skills: ["TypeScript", "SQL", "Python"] },
      { label: "Tools", skills: ["Supabase", "Figma", "Jira"] },
    ]);
  });

  it("uses a preceding heading for unlabelled skill rows", () => {
    expect(
      extractSkillCategoriesFromAnnotatedCv(`
[SECTION:skills]
Platforms
Salesforce, HubSpot
`),
    ).toEqual([{ label: "Platforms", skills: ["Salesforce", "HubSpot"] }]);
  });
});
