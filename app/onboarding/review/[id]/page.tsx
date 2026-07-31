"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import type { ExperienceType, ExtractedExperienceDraft } from "@/types/domain";
import { normalizeCvDate } from "@/lib/cv/dates";
import { ImproveResponsibilitiesControl } from "@/components/improve-responsibilities-control";

type ReviewEntry = ExtractedExperienceDraft & { clientId: string };

function createEntry(
  partial: Partial<ExtractedExperienceDraft> & { type: ExperienceType },
): ReviewEntry {
  return {
    title: "",
    isCurrent: false,
    responsibilities: [],
    ...partial,
    clientId: crypto.randomUUID(),
  };
}

function stripClientId(entry: ReviewEntry): ExtractedExperienceDraft {
  const draft: ExtractedExperienceDraft = { ...entry };
  delete (draft as Partial<ReviewEntry>).clientId;
  return draft;
}

const SECTION_ORDER = [
  "experience",
  "projects",
  "freelance",
  "volunteering",
  "education",
  "certificates",
  "other",
] as const;

type SectionId = (typeof SECTION_ORDER)[number];

const SECTION_LABELS: Record<SectionId, string> = {
  experience: "Experience",
  projects: "Projects",
  freelance: "Freelance",
  volunteering: "Volunteering",
  education: "Education",
  certificates: "Certificates",
  other: "Other",
};

const TYPE_TO_SECTION: Record<ExperienceType, SectionId> = {
  employment: "experience",
  project: "projects",
  freelance: "freelance",
  volunteering: "volunteering",
  education: "education",
  certificate: "certificates",
  other: "other",
};

const ALWAYS_VISIBLE_SECTIONS: SectionId[] = [
  "experience",
  "education",
  "certificates",
];

const SECTION_ADD_TYPE: Record<SectionId, ExperienceType> = {
  experience: "employment",
  projects: "project",
  freelance: "freelance",
  volunteering: "volunteering",
  education: "education",
  certificates: "certificate",
  other: "other",
};

const SECTION_ADD_LABEL: Record<SectionId, string> = {
  experience: "Add experience",
  projects: "Add project",
  freelance: "Add freelance",
  volunteering: "Add volunteering",
  education: "Add education",
  certificates: "Add certificate",
  other: "Add other",
};

const TYPE_OPTIONS: { value: ExperienceType; label: string }[] = [
  { value: "employment", label: "Employment" },
  { value: "project", label: "Project" },
  { value: "freelance", label: "Freelance" },
  { value: "volunteering", label: "Volunteering" },
  { value: "education", label: "Education" },
  { value: "certificate", label: "Certificate" },
  { value: "other", label: "Other" },
];

