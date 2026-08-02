import { jobTrustCheckInputSchema } from "@/lib/job-trust";
import { checkJobTrustRateLimit } from "@/lib/job-trust-rate-limit";
import { runJobTrustCheck } from "@/lib/job-trust-service";
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
  const rateLimit = checkJobTrustRateLimit(rateLimitKey(request));
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many job confidence checks. Please try again shortly." },
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Retry-After": Math.max(
            1,
            Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
          ).toString(),
        },
      },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = jobTrustCheckInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.message },
      { status: 400, headers: corsHeaders },
    );
  }

  return NextResponse.json(
    { check: await runJobTrustCheck(parsed.data) },
    { headers: corsHeaders },
  );
}

function rateLimitKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0];
  return (
    forwardedFor?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "anonymous"
  );
}
