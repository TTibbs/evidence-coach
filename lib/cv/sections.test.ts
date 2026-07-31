import { describe, expect, it } from "vitest";
import {
  annotateCvSections,
  classifyCvSectionHeading,
  isCvSectionHeadingTitle,
} from "@/lib/cv/sections";

describe("classifyCvSectionHeading", () => {
  it.each([
    ["Summary", "summary"],
    ["Professional Summary", "summary"],
    ["Profile", "summary"],
    ["About Me", "summary"],
    ["Technical Skills", "skills"],
    ["Skills", "skills"],
    ["Tech Stack", "skills"],
    ["Selected Projects", "project"],
    ["Projects", "project"],
    ["Personal Projects", "project"],
    ["Technical / Freelance Experience", "freelance"],
    ["Freelance Experience", "freelance"],
    ["Consulting", "freelance"],
    ["Work Experience", "employment"],
    ["Other Work Experience", "employment"],
    ["Additional Employment", "employment"],
    ["Employment History", "employment"],
    ["Education & Certifications", "education_and_certificate"],
    ["Education and Certificates", "education_and_certificate"],
    ["Education", "education"],
    ["Certifications", "certificate"],
    ["Licenses", "certificate"],
    ["Volunteering", "volunteering"],
    ["Volunteer Experience", "volunteering"],
  ] as const)("classifies %j as %j", (heading, kind) => {
    expect(classifyCvSectionHeading(heading)).toBe(kind);
  });

  it("returns null for non-heading lines", () => {
    expect(classifyCvSectionHeading("Warehouse Operative")).toBeNull();
    expect(classifyCvSectionHeading("Built a React dashboard for clients.")).toBeNull();
    expect(classifyCvSectionHeading("")).toBeNull();
  });

  it("tolerates trailing colons and extra whitespace", () => {
    expect(classifyCvSectionHeading("  Selected Projects:  ")).toBe("project");
    expect(classifyCvSectionHeading("Additional Employment:")).toBe("employment");
  });
});

describe("annotateCvSections", () => {
  it("inserts SECTION markers before known headings", () => {
    const text = [
      "Jane Doe",
      "Summary",
      "Engineer with 5 years experience.",
      "Technical Skills",
      "TypeScript, React",
      "Selected Projects",
      "Portfolio Site",
      "Technical / Freelance Experience",
      "Frontend Contractor",
      "Additional Employment",
      "Warehouse Operative",
      "Education & Certifications",
      "BSc Computer Science",
    ].join("\n");

    const annotated = annotateCvSections(text);

    expect(annotated).toContain("[SECTION:summary]\nSummary");
    expect(annotated).toContain("[SECTION:skills]\nTechnical Skills");
    expect(annotated).toContain("[SECTION:project]\nSelected Projects");
    expect(annotated).toContain(
      "[SECTION:freelance]\nTechnical / Freelance Experience",
    );
    expect(annotated).toContain("[SECTION:employment]\nAdditional Employment");
    expect(annotated).toContain(
      "[SECTION:education_and_certificate]\nEducation & Certifications",
    );
    expect(annotated).not.toContain("[SECTION:employment]\nWarehouse Operative");
  });
});

describe("isCvSectionHeadingTitle", () => {
  it("detects heading-as-title junk", () => {
    expect(isCvSectionHeadingTitle("Additional Employment")).toBe(true);
    expect(isCvSectionHeadingTitle("Selected Projects")).toBe(true);
    expect(isCvSectionHeadingTitle("Education & Certifications")).toBe(true);
  });

  it("allows real experience titles", () => {
    expect(isCvSectionHeadingTitle("Warehouse Operative")).toBe(false);
    expect(isCvSectionHeadingTitle("Frontend Developer")).toBe(false);
    expect(isCvSectionHeadingTitle("AWS Solutions Architect")).toBe(false);
  });
});
