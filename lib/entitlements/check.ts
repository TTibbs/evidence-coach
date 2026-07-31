import { createClient } from "@/lib/supabase/server";
import {
  getEffectivePlan,
  PLAN_CONFIG,
  type PlanConfig,
} from "@/lib/entitlements/plan-config";
import type { PlanId, UsageEventType } from "@/types/domain";

export class EntitlementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EntitlementError";
  }
}

/** Local/dev only — set DEV_BYPASS_ENTITLEMENTS=true to skip product limits. */
export function isDevEntitlementBypass() {
  return (
    process.env.DEV_BYPASS_ENTITLEMENTS === "true" ||
    process.env.DEV_BYPASS_ENTITLEMENTS === "1"
  );
}

function startOfMonthIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

async function getProfilePlan(userId: string): Promise<PlanId> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();

  if (data?.plan) {
    return getEffectivePlan(data.plan as PlanId);
  }

  // User may have signed up before the profiles table / trigger existed.
  const { data: ensured, error: ensureError } = await supabase.rpc(
    "ensure_profile",
  );

  if (!ensureError && ensured?.plan) {
    return getEffectivePlan(ensured.plan as PlanId);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profilePayload = {
    id: userId,
    email: user?.email ?? `${userId}@unknown.local`,
    name:
      (user?.user_metadata?.name as string | undefined) ??
      user?.email?.split("@")[0] ??
      null,
    plan: "free" as const,
  };

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" })
    .select("plan")
    .single();

  if (!insertError && created?.plan) {
    return getEffectivePlan(created.plan as PlanId);
  }

  // Bypass RLS for legacy accounts created before the insert policy existed.
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: adminCreated, error: adminError } = await admin
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" })
      .select("plan")
      .single();

    if (!adminError && adminCreated?.plan) {
      return getEffectivePlan(adminCreated.plan as PlanId);
    }
    console.error("Admin profile upsert failed", adminError?.message);
  } catch (adminErr) {
    console.error(
      "Admin profile upsert unavailable",
      adminErr instanceof Error ? adminErr.message : adminErr,
    );
  }

  const { data: retry } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();
  if (retry?.plan) {
    return getEffectivePlan(retry.plan as PlanId);
  }

  console.error("Could not load or create profile", {
    selectError: error?.message,
    ensureError: ensureError?.message,
    insertError: insertError?.message,
  });
  throw new EntitlementError("Could not load plan");
}

async function countUsage(
  userId: string,
  types: UsageEventType[],
  since?: string,
) {
  const supabase = await createClient();
  let query = supabase
    .from("usage_events")
    .select("units")
    .eq("user_id", userId)
    .in("type", types);

  if (since) {
    query = query.gte("created_at", since);
  }

  const { data, error } = await query;
  if (error) throw new EntitlementError("Could not load usage");
  return (data ?? []).reduce((sum, row) => sum + (row.units ?? 0), 0);
}

async function countRows(
  table: "experiences" | "evidence_cards" | "job_targets",
  userId: string,
  extra?: { column: string; value: string },
) {
  const supabase = await createClient();
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (extra) {
    query = query.eq(extra.column, extra.value);
  }

  const { count, error } = await query;
  if (error) throw new EntitlementError(`Could not count ${table}`);
  return count ?? 0;
}

export type MeteredAction =
  | "create_experience"
  | "confirm_evidence_card"
  | "cv_import"
  | "create_job_target"
  | "job_analysis"
  | "content_generation"
  | "text_practice"
  | "voice_transcription"
  | "tts"
  | "practice_feedback";

