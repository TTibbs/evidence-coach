import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ExperiencesList } from "@/components/experiences-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function ExperiencesPage({ searchParams }: Props) {
  const params = await searchParams;
  const focus = params.focus?.trim();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: experiences } = await supabase
    .from("experiences")
    .select("*, evidence_cards(count)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const experienceItems = (experiences ?? []).map((exp) => ({
    id: exp.id,
    type: exp.type,
    title: exp.title,
    organisation: exp.organisation,
    evidenceCount: Array.isArray(exp.evidence_cards)
      ? (exp.evidence_cards[0] as { count?: number })?.count ?? 0
      : 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-teal-950">Experiences</h1>
          <p className="mt-1 text-stone-600">
            Jobs, projects, and other source entries for your evidence bank.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/onboarding" />}>
            Upload CV
          </Button>
          <Button render={<Link href="/experiences/new" />}>
            Add manually
          </Button>
        </div>
      </div>

      {focus && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-950">
            Choose an experience for this gap
          </p>
          <p className="mt-1 text-sm text-amber-900">
            Start a guided interview focused on: {focus}
          </p>
        </div>
      )}

      {(!experiences || experiences.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>No experiences yet</CardTitle>
            <CardDescription>
              Upload a CV or add a role manually to start building evidence cards.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/onboarding" />}>
              Get started
            </Button>
          </CardContent>
        </Card>
      )}

      <ExperiencesList experiences={experienceItems} focus={focus} />
    </div>
  );
}
