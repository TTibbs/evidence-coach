"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Public route failed", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <h1 className="font-display text-3xl text-teal-950">Something went wrong</h1>
      <p className="mt-3 text-stone-600">
        The page could not load. You can try again or return to the start page.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" render={<Link href="/" />}>
          Go home
        </Button>
      </div>
    </main>
  );
}