export async function assertWithinLimit(
  userId: string,
  action: MeteredAction,
): Promise<PlanConfig> {
  const plan = await getProfilePlan(userId);
  const config = PLAN_CONFIG[plan];
  if (isDevEntitlementBypass()) return config;
  const monthStart = startOfMonthIso();

  switch (action) {
    case "create_experience": {
      if (config.maxExperiences !== null) {
        const count = await countRows("experiences", userId);
        if (count >= config.maxExperiences) {
          throw new EntitlementError(
            `Experience limit reached (${config.maxExperiences}). Upgrade to add more.`,
          );
        }
      }
      break;
    }
    case "confirm_evidence_card": {
      if (config.maxEvidenceCards !== null) {
        const count = await countRows("evidence_cards", userId, {
          column: "confidence_status",
          value: "confirmed",
        });
        if (count >= config.maxEvidenceCards) {
          throw new EntitlementError(
            `Confirmed evidence card limit reached (${config.maxEvidenceCards}).`,
          );
        }
      }
      break;
    }
    case "cv_import": {
      const used = await countUsage(userId, ["cv_import"], monthStart);
      if (used >= config.maxCvImportsPerMonth) {
        throw new EntitlementError(
          `CV import limit reached this month (${config.maxCvImportsPerMonth}).`,
        );
      }
      break;
    }
    case "create_job_target": {
      if (config.maxJobTargets !== null) {
        const count = await countRows("job_targets", userId);
        if (count >= config.maxJobTargets) {
          throw new EntitlementError(
            `Job target limit reached (${config.maxJobTargets}).`,
          );
        }
      }
      break;
    }
    case "job_analysis": {
      if (!config.jobMatching) {
        throw new EntitlementError("Job matching is not available on your plan.");
      }
      break;
    }
    case "content_generation": {
      const used = await countUsage(userId, ["content_generation"], monthStart);
      if (used >= config.maxGenerationsPerMonth) {
        throw new EntitlementError(
          `Generation limit reached this month (${config.maxGenerationsPerMonth}).`,
        );
      }
      break;
    }
    case "text_practice":
    case "tts":
    case "practice_feedback": {
      const used = await countUsage(
        userId,
        ["text_practice", "voice_transcription", "tts", "practice_feedback"],
        monthStart,
      );
      if (used >= config.maxPracticeAttemptsPerMonth) {
        throw new EntitlementError(
          `Practice attempt limit reached this month (${config.maxPracticeAttemptsPerMonth}).`,
        );
      }
      break;
    }
    case "voice_transcription": {
      if (!config.voicePractice) {
        throw new EntitlementError("Voice practice is not available on your plan.");
      }
      const used = await countUsage(
        userId,
        ["text_practice", "voice_transcription", "tts", "practice_feedback"],
        monthStart,
      );
      if (used >= config.maxPracticeAttemptsPerMonth) {
        throw new EntitlementError(
          `Practice attempt limit reached this month (${config.maxPracticeAttemptsPerMonth}).`,
        );
      }
      break;
    }
  }

  return config;
}

export async function getUsageSummary(userId: string) {
  const plan = await getProfilePlan(userId);
  const config = PLAN_CONFIG[plan];
  if (isDevEntitlementBypass()) {
    return {
      plan,
      config,
      remaining: {
        generations: null,
        practiceAttempts: null,
        cvImports: null,
        experiences: null,
        evidenceCards: null,
        jobTargets: null,
      },
    };
  }
  const monthStart = startOfMonthIso();
  const [generations, practice, cvImports, experiences, cards, targets] =
    await Promise.all([
      countUsage(userId, ["content_generation"], monthStart),
      countUsage(
        userId,
        ["text_practice", "voice_transcription", "tts", "practice_feedback"],
        monthStart,
      ),
      countUsage(userId, ["cv_import"], monthStart),
      countRows("experiences", userId),
      countRows("evidence_cards", userId, {
        column: "confidence_status",
        value: "confirmed",
      }),
      countRows("job_targets", userId),
    ]);

  return {
    plan,
    config,
    remaining: {
      generations:
        config.maxGenerationsPerMonth === null
          ? null
          : Math.max(0, config.maxGenerationsPerMonth - generations),
      practiceAttempts:
        config.maxPracticeAttemptsPerMonth === null
          ? null
          : Math.max(0, config.maxPracticeAttemptsPerMonth - practice),
      cvImports:
        config.maxCvImportsPerMonth === null
          ? null
          : Math.max(0, config.maxCvImportsPerMonth - cvImports),
      experiences:
        config.maxExperiences === null
          ? null
          : Math.max(0, config.maxExperiences - experiences),
      evidenceCards:
        config.maxEvidenceCards === null
          ? null
          : Math.max(0, config.maxEvidenceCards - cards),
      jobTargets:
        config.maxJobTargets === null
          ? null
          : Math.max(0, config.maxJobTargets - targets),
    },
  };
}
