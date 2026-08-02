import {
  readCachedJobTrustCheck,
  jobTrustCacheKey,
  writeCachedJobTrustCheck,
} from "@/lib/job-trust-cache";
import { findOfficialJobListings } from "@/lib/job-listing-search";
import {
  assessJobTrust,
  jobTrustCheckInputSchema,
  type JobTrustCheckInput,
  type JobTrustCheckResult,
} from "@/lib/job-trust";

export async function runJobTrustCheck(
  input: JobTrustCheckInput,
): Promise<JobTrustCheckResult> {
  const parsed = jobTrustCheckInputSchema.parse(input);
  const cacheKey = jobTrustCacheKey(parsed);
  const cached = await readCachedJobTrustCheck(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  const officialSearch = await findOfficialJobListings(parsed);
  const result = assessJobTrust(parsed, officialSearch);
  await writeCachedJobTrustCheck(cacheKey, parsed, result);
  return result;
}
