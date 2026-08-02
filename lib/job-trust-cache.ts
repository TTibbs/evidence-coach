import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { JobTrustCheckInput, JobTrustCheckResult } from "@/lib/job-trust";

const DEFAULT_CACHE_TTL_MS = 1000 * 60 * 60 * 24;

export function jobTrustCacheKey(input: JobTrustCheckInput) {
  const normalized = {
    title: input.title.trim().toLowerCase(),
    company: input.company?.trim().toLowerCase() ?? "",
    location: input.location?.trim().toLowerCase() ?? "",
    sourceUrl: normalizeSourceUrl(input.sourceUrl),
    descriptionHash: createHash("sha256")
      .update(input.description?.trim().slice(0, 20000) ?? "")
      .digest("hex"),
  };

  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

export async function readCachedJobTrustCheck(cacheKey: string) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("job_trust_check_cache")
      .select("result, expires_at")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error || !data?.result) return null;
    return data.result as JobTrustCheckResult;
  } catch {
    return null;
  }
}

export async function writeCachedJobTrustCheck(
  cacheKey: string,
  input: JobTrustCheckInput,
  result: JobTrustCheckResult,
) {
  try {
    const supabase = createAdminClient();
    const expiresAt = new Date(Date.now() + cacheTtlMs()).toISOString();
    await supabase.from("job_trust_check_cache").upsert({
      cache_key: cacheKey,
      input,
      result,
      provider: result.provider,
      expires_at: expiresAt,
    });
  } catch {
    // Cache failures should never block the capture/save flow.
  }
}

function cacheTtlMs() {
  const raw = Number.parseInt(process.env.JOB_TRUST_CACHE_TTL_SECONDS ?? "", 10);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_CACHE_TTL_MS;
  return raw * 1000;
}

function normalizeSourceUrl(value: string | null | undefined) {
  if (!value) return "";
  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase();
    const linkedInJobId =
      hostname === "linkedin.com" &&
      (url.searchParams.get("currentJobId") ??
        url.pathname.match(/\/jobs\/view\/(\d+)/)?.[1]);

    if (linkedInJobId) {
      return `https://www.linkedin.com/jobs/view/${linkedInJobId}`;
    }

    url.hash = "";
    return url.toString().toLowerCase();
  } catch {
    return value.trim().toLowerCase();
  }
}
