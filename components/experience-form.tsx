"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXPERIENCE_TYPES, experienceTypeSchema } from "@/lib/ai/schemas";

const TYPE_LABELS: Record<(typeof EXPERIENCE_TYPES)[number], string> = {
  employment: "Employment",
  project: "Project",
  freelance: "Freelance",
  volunteering: "Volunteering",
  education: "Education",
  certificate: "Certificate",
  other: "Other",
};

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  organisation: z.string().optional(),
  type: experienceTypeSchema,
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean(),
  description: z.string().optional(),
  responsibilitiesText: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ExperienceForm({
  defaultValues,
  experienceId,
}: {
  defaultValues?: Partial<FormValues>;
  experienceId?: string;
}) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "employment",
      isCurrent: false,
      ...defaultValues,
    },
  });

  async function onSubmit(values: FormValues) {
    const payload = {
      title: values.title,
      organisation: values.organisation || null,
      type: values.type,
      location: values.location || null,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
      isCurrent: values.isCurrent,
      description: values.description || null,
      responsibilities: (values.responsibilitiesText || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    const url = experienceId
      ? `/api/experiences/${experienceId}`
      : "/api/experiences";
    const res = await fetch(url, {
      method: experienceId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to save");
      return;
    }
    toast.success(experienceId ? "Experience updated" : "Experience added");
    router.push(`/experiences/${data.experience.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register("title")} />
          {errors.title && (
            <p className="text-sm text-red-700">{errors.title.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="organisation">Organisation</Label>
          <Input id="organisation" {...register("organisation")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  if (value != null) field.onChange(value);
                }}
                items={EXPERIENCE_TYPES.map((value) => ({
                  value,
                  label: TYPE_LABELS[value],
                }))}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {TYPE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" type="date" {...register("startDate")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" type="date" {...register("endDate")} />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input id="isCurrent" type="checkbox" {...register("isCurrent")} />
          <Label htmlFor="isCurrent">This is a current role</Label>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={3} {...register("description")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="responsibilitiesText">
            Responsibilities (one per line)
          </Label>
          <Textarea
            id="responsibilitiesText"
            rows={5}
            {...register("responsibilitiesText")}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save experience"}
        </Button>
        <Button type="button" variant="outline" render={<Link href="/experiences" />}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function ExperienceFormCard(props: {
  defaultValues?: Partial<FormValues>;
  experienceId?: string;
  title?: string;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl">
          {props.title ?? "Add experience"}
        </CardTitle>
        <CardDescription>
          {props.description ??
            "Capture a role, project, or other experience to mine for evidence."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ExperienceForm
          defaultValues={props.defaultValues}
          experienceId={props.experienceId}
        />
      </CardContent>
    </Card>
  );
}
