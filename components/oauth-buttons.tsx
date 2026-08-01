"use client";

import { useState } from "react";
import type { Provider } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const PROVIDER_LABELS: Partial<Record<Provider, string>> = {
  azure: "Microsoft",
  bitbucket: "Bitbucket",
  discord: "Discord",
  facebook: "Facebook",
  figma: "Figma",
  github: "GitHub",
  gitlab: "GitLab",
  google: "Google",
  kakao: "Kakao",
  keycloak: "Keycloak",
  linkedin_oidc: "LinkedIn",
  notion: "Notion",
  slack_oidc: "Slack",
  spotify: "Spotify",
  twitch: "Twitch",
  twitter: "X",
  workos: "WorkOS",
  zoom: "Zoom",
};

function configuredProviders() {
  const raw = process.env.NEXT_PUBLIC_AUTH_OAUTH_PROVIDERS ?? "google";
  return raw
    .split(",")
    .map((provider) => provider.trim().toLowerCase())
    .filter(Boolean) as Provider[];
}

type Props = {
  next?: string;
  mode: "signin" | "signup";
  onError?: (message: string) => void;
};

export function OAuthButtons({ next = "/dashboard", mode, onError }: Props) {
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const providers = configuredProviders();

  async function continueWithProvider(provider: Provider) {
    setLoadingProvider(provider);
    onError?.("");
    const supabase = createClient();
    const origin = window.location.origin;
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
      },
    });

    if (error) {
      setLoadingProvider(null);
      onError?.(error.message);
    }
  }

  if (providers.length === 0) return null;

  return (
    <div className="space-y-2">
      {providers.map((provider) => {
        const label = PROVIDER_LABELS[provider] ?? provider;
        return (
          <Button
            key={provider}
            type="button"
            variant="outline"
            className="w-full"
            disabled={loadingProvider != null}
            onClick={() => {
              void continueWithProvider(provider);
            }}
          >
            {loadingProvider === provider
              ? "Redirecting..."
              : `${mode === "signup" ? "Sign up" : "Continue"} with ${label}`}
          </Button>
        );
      })}
    </div>
  );
}
