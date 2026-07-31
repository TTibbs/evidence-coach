"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { AiDisclosure } from "@/components/ai-disclosure";
import { FileUpload } from "@/components/file-upload/file-upload";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CV_ACCEPT =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default function OnboardingPage() {
  const router = useRouter();

  const onUpload = useCallback(
    async (
      file: File,
      onProgress: (progress: number) => void,
      signal: AbortSignal,
    ) => {
      const form = new FormData();
      form.append("file", file);
      onProgress(15);

      const res = await fetch("/api/cv/upload", {
        method: "POST",
        body: form,
        signal,
      });
      const data = await res.json();

      if (!res.ok) {
        const message = data.error || "Upload failed";
        toast.error(message);
        throw new Error(message);
      }

      onProgress(100);
      toast.success("CV processed — review extracted experiences");
      router.push(`/onboarding/review/${data.cvImport.id}`);
    },
    [router],
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-teal-950">Get started</h1>
        <p className="mt-2 text-stone-600">
          Upload a CV or add experience manually. Imported data creates experiences only —
          never confirmed evidence cards.
        </p>
      </div>

      <AiDisclosure compact />

      <Card>
        <CardHeader>
          <CardTitle>Upload CV</CardTitle>
          <CardDescription>
            PDF or DOCX up to 10 MB. You will review everything before saving.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload
            accept={CV_ACCEPT}
            maxFiles={1}
            maxSize={10_000_000}
            onUpload={onUpload}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add manually</CardTitle>
          <CardDescription>Prefer typing one role at a time.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button render={<Link href="/experiences/new" />}>
            Add experience
          </Button>
        </CardContent>
      </Card>

      <Button variant="ghost" render={<Link href="/dashboard" />}>
        Skip to dashboard
      </Button>
    </div>
  );
}
