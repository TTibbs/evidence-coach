import { z } from "zod";
import type { OfficialListingSearchResult } from "@/lib/job-listing-search";

export const jobTrustCheckInputSchema = z.object({
  title: z.string().trim().min(1),
  company: z.string().trim().optional().nullable(),
  location: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
});

export type JobTrustCheckInput = z.infer<typeof jobTrustCheckInputSchema>;

export type JobTrustSignal = {
  id: string;
  label: string;
  status: "positive" | "neutral" | "warning" | "unknown";
  detail: string;
};

export type JobTrustCheckResult = {
  status: "good_signals" | "needs_review" | "unable_to_verify";
  score: number;
  summary: string;
  provider: "tavily" | "gemini" | "none";
  officialListing: {
    status: "found" | "likely_found" | "not_found" | "not_checked";
    url: string | null;
    label: string;
  };
  manualSearchUrl: string | null;
  signals: JobTrustSignal[];
};

export function assessJobTrust(
  input: JobTrustCheckInput,
  officialSearch?: OfficialListingSearchResult,
): JobTrustCheckResult {
  const normalized = jobTrustCheckInputSchema.parse(input);
  const signals: JobTrustSignal[] = [
    officialListingSignal(officialSearch),
    sourceSignal(normalized.sourceUrl),
    descriptionDepthSignal(normalized.description),
    companySignal(normalized.company),
  ];
  const score = scoreSignals(signals);
  const status =
    score >= 70
      ? "good_signals"
      : signals.some((signal) => signal.status === "warning")
        ? "needs_review"
        : "unable_to_verify";

  return {
    status,
    score,
    summary: summaryForStatus(status, officialSearch),
    provider: officialSearch?.provider ?? "none",
    officialListing: officialListingResult(officialSearch),
    manualSearchUrl: buildManualSearchUrl(normalized),
    signals,
  };
}

function officialListingSignal(
  officialSearch: OfficialListingSearchResult | undefined,
): JobTrustSignal {
  if (officialSearch?.status === "found" || officialSearch?.status === "likely_found") {
    return {
      id: "official-listing",
      label: "Official listing",
      status: "positive",
      detail: `Matched a likely official listing via ${officialSearch.provider}.`,
    };
  }

  if (officialSearch?.status === "not_found") {
    return {
      id: "official-listing",
      label: "Official listing",
      status: "warning",
      detail:
        "Search completed, but no strong company-site or ATS listing matched this role.",
    };
  }

  if (officialSearch?.status === "unable_to_verify") {
    return {
      id: "official-listing",
      label: "Official listing",
      status: "unknown",
      detail: "Official listing search could not run.",
    };
  }

  return {
    id: "official-listing",
    label: "Official listing",
    status: "unknown",
    detail:
      "Company-site matching needs a search provider before Evidence Coach can verify this automatically.",
  };
}

function sourceSignal(sourceUrl: string | null | undefined): JobTrustSignal {
  if (!sourceUrl) {
    return {
      id: "source",
      label: "Source",
      status: "unknown",
      detail: "No source URL was provided.",
    };
  }

  const hostname = safeHostname(sourceUrl);
  if (hostname.includes("linkedin.com")) {
    return {
      id: "source",
      label: "Source",
      status: "neutral",
      detail: "Captured from LinkedIn. Check whether the role also appears on an official careers page.",
    };
  }

  return {
    id: "source",
    label: "Source",
    status: "neutral",
    detail: `Captured from ${hostname}.`,
  };
}

function descriptionDepthSignal(description: string | null | undefined): JobTrustSignal {
  const text = description?.trim() ?? "";
  if (text.length < 250) {
    return {
      id: "description-depth",
      label: "Description depth",
      status: "warning",
      detail: "The job description is short, so there is less evidence to judge role quality.",
    };
  }

  const concreteSections = [
    /responsibilit/i,
    /requirements?/i,
    /qualifications?/i,
    /what you'?ll do/i,
    /the role/i,
  ].filter((pattern) => pattern.test(text)).length;

  if (concreteSections >= 2) {
    return {
      id: "description-depth",
      label: "Description depth",
      status: "positive",
      detail: "The post includes concrete role or requirement sections.",
    };
  }

  return {
    id: "description-depth",
    label: "Description depth",
    status: "neutral",
    detail: "The post has enough text, but few obvious structured role signals.",
  };
}

function companySignal(company: string | null | undefined): JobTrustSignal {
  if (company?.trim()) {
    return {
      id: "company",
      label: "Company",
      status: "positive",
      detail: `Company captured as ${company.trim()}.`,
    };
  }

  return {
    id: "company",
    label: "Company",
    status: "warning",
    detail: "No company name was captured, which makes official-source checks weaker.",
  };
}

function scoreSignals(signals: JobTrustSignal[]) {
  const raw = signals.reduce((total, signal) => {
    if (signal.status === "positive") return total + 25;
    if (signal.status === "neutral") return total + 12;
    if (signal.status === "unknown") return total + 6;
    return total;
  }, 0);

  return Math.min(100, raw);
}

function officialListingResult(
  officialSearch: OfficialListingSearchResult | undefined,
): JobTrustCheckResult["officialListing"] {
  const best = officialSearch?.candidates[0];
  if (officialSearch?.status === "found" || officialSearch?.status === "likely_found") {
    return {
      status: officialSearch.status,
      url: best?.url ?? null,
      label: best?.title ?? "Likely official listing",
    };
  }

  if (officialSearch?.status === "not_found") {
    return {
      status: "not_found",
      url: null,
      label: "No strong official listing match found.",
    };
  }

  return {
    status: "not_checked",
    url: null,
    label:
      officialSearch?.reason ?? "Official listing search is not connected yet.",
  };
}

function summaryForStatus(
  status: JobTrustCheckResult["status"],
  officialSearch: OfficialListingSearchResult | undefined,
) {
  if (officialSearch?.status === "found") {
    return "Found a strong official listing match. Prefer applying through the company or ATS page if it looks right.";
  }

  if (officialSearch?.status === "likely_found") {
    return "Found a plausible official listing match. Compare details before applying.";
  }

  if (officialSearch?.status === "not_found") {
    return "No strong official listing match was found. That does not prove the role is bad, but review it before investing time.";
  }

  if (status === "good_signals") {
    return "Some useful quality signals are present, but the official company listing still needs checking.";
  }

  if (status === "needs_review") {
    return "Review this role before investing time in a tailored application.";
  }

  return "Evidence Coach cannot verify the official listing yet.";
}

function buildManualSearchUrl(input: JobTrustCheckInput) {
  if (!input.company?.trim()) return null;

  const terms = [input.company, input.title, "careers jobs"]
    .filter(Boolean)
    .map((part) => `"${part}"`)
    .join(" ");
  const url = new URL("https://www.google.com/search");
  url.searchParams.set("q", terms);
  return url.toString();
}

function safeHostname(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "the captured page";
  }
}
