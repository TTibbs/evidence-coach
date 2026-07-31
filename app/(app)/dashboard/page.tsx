import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUsageSummary } from "@/lib/entitlements/check";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STARTER_COMPETENCIES } from "@/types/domain";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: experiences },
    { data: cards },
    { data: drafts },
    { data: recentContent },
    { data: recentSessions },
    usage,
  ] = await Promise.all([
    supabase
      .from("experiences")
      .select("id")
      .eq("user_id", user!.id),
    supabase
      .from("evidence_cards")
      .select("id, competencies, confidence_status")
      .eq("user_id", user!.id)
      .eq("confidence_status", "confirmed"),
    supabase
      .from("evidence_cards")
      .select("id, title")
      .eq("user_id", user!.id)
      .eq("confidence_status", "draft")
      .is("archived_at", null)
      .limit(5),
    supabase
      .from("generated_content")
      .select("id, type, content, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("practice_sessions")
      .select("id, question, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(5),
    getUsageSummary(user!.id),
  ]);

  const covered = new Set<string>();
  for (const card of cards ?? []) {
    for (const c of card.competencies ?? []) covered.add(String(c).toLowerCase());
  }
  const gaps = STARTER_COMPETENCIES.filter((c) => !covered.has(c)).slice(0, 4);

  let nextAction = {
    title: "Add your first experience",
    href: "/onboarding",
    detail: "Upload a CV or add a role manually.",
  };
  if ((experiences?.length ?? 0) > 0 && (cards?.length ?? 0) === 0) {
    nextAction = {
      title: "Build an evidence card",
      href: "/experiences",
      detail: "Open an experience and start a guided evidence interview.",
    };
  } else if ((drafts?.length ?? 0) > 0) {
    nextAction = {
      title: "Confirm a draft evidence card",
      href: `/evidence/${drafts![0].id}`,
      detail: drafts![0].title,
    };
  } else if ((cards?.length ?? 0) > 0 && (recentContent?.length ?? 0) === 0) {
    nextAction = {
      title: "Generate a CV bullet",
      href: "/builder",
      detail: "Use a confirmed card to improve CV wording.",
    };
  } else if ((cards?.length ?? 0) > 0) {
    nextAction = {
      title: "Practise an interview answer",
      href: "/practice",
      detail: gaps[0]
        ? `Try covering ${gaps[0].replace(/-/g, " ")}.`
        : "Retry a previous answer or start a new session.",
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-teal-950">Dashboard</h1>
        <p className="mt-1 text-stone-600">Continue preparing — actions first, not vanity stats.</p>
      </div>

      <Card className="border-teal-200 bg-teal-50/60">
        <CardHeader>
          <CardTitle>Suggested next action</CardTitle>
          <CardDescription>{nextAction.detail}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button render={<Link href={nextAction.href} />}>
            {nextAction.title}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Experiences</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-teal-900">
            {experiences?.length ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confirmed cards</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-teal-900">
            {cards?.length ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Practice left this month</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-teal-900">
            {usage.remaining.practiceAttempts ?? "∞"}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Continue preparing</CardTitle>
            <CardDescription>Incomplete drafts and recent practice.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(drafts ?? []).map((d) => (
              <Link
                key={d.id}
                href={`/evidence/${d.id}`}
                className="flex items-center justify-between rounded-md border border-stone-200 px-3 py-2 text-sm hover:bg-stone-50"
              >
                <span>{d.title}</span>
                <Badge variant="warning">draft</Badge>
              </Link>
            ))}
            {(recentSessions ?? []).map((s) => (
              <Link
                key={s.id}
                href={`/practice/${s.id}`}
                className="block rounded-md border border-stone-200 px-3 py-2 text-sm hover:bg-stone-50"
              >
                {s.question}
              </Link>
            ))}
            {(drafts ?? []).length === 0 && (recentSessions ?? []).length === 0 && (
              <p className="text-sm text-stone-500">Nothing in progress yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evidence overview</CardTitle>
            <CardDescription>
              {gaps.length > 0
                ? `Gaps to consider: ${gaps.map((g) => g.replace(/-/g, " ")).join(", ")}`
                : "Core competencies are covered."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-stone-600">
              Generations remaining this month:{" "}
              <strong>{usage.remaining.generations ?? "∞"}</strong>
            </p>
            {(recentContent ?? []).map((item) => (
              <div key={item.id} className="rounded-md border border-stone-200 px-3 py-2 text-sm">
                <Badge variant="secondary" className="mb-1">
                  {item.type}
                </Badge>
                <p className="line-clamp-2 text-stone-700">{item.content}</p>
              </div>
            ))}
            {(recentContent ?? []).length === 0 && (
              <Button variant="outline" size="sm" render={<Link href="/builder" />}>
                Open builder
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
