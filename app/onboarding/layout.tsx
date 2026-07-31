import { AppNav } from "@/components/app-nav";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
