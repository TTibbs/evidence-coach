import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="font-display text-5xl tracking-tight text-teal-950 sm:text-6xl">
        Evidence Coach
      </p>
      <h1 className="mt-6 max-w-xl text-2xl font-medium text-stone-800 sm:text-3xl">
        Turn your real experience into stronger CV evidence and interview answers.
      </h1>
      <p className="mt-4 max-w-lg text-stone-600">
        Add your experience once, then reuse it across your CV, applications, and interview
        practice — without inventing achievements you have not confirmed.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" render={<Link href="/signup" />}>
          Create account
        </Button>
        <Button variant="outline" size="lg" render={<Link href="/login" />}>
          Sign in
        </Button>
      </div>
    </div>
  );
}
