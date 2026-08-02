import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { getGeminiApiKey } from "@/lib/ai/config";

export type OfficialListingSearchInput = {
  title: string;
  company?: string | null;
  location?: string | null;
  description?: string | null;
  sourceUrl?: string | null;
};

export type OfficialListingCandidate = {
  title: string;
  url: string;
  snippet: string;
  provider: "tavily" | "gemini";
  providerScore?: number;
  matchScore: number;
  matchReasons: string[];
};

export type OfficialListingSearchResult = {
  status: "found" | "likely_found" | "not_found" | "unable_to_verify";
  provider: "tavily" | "gemini" | "none";
  reason: string;
  candidates: OfficialListingCandidate[];
};

type RawCandidate = {
  title: string;
  url: string;
  snippet: string;
  provider: "tavily" | "gemini";
  providerScore?: number;
};

type ProviderUnavailableReason =
  | "missing_key"
  | "quota"
  | "rate_limit"
  | "unauthorized"
  | "error";

type ProviderOutcome =
  | { status: "ok"; provider: "tavily" | "gemini"; candidates: RawCandidate[] }
  | {
      status: "unavailable";
      provider: "tavily" | "gemini";
      reason: ProviderUnavailableReason;
    };

type SearchDeps = {
  tavily?: (input: OfficialListingSearchInput) => Promise<ProviderOutcome>;
  gemini?: (input: OfficialListingSearchInput) => Promise<ProviderOutcome>;
};

const tavilyResponseSchema = z.object({
  results: z
    .array(
      z.object({
        title: z.string().optional().default(""),
        url: z.string().url(),
        content: z.string().optional().default(""),
        score: z.number().optional(),
      }),
    )
    .optional()
    .default([]),
});

const geminiCandidateSchema = z.object({
  candidates: z
    .array(
      z.object({
        title: z.string().min(1),
        url: z.string().url(),
        snippet: z.string().optional().default(""),
      }),
    )
    .default([]),
});

const ATS_HOSTS = [
  "greenhouse.io",
  "lever.co",
  "ashbyhq.com",
  "workdayjobs.com",
  "myworkdayjobs.com",
  "smartrecruiters.com",
  "teamtailor.com",
  "bamboohr.com",
  "jobs.ashbyhq.com",
  "boards.greenhouse.io",
];

export async function findOfficialJobListings(
  input: OfficialListingSearchInput,
  deps: SearchDeps = {},
): Promise<OfficialListingSearchResult> {
  const tavily = await (deps.tavily ?? searchWithTavily)(input);
  if (tavily.status === "ok") {
    return scoreProviderCandidates(input, tavily.provider, tavily.candidates);
  }

  const gemini = await (deps.gemini ?? searchWithGeminiGrounding)(input);
  if (gemini.status === "ok") {
    return scoreProviderCandidates(input, gemini.provider, gemini.candidates);
  }

  return {
    status: "unable_to_verify",
    provider: "none",
    reason: `Tavily unavailable (${tavily.reason}); Gemini unavailable (${gemini.reason}).`,
    candidates: [],
  };
}

export function scoreProviderCandidates(
  input: OfficialListingSearchInput,
  provider: "tavily" | "gemini",
  candidates: RawCandidate[],
): OfficialListingSearchResult {
  const scored = candidates
    .map((candidate) => scoreCandidate(input, candidate))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
  const best = scored[0];

  if (!best) {
    return {
      status: "not_found",
      provider,
      reason: "No plausible official listing candidates were returned.",
      candidates: [],
    };
  }

  if (best.matchScore >= 80) {
    return {
      status: "found",
      provider,
      reason: "A strong official listing candidate matched the captured role.",
      candidates: scored,
    };
  }

  if (best.matchScore >= 60) {
    return {
      status: "likely_found",
      provider,
      reason: "A plausible official listing candidate matched the captured role.",
      candidates: scored,
    };
  }

  return {
    status: "not_found",
    provider,
    reason: "Search completed, but the returned candidates did not match strongly enough.",
    candidates: scored,
  };
}

async function searchWithTavily(
  input: OfficialListingSearchInput,
): Promise<ProviderOutcome> {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) {
    return { status: "unavailable", provider: "tavily", reason: "missing_key" };
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: buildSearchQuery(input),
      search_depth: "basic",
      include_answer: false,
      include_raw_content: false,
      max_results: 8,
      exclude_domains: ["linkedin.com", "indeed.com", "glassdoor.com"],
    }),
  }).catch(() => null);

  if (!response) {
    return { status: "unavailable", provider: "tavily", reason: "error" };
  }

  if (response.status === 401 || response.status === 403) {
    return { status: "unavailable", provider: "tavily", reason: "unauthorized" };
  }

  if (response.status === 429 || response.status === 432) {
    return { status: "unavailable", provider: "tavily", reason: "quota" };
  }

  if (response.status === 433) {
    return { status: "unavailable", provider: "tavily", reason: "rate_limit" };
  }

  if (!response.ok) {
    return { status: "unavailable", provider: "tavily", reason: "error" };
  }

  const parsed = tavilyResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    return { status: "unavailable", provider: "tavily", reason: "error" };
  }

  return {
    status: "ok",
    provider: "tavily",
    candidates: parsed.data.results.map((result) => ({
      title: result.title,
      url: result.url,
      snippet: result.content,
      provider: "tavily" as const,
      providerScore: result.score,
    })),
  };
}

