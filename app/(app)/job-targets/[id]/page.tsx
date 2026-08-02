"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  CitationChips,
  type CitationSource,
} from "@/components/citation-chips";
import type {
  JobTrustCheckResult,
  JobTrustSignal,
} from "@/lib/job-trust";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type JobTarget = {
  id: string;
  title: string;
  company?: string | null;
  description?: string | null;
  source_url?: string | null;
  trust_check?: JobTrustCheckResult | null;
  trust_checked_at?: string | null;
  official_listing_url?: string | null;
  extracted_skills?: string[];
  extracted_competencies?: string[];
  match_summary?: {
    strong: string[];
    partial: string[];
    gaps: string[];
  } | null;
};

export default function JobTargetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [target, setTarget] = useState<JobTarget | null>(null);
  const [description, setDescription] = useState("");
  const [analysing, setAnalysing] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/job-targets/${id}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Not found");
        return;
      }
      setTarget(data.jobTarget);
      setDescription(data.jobTarget.description ?? "");
    }
    load();
  }, [id]);

  async function saveDescription() {
    const res = await fetch(`/api/job-targets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Save failed");
      return;
    }
    setTarget(data.jobTarget);
    toast.success("Saved");
  }

  async function analyse() {
    setAnalysing(true);
    await saveDescription();
    const res = await fetch(`/api/job-targets/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "analyse" }),
    });
    const data = await res.json();
    setAnalysing(false);
    if (!res.ok) {
      toast.error(data.error || "Analysis failed");
      return;
    }
    setTarget(data.jobTarget);
    toast.success("Job description analysed");
  }

  if (!target) return <p className="text-stone-600">Loading…</p>;

  const evidenceGaps = target.match_summary?.gaps ?? [];
  const gapFocusHref = (gap: string) =>
    `/experiences?focus=${encodeURIComponent(gap)}`;
  const practiseHref = `/practice?jobTargetId=${encodeURIComponent(target.id)}`;
  const trustCheck = target.trust_check;
  const trustSources = buildTrustSources(target);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-teal-950">{target.title}</h1>
          <p className="text-stone-600">{target.company}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            render={<Link href={`/job-targets/${target.id}/prep`} />}
          >
            Prep pack
          </Button>
          <Button render={<Link href={practiseHref} />}>
            Practise this job
          </Button>
        </div>
      </div>

      {trustCheck && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Job confidence</CardTitle>
                <CardDescription>
                  {trustCheck.summary}
                </CardDescription>
              </div>
              <Badge variant={trustBadgeVariant(trustCheck.status)}>
                {trustLabel(trustCheck)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="space-y-1">
                <p className="text-sm font-medium text-stone-700">
                  Confidence {trustCheck.score}/100 via {providerLabel(trustCheck)}
                  {trustCheck.cached ? " · cached" : ""}
                </p>
                {target.trust_checked_at && (
                  <p className="text-xs text-stone-500">
                    Checked {formatCheckedAt(target.trust_checked_at)}
                  </p>
                )}
              </div>
              <CitationChips sources={trustSources} />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              {trustCheck.signals.map((signal) => (
                <div
                  key={signal.id}
                  className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-stone-800">
                      {signal.label}
                    </p>
                    <Badge variant={signalBadgeVariant(signal.status)}>
                      {signal.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-stone-600">{signal.detail}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {trustCheck.officialListing.url && (
                <Button
                  variant="outline"
                  render={
                    <Link
                      href={trustCheck.officialListing.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  Open official listing
                </Button>
              )}
              {trustCheck.manualSearchUrl && (
                <Button
                  variant="ghost"
                  render={
                    <Link
                      href={trustCheck.manualSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  Search manually
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Job description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="description" className="sr-only">
            Job description
          </Label>
          <Textarea
            id="description"
            rows={10}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={saveDescription}>
              Save
            </Button>
            <Button onClick={analyse} disabled={analysing}>
              {analysing ? "Analysing…" : "Analyse & match evidence"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {target.match_summary && (
        <section className="space-y-4">
          {evidenceGaps.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-950">
                    Evidence gaps found
                  </p>
                  <p className="mt-1 text-sm text-amber-900">
                    This job description asks for evidence you have not covered yet:
                    {" "}
                    {evidenceGaps.slice(0, 4).join(", ")}
                    {evidenceGaps.length > 4 ? "…" : ""}
                  </p>
                </div>
                <Button
                  variant="outline"
                  render={<Link href={gapFocusHref(evidenceGaps[0])} />}
                >
                  Build evidence
                </Button>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            {(
              [
                [
                  "strong",
                  "Strong evidence",
                  "success",
                  "Ready to reuse in tailored CV bullets or practice answers.",
                ],
                [
                  "partial",
                  "Partial evidence",
                  "warning",
                  "Worth strengthening before relying on it for this role.",
                ],
                [
                  "gaps",
                  "Gaps",
                  "outline",
                  "Add or confirm evidence before making strong claims here.",
                ],
              ] as const
            ).map(([key, label, variant, description]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="text-base">{label}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-1">
                  {(target.match_summary?.[key] ?? []).map((item) => (
                    key === "gaps" ? (
                      <Button
                        key={item}
                        size="sm"
                        variant="outline"
                        render={<Link href={gapFocusHref(item)} />}
                      >
                        {item}
                      </Button>
                    ) : (
                      <Badge key={item} variant={variant}>
                        {item}
                      </Badge>
                    )
                  ))}
                  {(target.match_summary?.[key] ?? []).length === 0 && (
                    <p className="text-sm text-stone-500">None listed</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {(target.extracted_skills?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted skills</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1">
            {target.extracted_skills!.map((s) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function buildTrustSources(target: JobTarget): CitationSource[] {
  const sources: CitationSource[] = [];
  const check = target.trust_check;

  if (target.source_url) {
    sources.push({
      id: "captured-source",
      label: "Source",
      title: target.title,
      excerpt: "The original page captured for this saved job target.",
      url: target.source_url,
      meta: safeHostname(target.source_url) || "Captured source",
    });
  }

  if (check?.officialListing.url) {
    sources.push({
      id: "official-listing",
      label: "Official",
      title: check.officialListing.label,
      excerpt: check.summary,
      url: check.officialListing.url,
      meta: "Official listing candidate",
    });
  }

  return sources;
}

function trustLabel(check: JobTrustCheckResult) {
  if (check.status === "good_signals") return "Good signals";
  if (check.status === "needs_review") return "Needs review";
  return "Unable to verify";
}

function trustBadgeVariant(
  status: JobTrustCheckResult["status"],
): "success" | "warning" | "outline" {
  if (status === "good_signals") return "success";
  if (status === "needs_review") return "warning";
  return "outline";
}

function signalBadgeVariant(
  status: JobTrustSignal["status"],
): "success" | "warning" | "outline" {
  if (status === "positive") return "success";
  if (status === "warning") return "warning";
  return "outline";
}

function providerLabel(check: JobTrustCheckResult) {
  if (check.provider === "tavily") return "Tavily";
  if (check.provider === "gemini") return "Gemini";
  return "manual signals";
}

function formatCheckedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function safeHostname(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
