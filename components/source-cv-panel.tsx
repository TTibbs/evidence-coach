"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CvImportPayload = {
  id: string;
  original_filename?: string | null;
  status: string;
  extracted_text?: string | null;
};

type CvListItem = CvImportPayload & {
  created_at?: string;
};

function pickBestImport(imports: CvListItem[]): string | null {
  if (!imports.length) return null;
  const withText = imports.find((item) => (item.extracted_text ?? "").trim());
  if (withText) return withText.id;
  const confirmed = imports.find((item) => item.status === "confirmed");
  if (confirmed) return confirmed.id;
  const ready = imports.find((item) => item.status === "ready_for_review");
  if (ready) return ready.id;
  return imports[0]?.id ?? null;
}

export function SourceCvPanel({
  cvImportId,
  fallbackToLatest,
}: {
  cvImportId?: string | null;
  /** When no linked import, load the user's most recent usable CV. */
  fallbackToLatest?: boolean;
}) {
  const router = useRouter();
  const [cvImport, setCvImport] = useState<CvImportPayload | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      let id = cvImportId ?? null;

      if (!id && fallbackToLatest) {
        const listRes = await fetch("/api/cv");
        if (listRes.ok) {
          const listData = await listRes.json();
          id = pickBestImport(listData.imports ?? []);
        }
      }

      if (!id) {
        if (!cancelled) {
          setCvImport(null);
          setLoading(false);
        }
        return;
      }

      const res = await fetch(`/api/cv/${id}`);
      const data = await res.json();
      if (!res.ok) {
        if (!cancelled) {
          toast.error(data.error || "Could not load CV");
          setLoading(false);
        }
        return;
      }

      let nextImport = data.cvImport as CvImportPayload;
      let nextText = nextImport.extracted_text ?? "";

      // Older imports (or failed text persistence) — recover from the file once.
      if (!nextText.trim()) {
        if (!cancelled) setRecovering(true);
        const recoverRes = await fetch(`/api/cv/${id}/recover-text`, {
          method: "POST",
        });
        const recoverData = await recoverRes.json();
        if (recoverRes.ok && recoverData.cvImport) {
          nextImport = recoverData.cvImport;
          nextText = recoverData.cvImport.extracted_text ?? "";
        }
        if (!cancelled) setRecovering(false);
      }

      if (!cancelled) {
        setCvImport(nextImport);
        setText(nextText);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [cvImportId, fallbackToLatest]);

  async function download() {
    if (!cvImport) return;
    const res = await fetch(`/api/files/cv?id=${cvImport.id}`);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Download failed");
      return;
    }
    window.open(data.url, "_blank", "noopener,noreferrer");
  }

  async function saveText() {
    if (!cvImport || !text.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/cv/${cvImport.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ extractedText: text.trim() }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(data.error || "Save failed");
      return;
    }
    setCvImport(data.cvImport);
    toast.success("CV text saved");
  }

  async function reextract() {
    if (!cvImport) return;
    setExtracting(true);
    const res = await fetch(`/api/cv/${cvImport.id}/reextract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        text.trim() ? { extractedText: text.trim() } : {},
      ),
    });
    const data = await res.json();
    setExtracting(false);
    if (!res.ok) {
      toast.error(data.error || "Re-extract failed");
      return;
    }
    if (data.cvImport?.extracted_text) {
      setText(data.cvImport.extracted_text);
      setCvImport(data.cvImport);
    }
    toast.success("Extraction ready — review experiences");
    router.push(`/onboarding/review/${cvImport.id}`);
  }

  if (loading || recovering) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Source CV</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-stone-500">
            {recovering ? "Recovering text from uploaded file…" : "Loading CV…"}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!cvImport) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Source CV</CardTitle>
          <CardDescription>
            No uploaded CV is linked to this experience yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Source CV</CardTitle>
        <CardDescription>
          {cvImport.original_filename ?? "Uploaded CV"} · {cvImport.status}.
          Download the original file, edit extracted text, then re-extract to
          update experiences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={download}>
            Download original
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={saveText}
            disabled={saving || !text.trim()}
          >
            {saving ? "Saving…" : "Save text"}
          </Button>
          <Button type="button" onClick={reextract} disabled={extracting}>
            {extracting ? "Extracting…" : "Re-extract experiences"}
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cv-text">Extracted text</Label>
          <Textarea
            id="cv-text"
            rows={14}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="CV text will appear here after upload. You can edit it before re-extracting."
            className="font-mono text-sm"
          />
          {!text.trim() && (
            <p className="text-sm text-amber-800">
              Could not load text from this upload. Paste the CV text here and
              save, or try re-extract after the file is available.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
