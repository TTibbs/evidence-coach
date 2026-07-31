"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <div className="grid gap-4 md:grid-cols-3">
          {(
            [
              ["strong", "Strong evidence", "success"],
              ["partial", "Partial evidence", "warning"],
              ["gaps", "Gaps", "outline"],
            ] as const
          ).map(([key, label, variant]) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="text-base">{label}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1">
                {(target.match_summary?.[key] ?? []).map((item) => (
                  <Badge key={item} variant={variant}>
                    {item}
                  </Badge>
                ))}
                {(target.match_summary?.[key] ?? []).length === 0 && (
                  <p className="text-sm text-stone-500">None listed</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
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
