"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/experiences", label: "Experiences" },
  { href: "/evidence", label: "Evidence Bank" },
  { href: "/builder", label: "Builder" },
  { href: "/practice", label: "Practice" },
  { href: "/job-targets", label: "Job Targets" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className="font-display text-xl text-teal-900">
            Evidence Coach
          </Link>
          <Button variant="ghost" size="sm" className="sm:hidden" onClick={signOut}>
            Sign out
          </Button>
        </div>
        <nav className="flex flex-wrap items-center gap-1" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                pathname.startsWith(link.href) && "bg-teal-50 font-medium text-teal-900",
              )}
            >
              {link.label}
            </Link>
          ))}
          <Button variant="ghost" size="sm" className="ml-2 hidden sm:inline-flex" onClick={signOut}>
            Sign out
          </Button>
        </nav>
      </div>
    </header>
  );
}
