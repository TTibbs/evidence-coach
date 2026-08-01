import Link from "next/link";
import { CvImportsList } from "@/components/cv-imports-list";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { RETENTION_POLICY } from "@/lib/retention";

export default async function CvPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: imports } = await supabase
    .from("cv_imports")
    .select("id, original_filename, status, created_at, confirmed_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-teal-950">CVs</h1>
          <p className="mt-1 text-stone-600">
            View uploaded CVs, inspect extracted text, and re-run extraction.
          </p>
        </div>
        <Button render={<Link href="/onboarding" />}>Upload CV</Button>
      </div>

      <p className="max-w-3xl text-sm text-stone-500">
        {RETENTION_POLICY.cvFiles} {RETENTION_POLICY.extractedCvText}
      </p>

      <CvImportsList imports={imports ?? []} />
    </div>
  );
}
