import { assessJobTrust, jobTrustCheckInputSchema } from "@/lib/job-trust";
import { findOfficialJobListings } from "@/lib/job-listing-search";
import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = jobTrustCheckInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.message },
      { status: 400, headers: corsHeaders },
    );
  }

  const officialSearch = await findOfficialJobListings(parsed.data);
  return NextResponse.json(
    { check: assessJobTrust(parsed.data, officialSearch) },
    { headers: corsHeaders },
  );
}
