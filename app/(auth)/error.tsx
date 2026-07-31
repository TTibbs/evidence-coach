"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth route failed", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Authentication page failed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-stone-600">
            The sign-in flow could not load. Try again, or return to the login page.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={reset}>Try again</Button>
            <Button variant="outline" render={<Link href="/login" />}>
              Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