async function searchWithGeminiGrounding(
  input: OfficialListingSearchInput,
): Promise<ProviderOutcome> {
  const apiKey = getGeminiApiKey()?.trim();
  if (!apiKey) {
    return { status: "unavailable", provider: "gemini", reason: "missing_key" };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_SEARCH_MODEL ?? "gemini-2.5-flash-lite",
      contents: `Find the official company careers page or ATS listing for this job. Return only JSON with a candidates array. Require public URLs; do not include LinkedIn, Indeed, Glassdoor, or generic job-board mirrors.

Job title: ${input.title}
Company: ${input.company ?? "unknown"}
Location: ${input.location ?? "unknown"}
Source: ${input.sourceUrl ?? "unknown"}`,
      config: {
        temperature: 0,
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
      },
    });
    const raw = response.text?.trim();
    if (!raw) {
      return { status: "unavailable", provider: "gemini", reason: "error" };
    }

    const parsed = geminiCandidateSchema.safeParse(JSON.parse(stripJsonFences(raw)));
    if (!parsed.success) {
      return { status: "unavailable", provider: "gemini", reason: "error" };
    }

    return {
      status: "ok",
      provider: "gemini",
      candidates: parsed.data.candidates.map((candidate) => ({
        title: candidate.title,
        url: candidate.url,
        snippet: candidate.snippet,
        provider: "gemini" as const,
      })),
    };
  } catch (error) {
    const reason = providerUnavailableReason(error);
    return { status: "unavailable", provider: "gemini", reason };
  }
}

function scoreCandidate(
  input: OfficialListingSearchInput,
  candidate: RawCandidate,
): OfficialListingCandidate {
  const haystack = `${candidate.title} ${candidate.url} ${candidate.snippet}`;
  const reasons: string[] = [];
  let score = 0;

  const titleOverlap = tokenOverlap(input.title, `${candidate.title} ${candidate.snippet}`);
  score += Math.round(titleOverlap * 35);
  if (titleOverlap >= 0.7) reasons.push("title closely matches");
  else if (titleOverlap >= 0.45) reasons.push("title partly matches");

  const company = input.company?.trim();
  if (company && includesLoose(haystack, company)) {
    score += 20;
    reasons.push("company appears in result");
  }

  const hostname = safeHostname(candidate.url);
  if (ATS_HOSTS.some((host) => hostname.endsWith(host))) {
    score += 15;
    reasons.push("known ATS domain");
  }

  if (/(careers?|jobs?|greenhouse|lever|ashby|workday|smartrecruiters)/i.test(candidate.url)) {
    score += 10;
    reasons.push("careers-style URL");
  }

  const location = input.location?.trim();
  if (location && includesLoose(haystack, location)) {
    score += 10;
    reasons.push("location appears in result");
  }

  if (typeof candidate.providerScore === "number") {
    score += Math.round(Math.min(1, Math.max(0, candidate.providerScore)) * 10);
  }

  return {
    ...candidate,
    matchScore: Math.min(100, score),
    matchReasons: reasons,
  };
}

function buildSearchQuery(input: OfficialListingSearchInput) {
  return [
    input.company ? `"${input.company}"` : null,
    `"${input.title}"`,
    input.location ? `"${input.location}"` : null,
    "careers jobs official",
  ]
    .filter(Boolean)
    .join(" ");
}

function tokenOverlap(left: string, right: string) {
  const leftTokens = meaningfulTokens(left);
  const rightTokens = new Set(meaningfulTokens(right));
  if (leftTokens.length === 0) return 0;
  const matches = leftTokens.filter((token) => rightTokens.has(token)).length;
  return matches / leftTokens.length;
}

function meaningfulTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !["the", "and", "for", "with"].includes(token));
}

function includesLoose(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function safeHostname(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function providerUnavailableReason(error: unknown): ProviderUnavailableReason {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();
  if (lower.includes("quota") || lower.includes("resource_exhausted")) return "quota";
  if (lower.includes("429") || lower.includes("rate")) return "rate_limit";
  if (lower.includes("api key") || lower.includes("unauthorized")) return "unauthorized";
  return "error";
}
