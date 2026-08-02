import { describe, expect, it, vi } from "vitest";
import { OPTIONS, POST } from "./route";

vi.mock("@/lib/job-trust-service", () => ({
  runJobTrustCheck: vi.fn(async () => ({
    status: "unable_to_verify",
    score: 55,
    summary: "Evidence Coach cannot verify the official listing yet.",
    provider: "none",
    cached: false,
    checkedAt: "2026-08-02T00:00:00.000Z",
    officialListing: {
      status: "not_checked",
      url: null,
      label: "Official listing search is not connected yet.",
    },
    manualSearchUrl:
      "https://www.google.com/search?q=%22Example+Co%22+%22Full+Stack+Engineer%22+%22careers+jobs%22",
    signals: [],
  })),
}));

describe("POST /api/job-trust-check", () => {
  it("returns a confidence check for extension job drafts", async () => {
    const response = await POST(
      new Request("http://localhost/api/job-trust-check", {
        method: "POST",
        headers: { "x-forwarded-for": "203.0.113.10" },
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
        cached: false,
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
