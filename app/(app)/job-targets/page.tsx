"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CitationChips,
  type CitationSource,
} from "@/components/citation-chips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type ExtensionDraft = {
  title?: string;
  company?: string;
  description?: string;
  sourceUrl?: string;
};

function decodeExtensionDraft(hash: string): ExtensionDraft | null {
  const match = hash.match(/(?:^#|&)extension-draft=([^&]+)/);
  if (!match?.[1]) return null;

  try {
    const encoded = decodeURIComponent(match[1]);
    const padded = encoded.padEnd(
      encoded.length + ((4 - (encoded.length % 4)) % 4),
      "=",
    );
    const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as ExtensionDraft;
  } catch {
    return null;
  }
}

function cleanImportedJobDescription(value?: string) {
  let text = (value ?? "")
    .normalize("NFKC")
    .replace(/\r/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  for (let i = 0; i < 3; i++) {
    const lines = text.split("\n");
    while (lines.length > 1 && lines[0].trim() === "") lines.shift();

    const first = (lines[0] ?? "")
      .replace(/[^a-z0-9]/giu, "")
      .toLowerCase();

    if (lines.length > 1 && first.length === 1) {
      lines.shift();
      text = lines.join("\n").trim();
      continue;
    }

    break;
  }

  return text;
}

export default function JobTargetsPage() {
  const router = useRouter();
  const [targets, setTargets] = useState<JobTarget[]>([]);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const draftSources = useMemo<CitationSource[]>(() => {
    if (!sourceUrl) return [];

    const hostname = safeHostname(sourceUrl);
    return [
      {
        id: "extension-source",
        label: "Source",
        title: title || "Captured job source",
        excerpt:
          "This job description was captured from the browser extension. Review the source before saving or applying.",
        url: sourceUrl,
        meta: hostname ? `Captured from ${hostname}` : "Browser capture",
      },
    ];
  }, [sourceUrl, title]);

  async function load() {
    setLoading(true);
    setLoadError(null);
    const res = await fetch("/api/job-targets");
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setTargets(data.jobTargets ?? []);
      return;
    }
    const message = data.error || "Could not load job targets";
    setLoadError(message);
    toast.error(message);
  }

  useEffect(() => {
    // Initial load of saved job targets
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, []);

  useEffect(() => {
    const draft = decodeExtensionDraft(window.location.hash);
    if (!draft) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time extension draft hydration
    setTitle(draft.title?.trim() || "");
    setCompany(draft.company?.trim() || "");
    setDescription(cleanImportedJobDescription(draft.description));
    setSourceUrl(draft.sourceUrl?.trim() || "");
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
    toast.success("Captured job description loaded. Review it before saving.");
  }, []);

  async function createTarget(e: React.FormEvent) {
    e.preventDefault();
    const cleanedDescription = cleanImportedJobDescription(description);
    if (cleanedDescription !== description) {
      setDescription(cleanedDescription);
    }
    setCreating(true);
    const res = await fetch("/api/job-targets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        company,
        description: cleanedDescription,
        sourceUrl: sourceUrl || null,
      }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      toast.error(data.error || "Failed to create");
      return;
    }
    toast.success("Job target saved");
    setTitle("");
    setCompany("");
    setDescription("");
    setSourceUrl("");
    router.push(`/job-targets/${data.jobTarget.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-teal-950">Job Targets</h1>
        <p className="mt-1 text-stone-600">
          Save target roles and paste job descriptions to match against your evidence.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add job target</CardTitle>
          <CardDescription>
            Matching never invents missing requirements into your CV.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createTarget} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Role title</Label>
                <Input
                  id="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Job description</Label>
              <Textarea
                id="description"
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Paste the job description…"
              />
            </div>
            {draftSources.length > 0 && (
              <div className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-stone-700">
                    Captured source
                  </p>
                  <CitationChips sources={draftSources} />
                </div>
              </div>
            )}
            <Button type="submit" disabled={creating}>
              {creating ? "Saving…" : "Save target"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {loading && <p className="text-sm text-stone-500">Loading job targets…</p>}
        {loadError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {loadError}
          </div>
        )}
        {!loading && !loadError && targets.length === 0 && (
          <p className="rounded-md border border-stone-200 bg-white px-4 py-3 text-sm text-stone-500">
            No job targets yet.
          </p>
        )}
        <ul className="space-y-2">
          {targets.map((t) => (
            <li key={t.id}>
              <Link
                href={`/job-targets/${t.id}`}
                className="block rounded-lg border border-stone-200 bg-white px-4 py-3 hover:border-teal-300"
              >
                <p className="font-medium">{t.title}</p>
                <p className="text-sm text-stone-500">{t.company || "No company"}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function safeHostname(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
