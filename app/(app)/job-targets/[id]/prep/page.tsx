"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildInterviewPrepPack,
  type PrepPackEvidenceCard,
  type PrepPackJobTarget,
} from "@/lib/prep-pack";

function coverageBadge(coverage: "strong" | "partial" | "gap") {
  if (coverage === "strong") return "success";
  if (coverage === "partial") return "warning";
  return "outline";
}

type PracticeSessionSummary = {
  id: string;
  question: string;
  job_target_id?: string | null;
  practice_attempts?: { count: number }[] | null;
};

export default function JobTargetPrepPackPage() {
  const { id } = useParams<{ id: string }>();
  const [target, setTarget] = useState<PrepPackJobTarget | null>(null);
  const [cards, setCards] = useState<PrepPackEvidenceCard[]>([]);
  const [sessions, setSessions] = useState<PracticeSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [targetRes, cardsRes, sessionsRes] = await Promise.all([
        fetch(`/api/job-targets/${id}`),
        fetch("/api/evidence?status=confirmed"),
        fetch("/api/practice/sessions"),
      ]);
      const [targetData, cardsData, sessionsData] = await Promise.all([
        targetRes.json(),
        cardsRes.json(),
        sessionsRes.json(),
      ]);

      if (!targetRes.ok) {
        toast.error(targetData.error || "Job target not found");
        setLoading(false);
        return;
      }
      if (!cardsRes.ok) {
        toast.error(cardsData.error || "Could not load evidence");
        setLoading(false);
        return;
      }

      setTarget(targetData.jobTarget);
      setCards(cardsData.cards ?? []);
      if (sessionsRes.ok) {
        setSessions(sessionsData.sessions ?? []);
      }
      setLoading(false);
    }

    load();
  }, [id]);

  const pack = useMemo(
    () => (target ? buildInterviewPrepPack(target, cards) : null),
    [cards, target],
  );

  if (loading || !pack || !target) {
    return <p className="text-stone-600">Building prep pack…</p>;
  }

  const requirementsAnalysed = pack.requirements.length > 0;
  const targetSessions = sessions.filter((session) => session.job_target_id === id);
  const attemptedQuestions = new Set(targetSessions.map((session) => session.question));
  const completedQueueItems = pack.likelyQuestions.filter((question) =>
    attemptedQuestions.has(question),
  ).length;
  const totalAttempts = targetSessions.reduce(
    (sum, session) => sum + (session.practice_attempts?.[0]?.count ?? 0),
    0,
  );
  const retryCount = Math.max(0, totalAttempts - targetSessions.length);

  async function copyPrepSummary() {
    if (!pack) return;
    const summary = [
      pack.targetLabel,
      "",
      "Best evidence:",
      ...(pack.bestEvidence.length > 0
        ? pack.bestEvidence.map((card) => `- ${card.title}`)
        : ["- No confirmed evidence mapped yet."]),
      "",
      "Gaps:",
      ...(pack.gaps.length > 0
        ? pack.gaps.map((gap) => `- ${gap.label}: ${gap.prompt}`)
        : ["- No uncovered requirements listed."]),
      "",
      "Likely questions:",
      ...pack.likelyQuestions.map((question) => `- ${question}`),
    ].join("\n");

    await navigator.clipboard.writeText(summary);
    toast.success("Prep summary copied");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Interview Prep Pack</p>
          <h1 className="font-display text-3xl text-teal-950">
            {pack.targetLabel}
          </h1>
          <p className="mt-1 text-stone-600">
            Role requirements, strongest confirmed evidence, gaps, and practice prompts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            render={<Link href={`/job-targets/${target.id}`} />}
          >
            Job target
          </Button>
          <Button render={<Link href={`/practice?jobTargetId=${target.id}`} />}>
            Practise
          </Button>
          <Button type="button" variant="secondary" onClick={copyPrepSummary}>
            Copy summary
          </Button>
        </div>
      </div>

      {!requirementsAnalysed && (
        <Card>
          <CardHeader>
            <CardTitle>Analyse this job first</CardTitle>
            <CardDescription>
              Add and analyse the job description to build a requirements matrix.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href={`/job-targets/${target.id}`} />}>
              Analyse job description
            </Button>
          </CardContent>
        </Card>
      )}

      {requirementsAnalysed && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Requirements matrix</CardTitle>
              <CardDescription>
                Only confirmed evidence cards are mapped into this pack.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pack.requirements.map((requirement) => (
                <div
                  key={`${requirement.kind}-${requirement.label}`}
                  className="rounded-md border border-stone-200 p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{requirement.label}</p>
                      <p className="text-sm text-stone-500">{requirement.kind}</p>
                    </div>
                    <Badge variant={coverageBadge(requirement.coverage)}>
                      {requirement.coverage}
                    </Badge>
                  </div>
                  {requirement.evidence.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {requirement.evidence.map((card) => (
                        <li key={card.id}>
                          <Link
                            href={`/evidence/${card.id}`}
                            className="block rounded-md bg-stone-50 px-3 py-2 text-sm hover:bg-teal-50"
                          >
                            <span className="font-medium">{card.title}</span>
                            {card.summary && (
                              <span className="mt-1 block text-stone-600">
                                {card.summary}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-stone-600">
                      {requirement.prompt}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Practice progress</CardTitle>
                <CardDescription>
                  Queue progress is based on practice sessions for this job target.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {completedQueueItems}/{pack.likelyQuestions.length} questions started
                  </Badge>
                  <Badge variant={retryCount > 0 ? "success" : "outline"}>
                    {retryCount} retries
                  </Badge>
                </div>
                {targetSessions.length > 0 ? (
                  <ul className="space-y-2 text-sm text-stone-700">
                    {targetSessions.slice(0, 4).map((session) => (
                      <li key={session.id}>
                        <Link
                          href={`/practice/${session.id}`}
                          className="block rounded-md border border-stone-200 px-3 py-2 hover:border-teal-300"
                        >
                          {session.question}
                          <span className="mt-1 block text-stone-500">
                            {session.practice_attempts?.[0]?.count ?? 0} attempts
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-stone-600">
                    No practice sessions started for this job yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Best evidence</CardTitle>
                <CardDescription>
                  Start here when choosing stories for this interview.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {pack.bestEvidence.length > 0 ? (
                  pack.bestEvidence.map((card) => (
                    <Link
                      key={card.id}
                      href={`/evidence/${card.id}`}
                      className="block rounded-md border border-stone-200 px-3 py-2 text-sm hover:border-teal-300"
                    >
                      {card.title}
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-stone-600">
                    No confirmed evidence is mapped to this job yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gaps to fill</CardTitle>
                <CardDescription>
                  Build these before relying on the role-specific pack.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {pack.gaps.length > 0 ? (
                  pack.gaps.map((gap) => (
                    <Button
                      key={gap.label}
                      variant="outline"
                      render={
                        <Link
                          href={`/experiences?focus=${encodeURIComponent(gap.label)}`}
                        />
                      }
                    >
                      {gap.label}
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-stone-600">
                    No uncovered requirements are listed yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Likely questions</CardTitle>
              <CardDescription>
                Use these as a queue, then start a practice session for the job.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-stone-700">
                {pack.likelyQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
