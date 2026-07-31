import { requireUser, jsonError } from "@/lib/api/auth";
import { getUsageSummary } from "@/lib/entitlements/check";
import { NextResponse } from "next/server";

export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const summary = await getUsageSummary(user!.id);
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return jsonError(message, 500);
  }
}
