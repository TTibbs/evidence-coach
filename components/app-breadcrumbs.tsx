"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenCheck,
  Briefcase,
  FileText,
  FileCheck2,
  Settings,
  Sparkles,
  Target,
} from "lucide-react";
import {
  MotionBreadcrumb,
  type MotionBreadcrumbItem,
} from "@/components/ui/motion-breadcrumb";

const topLevel: Record<
  string,
  {
    label: string;
    href: string;
    icon: MotionBreadcrumbItem["icon"];
  }
> = {
  builder: { label: "Builder", href: "/builder", icon: Sparkles },
  cv: { label: "CVs", href: "/cv", icon: FileText },
  evidence: { label: "Evidence Bank", href: "/evidence", icon: FileCheck2 },
  experiences: { label: "Experiences", href: "/experiences", icon: Briefcase },
  "job-targets": { label: "Job Targets", href: "/job-targets", icon: Target },
  practice: { label: "Practice", href: "/practice", icon: BookOpenCheck },
  settings: { label: "Settings", href: "/settings", icon: Settings },
};

function titleForPath(parts: string[]) {
  const [section, , nested] = parts;

  if (section === "cv") return nested ? "CV" : "Uploaded CV";
  if (section === "evidence" && parts[1] === "interview") {
    return "Guided interview";
  }
  if (section === "evidence") return "Evidence card";
  if (section === "experiences") return parts[1] === "new" ? "New experience" : "Experience";
  if (section === "job-targets") return nested === "prep" ? "Prep pack" : "Job target";
  if (section === "practice") {
    if (nested === "feedback") return "Feedback";
    if (nested === "compare") return "Compare attempts";
    return "Session";
  }

  return "Detail";
}

function itemsForPath(pathname: string): MotionBreadcrumbItem[] {
  const parts = pathname.split("/").filter(Boolean);
  const section = parts[0];
  if (!section || parts.length <= 1) return [];

  const parent = topLevel[section];
  if (!parent) return [];

  if (section === "evidence" && parts[1] === "interview") {
    return [
      { id: section, label: parent.label, href: parent.href, icon: parent.icon },
      {
        id: "evidence-interview",
        label: titleForPath(parts),
      },
    ];
  }

  if (section === "job-targets" && parts.length >= 3) {
    return [
      { id: section, label: parent.label, href: parent.href, icon: parent.icon },
      {
        id: `${section}-${parts[1]}`,
        label: "Job target",
        href: `/job-targets/${parts[1]}`,
      },
      {
        id: pathname,
        label: titleForPath(parts),
      },
    ];
  }

  if (section === "practice" && parts.length >= 3) {
    return [
      { id: section, label: parent.label, href: parent.href, icon: parent.icon },
      {
        id: `${section}-${parts[1]}`,
        label: "Session",
        href: `/practice/${parts[1]}`,
      },
      {
        id: pathname,
        label: titleForPath(parts),
      },
    ];
  }

  return [
    { id: section, label: parent.label, href: parent.href, icon: parent.icon },
    {
      id: pathname,
      label: titleForPath(parts),
    },
  ];
}

export function AppBreadcrumbs() {
  const pathname = usePathname();
  const items = itemsForPath(pathname);

  if (items.length === 0) return null;

  return (
    <MotionBreadcrumb
      items={items}
      linkComponent={Link}
      maxItems={4}
      className="mb-4"
      listClassName="text-stone-500"
      currentClassName="text-teal-950"
    />
  );
}
