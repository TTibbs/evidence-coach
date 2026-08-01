import { requireUser, jsonError } from "@/lib/api/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return jsonError("Missing id");

  const { data, error } = await supabase
    .from("evidence_cards")
    .select("*, experiences(title, organisation, description, responsibilities)")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (error) return jsonError(error.message, 404);
  return NextResponse.json({ card: data });
}
