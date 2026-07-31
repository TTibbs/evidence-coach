"use client";

import { AI_PROVIDER_CONFIG, type AiProviderName } from "@/lib/ai/config";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PROVIDERS = Object.keys(AI_PROVIDER_CONFIG) as AiProviderName[];

export function AiDisclosure({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-sm text-stone-600">
        AI assistance during the MVP is provided using Google Gemini. Submitted CV
        text, evidence answers, and practice responses may be processed by Google to
        generate results. Avoid entering information you do not want processed by the
        configured AI provider. Free-tier Gemini content may be used by Google to
        improve its products.
      </p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI assistance</CardTitle>
        <CardDescription>
          AI assistance during the MVP is provided using Google Gemini. Submitted CV
          text, evidence answers, and practice responses may be processed by Google to
          generate results. Avoid entering information you do not want processed by the
          configured AI provider.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {PROVIDERS.map((provider) => {
          const meta = AI_PROVIDER_CONFIG[provider];
          const selected = provider === "gemini" && meta.availableToUser;
          const disabled = !meta.availableToUser;
          return (
            <div
              key={provider}
              className={`rounded-lg border px-4 py-3 ${
                selected
                  ? "border-teal-300 bg-teal-50/70"
                  : "border-stone-200 bg-stone-50 opacity-80"
              }`}
              aria-disabled={disabled}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-stone-900">{meta.label}</p>
                {selected && <Badge variant="success">Selected</Badge>}
                {provider === "openai" && (
                  <Badge variant="warning">Premium — Coming later</Badge>
                )}
                {provider === "gemini" && <Badge>Included in the MVP</Badge>}
              </div>
              <p className="mt-1 text-sm text-stone-600">
                {provider === "gemini"
                  ? "Used for evidence extraction, CV improvements, and interview feedback during the beta."
                  : "A future paid AI option. No OpenAI request will be made during the MVP."}
              </p>
              {disabled && (
                <p className="mt-2 text-xs text-stone-500">
                  Not available yet — OpenAI-based responses are not included in the free
                  MVP.
                </p>
              )}
            </div>
          );
        })}
        <p className="text-xs text-stone-500">
          Note: Gemini&apos;s free-tier content may be used by Google to improve its
          products. Paid Gemini tiers have different data-use terms. This matters for CV
          and interview data during the beta.
        </p>
      </CardContent>
    </Card>
  );
}
