import { describe, expect, it } from "vitest";
import { assessJobTrust } from "./job-trust";

describe("assessJobTrust", () => {
  it("keeps official listing verification honest until search is connected", () => {
    const result = assessJobTrust({
      title: "Full Stack Engineer",
      company: "Example Co",
      description: "The Role\n\nResponsibilities\n\nBuild product features.\n\nRequirements\n\nTypeScript experience.",
      sourceUrl: "https://www.linkedin.com/jobs/view/123",
    });

    expect(result.officialListing.status).toBe("not_checked");
    expect(result.officialListing.url).toBeNull();
    expect(result.manualSearchUrl).toContain("google.com/search");
    expect(result.signals.some((signal) => signal.id === "official-listing")).toBe(true);
  });

  it("warns when a post lacks enough captured detail", () => {
    const result = assessJobTrust({
      title: "Developer",
      company: null,
      description: "Apply now.",
      sourceUrl: "https://www.linkedin.com/jobs/view/123",
    });

    expect(result.status).toBe("needs_review");
    expect(result.signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "description-depth", status: "warning" }),
        expect.objectContaining({ id: "company", status: "warning" }),
      ]),
    );
  });
});
