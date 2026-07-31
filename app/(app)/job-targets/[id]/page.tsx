"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-teal-950">{target.title}</h1>
        <p className="text-stone-600">{target.company}</p>
      </div>

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
