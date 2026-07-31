import { requireUser, jsonError } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function DELETE() {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user!.id);
    if (error) return jsonError(error.message, 500);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return jsonError(message, 500);
  }
}
