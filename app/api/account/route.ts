import { requireUser, jsonError } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const EXPORT_TABLES = [
  "profiles",
  "experiences",
  "evidence_cards",
  "evidence_interviews",
  "job_targets",
  "generated_content",
  "practice_sessions",
  "practice_attempts",
  "cv_imports",
  "usage_events",
  "ai_usage_events",
] as const;

export async function GET() {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const exported: Record<string, unknown[] | null> = {};
  for (const table of EXPORT_TABLES) {
    const query = supabase.from(table).select("*");
    const scoped =
      table === "profiles"
        ? query.eq("id", user!.id)
        : query.eq("user_id", user!.id);
    const { data, error } = await scoped.order("created_at", { ascending: true });
    if (error) return jsonError(error.message, 500);
    exported[table] = data;
  }

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    user: {
      id: user!.id,
      email: user!.email ?? null,
    },
    data: exported,
    files: {
      included: false,
      note: "Stored CV files and practice audio are not embedded in this JSON export.",
    },
  });
}

async function listStoragePaths(
  storage: ReturnType<typeof createAdminClient>["storage"],
  bucket: "cvs" | "practice-audio",
  prefix: string,
): Promise<string[]> {
  const { data, error } = await storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw new Error(error.message);

  const paths: string[] = [];
  for (const item of data ?? []) {
    const path = `${prefix}/${item.name}`;
    if (item.id === null) {
      paths.push(...(await listStoragePaths(storage, bucket, path)));
    } else {
      paths.push(path);
    }
  }
  return paths;
}

async function deleteUserStorage(admin: ReturnType<typeof createAdminClient>, userId: string) {
  for (const bucket of ["cvs", "practice-audio"] as const) {
    const paths = await listStoragePaths(admin.storage, bucket, userId);
    for (let index = 0; index < paths.length; index += 100) {
      const chunk = paths.slice(index, index + 100);
      const { error } = await admin.storage.from(bucket).remove(chunk);
      if (error) throw new Error(error.message);
    }
  }
}

export async function DELETE() {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const admin = createAdminClient();
    await deleteUserStorage(admin, user!.id);
    const { error } = await admin.auth.admin.deleteUser(user!.id);
    if (error) return jsonError(error.message, 500);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return jsonError(message, 500);
  }
}
