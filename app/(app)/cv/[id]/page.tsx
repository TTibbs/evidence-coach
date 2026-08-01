import Link from "next/link";
import { notFound } from "next/navigation";
import { SourceCvPanel } from "@/components/source-cv-panel";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CvDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: cvImport } = await supabase
    .from("cv_imports")
    .select("id, original_filename, status")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!cvImport) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-stone-500">Uploaded CV</p>
          <h1 className="font-display text-3xl text-teal-950">
            {cvImport.original_filename ?? "CV"}
          </h1>
          <p className="mt-1 text-stone-600">{cvImport.status}</p>
        </div>
        <Button variant="outline" render={<Link href="/cv" />}>
          Back to CVs
        </Button>
      </div>

      <SourceCvPanel cvImportId={id} />
    </div>
  );
}
