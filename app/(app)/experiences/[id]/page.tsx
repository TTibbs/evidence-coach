import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SourceCvPanel } from "@/components/source-cv-panel";

type Props = { params: Promise<{ id: string }> };

export default async function ExperienceDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: experience } = await supabase
    .from("experiences")
    .select("*, evidence_cards(*)")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!experience) notFound();

  const cards = experience.evidence_cards ?? [];
  const showCvPanel =
    Boolean(experience.cv_import_id) || experience.source === "cv-import";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-stone-500">
            {experience.type}
          </p>
          <h1 className="font-display text-3xl text-teal-950">{experience.title}</h1>
          <p className="text-stone-600">{experience.organisation}</p>
        </div>
        <Button render={<Link href={`/evidence/interview/new?experienceId=${experience.id}`} />}>
          Create evidence card
        </Button>
      </div>

      {experience.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-stone-700">{experience.description}</p>
          </CardContent>
        </Card>
      )}

      {experience.responsibilities?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Responsibilities</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-stone-700">
              {experience.responsibilities.map((r: string) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {showCvPanel && (
        <SourceCvPanel
          cvImportId={experience.cv_import_id}
          fallbackToLatest={!experience.cv_import_id}
        />
      )}

      <section className="space-y-3">
        <h2 className="font-display text-xl">Evidence cards</h2>
        {cards.length === 0 ? (
          <p className="text-stone-600">
            No evidence cards yet. Start a guided interview to uncover examples.
          </p>
        ) : (
          <ul className="space-y-2">
            {cards.map(
              (card: {
                id: string;
                title: string;
                confidence_status: string;
                summary: string;
              }) => (
                <li key={card.id}>
                  <Link
                    href={`/evidence/${card.id}`}
                    className="block rounded-lg border border-stone-200 bg-white px-4 py-3 hover:border-teal-300"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{card.title}</p>
                      <Badge
                        variant={
                          card.confidence_status === "confirmed"
                            ? "success"
                            : "warning"
                        }
                      >
                        {card.confidence_status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-stone-600 line-clamp-2">
                      {card.summary}
                    </p>
                  </Link>
                </li>
              ),
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
