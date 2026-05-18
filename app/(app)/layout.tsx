import Link from "next/link";
import { redirect } from "next/navigation";
import { IOSInstallPrompt } from "@/components/features/IOSInstallPrompt";
import { NavBottom } from "@/components/ui/NavBottom";
import { createClient } from "@/lib/supabase/server";

function extractFirstName(email: string | undefined | null): string {
  if (!email) return "";
  const slug = email.split("@")[0] ?? "";
  if (!slug) return "";
  return slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const firstName = profile?.display_name ?? extractFirstName(user.email);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-foreground bg-background">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center justify-between px-4">
          <Link
            href="/"
            className="brand-mark flex items-center gap-1.5 text-foreground"
          >
            <span className="text-muted-foreground">REMINDER</span>
            <span aria-hidden>↗</span>
            <span>SYNNKR</span>
          </Link>
          {firstName && (
            <span className="brand-mark text-muted-foreground">
              {firstName.toUpperCase()}
            </span>
          )}
        </div>
      </header>

      <IOSInstallPrompt />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-24">
        {children}
      </main>

      <NavBottom />
    </div>
  );
}
