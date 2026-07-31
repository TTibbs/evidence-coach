"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  AiMagicIcon,
  BookOpenCheckIcon,
  Briefcase02Icon,
  DashboardSpeed01Icon,
  FileEditIcon,
  FileVerifiedIcon,
  Logout03Icon,
  PencilEdit01Icon,
  Settings02Icon,
  Target02Icon,
} from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

type MatchStrategy = "exact" | "prefix";

type NavItem = {
  href: string;
  label: string;
  icon: IconSvgElement;
  description?: string;
  badge?: string;
  disabled?: boolean;
  match?: MatchStrategy;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Prepare",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: DashboardSpeed01Icon,
        description: "Next action and progress",
        match: "exact",
      },
      {
        href: "/job-targets",
        label: "Job Targets",
        icon: Target02Icon,
        description: "Role requirements and gaps",
        match: "prefix",
      },
      {
        href: "/practice",
        label: "Practice",
        icon: BookOpenCheckIcon,
        description: "Questions, attempts, feedback",
        match: "prefix",
      },
    ],
  },
  {
    label: "Evidence",
    items: [
      {
        href: "/experiences",
        label: "Experiences",
        icon: Briefcase02Icon,
        description: "Jobs, projects, education",
        match: "prefix",
      },
      {
        href: "/evidence",
        label: "Evidence Bank",
        icon: FileVerifiedIcon,
        description: "Confirmed reusable examples",
        match: "prefix",
      },
    ],
  },
  {
    label: "Create",
    items: [
      {
        href: "/builder",
        label: "Builder",
        icon: AiMagicIcon,
        description: "CV and interview content",
        match: "prefix",
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        href: "/settings",
        label: "Settings",
        icon: Settings02Icon,
        description: "Plan, data, privacy",
        match: "prefix",
      },
    ],
  },
];

const shortcutItems: NavItem[] = [
  {
    href: "/experiences",
    label: "Build evidence",
    icon: PencilEdit01Icon,
    description: "Turn experience into cards",
    match: "prefix",
  },
  {
    href: "/practice",
    label: "Practise",
    icon: BookOpenCheckIcon,
    description: "Answer and retry",
    match: "prefix",
  },
  {
    href: "/builder",
    label: "Generate content",
    icon: FileEditIcon,
    description: "Create from confirmed evidence",
    match: "prefix",
  },
];

function isActive(pathname: string, item: NavItem) {
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavMenuItem({
  item,
  pathname,
  size = "default",
}: {
  item: NavItem;
  pathname: string;
  size?: "default" | "sm" | "lg";
}) {
  const active = isActive(pathname, item);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={item.href} aria-disabled={item.disabled} />}
        isActive={active}
        size={size}
        tooltip={item.label}
        aria-current={active ? "page" : undefined}
        aria-disabled={item.disabled}
      >
        <HugeiconsIcon icon={item.icon} strokeWidth={2} />
        <span>
          <span>{item.label}</span>
          {item.description && size === "lg" && (
            <span className="block truncate text-xs font-normal text-sidebar-foreground/60">
              {item.description}
            </span>
          )}
        </span>
      </SidebarMenuButton>
      {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/dashboard" />}
              size="lg"
              tooltip="Evidence Coach"
              isActive={pathname === "/dashboard"}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <HugeiconsIcon icon={FileVerifiedIcon} strokeWidth={2} />
              </div>
              <span>
                <span className="block font-display text-base leading-none">
                  Evidence Coach
                </span>
                <span className="block truncate text-xs text-sidebar-foreground/60">
                  Prepare with proof
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Next actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {shortcutItems.map((item) => (
                <NavMenuItem
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  size="lg"
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavMenuItem
                    key={item.href}
                    item={item}
                    pathname={pathname}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Sign out">
              <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
