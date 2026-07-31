import { createClient } from "@/lib/supabase/server";
import type { UsageEventType } from "@/types/domain";

export async function recordUsage(
  userId: string,
  type: UsageEventType,
  units = 1,
  metadata?: Record<string, unknown>,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("usage_events").insert({
    user_id: userId,
    type,
    units,
    metadata: metadata ?? null,
  });

  if (error) {
    console.error("Failed to record usage", error);
  }
}
