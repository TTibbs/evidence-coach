import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

function loginErrorUrl(origin: string, message: string) {
  const url = new URL("/login", origin);
  url.searchParams.set("error", "oauth_callback");
  url.searchParams.set("message", message);
  return url;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const providerError = searchParams.get("error");
  const providerErrorDescription = searchParams.get("error_description");
  const next = safeNextPath(searchParams.get("next"));

  if (providerError) {
    const message = providerErrorDescription ?? providerError;
    console.error("OAuth provider returned an error", {
      providerError,
      providerErrorDescription,
    });
    return NextResponse.redirect(loginErrorUrl(origin, message));
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("OAuth code exchange failed", {
      message: error.message,
      status: error.status,
      code: error.code,
    });
    return NextResponse.redirect(loginErrorUrl(origin, error.message));
  }

  console.error("OAuth callback was called without a code or provider error");
  return NextResponse.redirect(
    loginErrorUrl(origin, "OAuth callback did not include an authorization code."),
  );
}
