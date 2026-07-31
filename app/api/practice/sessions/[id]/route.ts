import { requireUser, jsonError } from "@/lib/api/auth";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const { data, error } = await supabase
    .from("practice_sessions")
    .select("*, practice_attempts(*), evidence_cards(*)")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (error) return jsonError(error.message, 404);

  const attempts = [...(data.practice_attempts ?? [])].sort(
    (a: { attempt_number: number }, b: { attempt_number: number }) =>
      a.attempt_number - b.attempt_number,
  );

  return NextResponse.json({
    session: { ...data, practice_attempts: attempts },
  });
}
