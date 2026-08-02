"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AiDisclosure } from "@/components/ai-disclosure";
import { RETENTION_POLICY } from "@/lib/retention";

type UsageSummary = {
  plan: string;
  remaining: {
    generations: number | null;
    practiceAttempts: number | null;
    cvImports: number | null;
    experiences: number | null;
    evidenceCards: number | null;
    jobTargets: number | null;
  };
};

type CvImport = {
  id: string;
  original_filename?: string | null;
  status: string;
  created_at: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [imports, setImports] = useState<CvImport[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function load() {
      const usageRes = await fetch("/api/usage");
      if (usageRes.ok) setUsage(await usageRes.json());

      const supabase = createClient();
      const { data } = await supabase
        .from("cv_imports")
        .select("id, original_filename, status, created_at")
        .order("created_at", { ascending: false });
      setImports(data ?? []);
    }
    load();
  }, []);

  async function deleteCv(id: string) {
    const res = await fetch(`/api/files/cv?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Delete failed");
      return;
    }
    setImports((prev) => prev.filter((i) => i.id !== id));
    toast.success("CV file deleted");
  }

  async function deleteAccount() {
    setDeleting(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    const data = await res.json();
    setDeleting(false);
    if (!res.ok) {
      toast.error(data.error || "Account deletion failed");
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Account deleted");
    router.push("/");
  }

  async function exportAccountData() {
    setExporting(true);
    const res = await fetch("/api/account");
    const data = await res.json();
    setExporting(false);
    if (!res.ok) {
      toast.error(data.error || "Export failed");
      return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "evidence-coach-export.json";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Account data exported");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-teal-950">Settings</h1>
        <p className="mt-1 text-stone-600">
          Privacy controls, usage, and account management.
        </p>
      </div>

      <AiDisclosure />

      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>
            Plan: {usage?.plan ?? "…"}. Limits reset monthly. Your evidence stays
            accessible if you stop paying later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Generations remaining: {usage?.remaining.generations ?? "—"}
          </p>
          <p>
            Practice attempts remaining:{" "}
            {usage?.remaining.practiceAttempts ?? "—"}
          </p>
          <p>CV imports remaining: {usage?.remaining.cvImports ?? "—"}</p>
          <p>
            Experiences remaining: {usage?.remaining.experiences ?? "—"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded CVs</CardTitle>
          <CardDescription>
            Delete stored CV files independently of your experience entries.
            {` ${RETENTION_POLICY.extractedCvText}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {imports.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-stone-200 px-3 py-2 text-sm"
            >
              <span>
                {item.original_filename ?? item.id} · {item.status}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const res = await fetch(`/api/files/cv?id=${item.id}`);
                    const data = await res.json();
                    if (!res.ok) {
                      toast.error(data.error || "Download failed");
                      return;
                    }
                    window.open(data.url, "_blank", "noopener,noreferrer");
                  }}
                >
                  Download
                </Button>
                <ConfirmButton
                  label="Delete file"
                  confirmLabel="Delete file"
                  title="Delete stored CV file?"
                  description={`This removes ${item.original_filename ?? "this uploaded CV"} from storage. Your saved experiences will remain.`}
                  variant="destructive"
                  size="sm"
                  onConfirm={() => deleteCv(item.id)}
                />
              </div>
            </div>
          ))}
          {imports.length === 0 && (
            <p className="text-sm text-stone-500">No uploaded CVs.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data retention</CardTitle>
          <CardDescription>
            Uploaded files and recordings are stored under your user ID.
            {` ${RETENTION_POLICY.practiceAudio} ${RETENTION_POLICY.practiceTranscripts} ${RETENTION_POLICY.dictationAudio}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportAccountData} disabled={exporting}>
              {exporting ? "Exporting…" : "Export account data"}
            </Button>
            <ConfirmButton
              label={deleting ? "Deleting…" : "Delete account"}
              confirmLabel="Delete account"
              title="Delete your account?"
              description="This permanently deletes your account and all associated data. This cannot be undone."
              variant="destructive"
              disabled={deleting}
              onConfirm={deleteAccount}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
