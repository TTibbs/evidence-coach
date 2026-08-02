import { describe, expect, it } from "vitest";
import { jobTrustCacheKey } from "./job-trust-cache";

describe("jobTrustCacheKey", () => {
  it("normalizes LinkedIn tracking-heavy search URLs to the underlying job id", () => {
    const fromSearch = jobTrustCacheKey({
      title: "Full Stack Engineer",
      company: "Example Co",
      description: "Build product features.",
      sourceUrl:
        "https://www.linkedin.com/jobs/search-results/?currentJobId=123456789&eBP=tracking&refId=noisy",
    });
    const fromCanonical = jobTrustCacheKey({
      title: " Full Stack Engineer ",
      company: "example co",
      description: "Build product features.",
      sourceUrl: "https://www.linkedin.com/jobs/view/123456789/?trackingId=noisy",
    });

    expect(fromSearch).toBe(fromCanonical);
  });
});
