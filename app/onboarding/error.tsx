"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Onboarding route failed", error);
  }, [error]);

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>Could not load onboarding</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-stone-600">
          The import or review step failed to load. Your uploaded file and saved
          data have not been changed.
        </p>
        <Button onClick={reset}>Try again</Button>
      </CardContent>
    </Card>
  );
}
