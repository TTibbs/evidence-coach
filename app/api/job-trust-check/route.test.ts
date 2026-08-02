import { describe, expect, it, vi } from "vitest";
import { OPTIONS, POST } from "./route";

vi.mock("@/lib/job-listing-search", () => ({
  findOfficialJobListings: vi.fn(async () => ({
    status: "unable_to_verify",
    provider: "none",
    reason: "Providers unavailable in route test.",
    candidates: [],
  })),
}));

describe("POST /api/job-trust-check", () => {
  it("returns a confidence check for extension job drafts", async () => {
    const response = await POST(
      new Request("http://localhost/api/job-trust-check", {
        method: "POST",
        body: JSON.stringify({
          title: "Full Stack Engineer",
          company: "Example Co",
          description:
            "The Role\n\nResponsibilities\n\nBuild product features.\n\nRequirements\n\nTypeScript experience.",
          sourceUrl: "https://www.linkedin.com/jobs/view/123",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    await expect(response.json()).resolves.toEqual({
      check: expect.objectContaining({
        officialListing: expect.objectContaining({ status: "not_checked" }),
        provider: "none",
        manualSearchUrl: expect.stringContaining("google.com/search"),
      }),
    });
  });

  it("allows extension preflight requests", async () => {
    const response = await OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
  });
});