export default function CvReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [experiences, setExperiences] = useState<ReviewEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/cv/${id}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load import");
        setLoading(false);
        return;
      }
      const draft = data.cvImport.extracted_draft;
      setName(draft?.name ?? "");
      setExperiences(
        ((draft?.experiences ?? []) as ExtractedExperienceDraft[]).map((exp) =>
          createEntry({
            ...exp,
            startDate: normalizeCvDate(exp.startDate) ?? undefined,
            endDate: normalizeCvDate(exp.endDate) ?? undefined,
            isCurrent: Boolean(exp.isCurrent),
            responsibilities: exp.responsibilities ?? [],
          }),
        ),
      );
      setLoading(false);
    }
    load();
  }, [id]);

  const sections = useMemo(() => {
    const grouped = new Map<
      SectionId,
      { exp: ReviewEntry; index: number }[]
    >();

    experiences.forEach((exp, index) => {
      const section = TYPE_TO_SECTION[exp.type] ?? "other";
      const list = grouped.get(section) ?? [];
      list.push({ exp, index });
      grouped.set(section, list);
    });

    return SECTION_ORDER.filter(
      (section) =>
        ALWAYS_VISIBLE_SECTIONS.includes(section) ||
        (grouped.get(section)?.length ?? 0) > 0,
    ).map((section) => ({
      id: section,
      label: SECTION_LABELS[section],
      addLabel: SECTION_ADD_LABEL[section],
      addType: SECTION_ADD_TYPE[section],
      items: grouped.get(section) ?? [],
    }));
  }, [experiences]);

  function updateExp(index: number, patch: Partial<ExtractedExperienceDraft>) {
    setExperiences((prev) =>
      prev.map((exp, i) => (i === index ? { ...exp, ...patch } : exp)),
    );
  }

  function removeExp(index: number) {
    setExperiences((prev) => prev.filter((_, i) => i !== index));
  }

  function moveExpInSection(
    sectionItems: { index: number }[],
    sectionPos: number,
    direction: -1 | 1,
  ) {
    const targetPos = sectionPos + direction;
    if (targetPos < 0 || targetPos >= sectionItems.length) return;

    const from = sectionItems[sectionPos]!.index;
    const to = sectionItems[targetPos]!.index;

    setExperiences((prev) => {
      const next = [...prev];
      const temp = next[from]!;
      next[from] = next[to]!;
      next[to] = temp;
      return next;
    });
  }

  function addExp(type: ExperienceType = "employment") {
    setExperiences((prev) => [...prev, createEntry({ type })]);
  }

  async function confirm() {
    setSaving(true);
    const payload = {
      name,
      experiences: experiences.map((entry) => {
        const exp = stripClientId(entry);
        return {
        ...exp,
        responsibilities: (exp.responsibilities ?? [])
          .map((line) => line.trim())
          .filter(Boolean),
        startDate: exp.startDate || null,
        endDate: exp.isCurrent ? null : exp.endDate || null,
        };
      }),
    };
    const res = await fetch(`/api/cv/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(data.error || "Confirm failed");
      return;
    }
    if (data.resync) {
      toast.success(
        `Experiences updated (${data.updated ?? 0} updated, ${data.created ?? 0} new)`,
      );
    } else {
      toast.success("Experiences saved");
    }
    router.push("/experiences");
    router.refresh();
  }

  if (loading) {
    return <p className="text-stone-600">Loading extraction…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-teal-950">Review CV import</h1>
        <p className="mt-2 text-stone-600">
          Correct, merge, or remove entries before saving. Matching roles from
          this CV import are updated; new roles are added. This will not create
          evidence cards.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      {sections.map((section) => (
        <section key={section.id} className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-xl text-teal-950">{section.label}</h2>
            <p className="text-sm text-stone-500">
              {section.items.length}{" "}
              {section.items.length === 1 ? "entry" : "entries"}
            </p>
          </div>

          {section.items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-stone-200 px-4 py-6 text-sm text-stone-500">
              Nothing imported here yet. Add an entry if something is missing.
            </p>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {section.items.map(({ exp, index }, sectionPos) => (
                <Card
                  key={exp.clientId}
                  className="h-full lg:odd:last:col-span-2"
                >
                  <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="truncate">
                        {exp.title.trim() || "Untitled entry"}
                      </CardTitle>
                      <CardDescription className="truncate">
                        {exp.organisation?.trim() || "No organisation"}
                      </CardDescription>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Move up"
                        title="Move up"
                        disabled={sectionPos === 0}
                        onClick={() =>
                          moveExpInSection(section.items, sectionPos, -1)
                        }
                      >
                        <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Move down"
                        title="Move down"
                        disabled={sectionPos === section.items.length - 1}
                        onClick={() =>
                          moveExpInSection(section.items, sectionPos, 1)
                        }
                      >
                        <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete entry"
                        title="Delete"
                        onClick={() => removeExp(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={exp.title}
                        onChange={(e) =>
                          updateExp(index, { title: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Organisation</Label>
                      <Input
                        value={exp.organisation ?? ""}
                        onChange={(e) =>
                          updateExp(index, { organisation: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={exp.type}
                        onValueChange={(value) => {
                          if (value == null) return;
                          updateExp(index, { type: value as ExperienceType });
                        }}
                        items={TYPE_OPTIONS.map((option) => ({
                          value: option.value,
                          label: option.label,
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Start date</Label>
                        <Input
                          type="date"
                          value={exp.startDate ?? ""}
                          onChange={(e) =>
                            updateExp(index, {
                              startDate: e.target.value || undefined,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End date</Label>
                        <Input
                          type="date"
                          value={exp.endDate ?? ""}
                          disabled={Boolean(exp.isCurrent)}
                          onChange={(e) =>
                            updateExp(index, {
                              endDate: e.target.value || undefined,
                            })
                          }
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-stone-700">
                      <input
                        type="checkbox"
                        checked={Boolean(exp.isCurrent)}
                        onChange={(e) =>
                          updateExp(index, {
                            isCurrent: e.target.checked,
                            endDate: e.target.checked
                              ? undefined
                              : exp.endDate,
                          })
                        }
                      />
                      This is current
                    </label>
                    <div className="space-y-2">
                      <Label>Responsibilities (one per line)</Label>
                      <ImproveResponsibilitiesControl
                        title={exp.title}
                        organisation={exp.organisation}
                        type={exp.type}
                        responsibilities={exp.responsibilities ?? []}
                        onImproved={(next) =>
                          updateExp(index, { responsibilities: next })
                        }
                      />
                      <Textarea
                        rows={4}
                        value={(exp.responsibilities ?? []).join("\n")}
                        onChange={(e) =>
                          updateExp(index, {
                            // Keep empty lines while typing so Enter / caret stay stable.
                            responsibilities: e.target.value.split("\n"),
                          })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addExp(section.addType)}
          >
            {section.addLabel}
          </Button>
        </section>
      ))}

      <div className="border-t border-stone-200 pt-6">
        <Button
          type="button"
          onClick={confirm}
          disabled={saving || experiences.length === 0}
        >
          {saving ? "Saving…" : "Confirm experiences"}
        </Button>
      </div>
    </div>
  );
}
