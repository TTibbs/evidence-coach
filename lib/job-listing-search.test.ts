import { describe, expect, it, vi } from "vitest";
import {
  findOfficialJobListings,
  scoreProviderCandidates,
} from "./job-listing-search";

const role = {
  title: "Full Stack Engineer",
  company: "Example Co",
  location: "London",
  sourceUrl: "https://www.linkedin.com/jobs/view/123",
};

describe("findOfficialJobListings", () => {
  it("uses Tavily candidates without calling Gemini", async () => {
    const gemini = vi.fn();

    const result = await findOfficialJobListings(role, {
      tavily: async () => ({
        status: "ok",
        provider: "tavily",
        candidates: [
          {
            title: "Full Stack Engineer - Example Co",
            url: "https://jobs.ashbyhq.com/example/full-stack-engineer",
            snippet: "Example Co is hiring a Full Stack Engineer in London.",
            provider: "tavily",
            providerScore: 0.9,
          },
        ],
      }),
      gemini,
    });

    expect(result.status).toBe("found");
    expect(result.provider).toBe("tavily");
    expect(gemini).not.toHaveBeenCalled();
  });

  it("can enrich top candidates with page text before scoring", async () => {
    const gemini = vi.fn();
    const extractCandidatePage = vi.fn(async () => ({
      title: "Full Stack Engineer - Example Co Careers",
      text: "Example Co is hiring a Full Stack Engineer in London. Requirements include TypeScript, React, and Node.js.",
    }));

    const result = await findOfficialJobListings(role, {
      tavily: async () => ({
        status: "ok",
        provider: "tavily",
        candidates: [
          {
            title: "Software role",
            url: "https://example.com/careers/software",
            snippet: "Engineering job opening.",
            provider: "tavily",
            providerScore: 0.5,
          },
        ],
      }),
      gemini,
      extractCandidatePage,
    });

    expect(result.status).toBe("found");
    expect(result.provider).toBe("tavily");
    expect(result.candidates[0]).toEqual(
      expect.objectContaining({
        pageExtracted: true,
        matchReasons: expect.arrayContaining([
          "candidate page checked",
          "company appears in result",
          "title closely matches",
        ]),
      }),
    );
    expect(extractCandidatePage).toHaveBeenCalledTimes(1);
    expect(gemini).not.toHaveBeenCalled();
  });

  it("does not call Gemini when Tavily returns weak candidates", async () => {
    const gemini = vi.fn();

    const result = await findOfficialJobListings(role, {
      tavily: async () => ({
        status: "ok",
        provider: "tavily",
        candidates: [
          {
            title: "General software jobs",
            url: "https://example-jobs-board.test/software",
            snippet: "Browse jobs from many companies.",
            provider: "tavily",
            providerScore: 0.2,
          },
        ],
      }),
      gemini,
    });

    expect(result.status).toBe("not_found");
    expect(result.provider).toBe("tavily");
    expect(gemini).not.toHaveBeenCalled();
  });

  it("falls back to Gemini when Tavily is quota exhausted", async () => {
    const result = await findOfficialJobListings(role, {
      tavily: async () => ({
        status: "unavailable",
        provider: "tavily",
        reason: "quota",
      }),
      gemini: async () => ({
        status: "ok",
        provider: "gemini",
        candidates: [
          {
            title: "Example Co Full Stack Engineer",
            url: "https://boards.greenhouse.io/example/jobs/123",
            snippet: "Full Stack Engineer role at Example Co in London.",
            provider: "gemini",
          },
        ],
      }),
    });

    expect(result.status).toBe("found");
    expect(result.provider).toBe("gemini");
  });

  it("returns unable when neither provider can run", async () => {
    const result = await findOfficialJobListings(role, {
      tavily: async () => ({
        status: "unavailable",
        provider: "tavily",
        reason: "missing_key",
      }),
      gemini: async () => ({
        status: "unavailable",
        provider: "gemini",
        reason: "missing_key",
      }),
    });

    expect(result.status).toBe("unable_to_verify");
    expect(result.provider).toBe("none");
  });
});

describe("scoreProviderCandidates", () => {
  it("marks plausible ATS matches as official listing candidates", () => {
    const result = scoreProviderCandidates(role, "tavily", [
      {
        title: "Full Stack Engineer - Example Co",
        url: "https://jobs.lever.co/example/full-stack-engineer",
        snippet: "Example Co is looking for a Full Stack Engineer in London.",
        provider: "tavily",
        providerScore: 0.85,
      },
    ]);

    expect(result.status).toBe("found");
    expect(result.candidates[0].matchReasons).toEqual(
      expect.arrayContaining(["known ATS domain", "title closely matches"]),
    );
  });
});
