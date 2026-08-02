import { describe, expect, it } from "vitest";
import { cleanLinkedInJobText } from "./linkedin-cleanup";

describe("cleanLinkedInJobText", () => {
  it("removes a single leading LinkedIn artifact line", () => {
    const cleaned = cleanLinkedInJobText(`\u200bb\u00a0

Full Stack Engineer | Remote - UK

Full Stack Engineer | TypeScript, React, Node.js
Remote-first (UK)

The Role

Build product features.

Full Stack Engineer | Remote - UK`);

    expect(cleaned.startsWith("b\n")).toBe(false);
    expect(cleaned).toBe(`Full Stack Engineer | Remote - UK

Full Stack Engineer | TypeScript, React, Node.js
Remote-first (UK)

The Role

Build product features.`);
  });

  it("keeps only the job body and removes LinkedIn applicant analytics", () => {
    const cleaned = cleanLinkedInJobText(`About the job

About Medly AI

We're the fastest growing EdTech startup in London.

Requirements added by the job poster

• Bachelor's Degree

See how you compare to other applicants
Based on LinkedIn data.

Applicants for this job

681`);

    expect(cleaned).toBe(`About Medly AI

We're the fastest growing EdTech startup in London.

Requirements added by the job poster

• Bachelor's Degree`);
  });

  it("does not remove normal short heading lines after the start", () => {
    const cleaned = cleanLinkedInJobText(`The Role

Build AI products.

AI

Ship carefully.`);

    expect(cleaned).toContain("AI");
  });
});
