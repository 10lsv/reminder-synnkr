import Link from "next/link";
import { redirect } from "next/navigation";
import { IOSInstallPrompt } from "@/components/features/IOSInstallPrompt";
import { NavBottom } from "@/components/ui/NavBottom";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-baseline gap-1.5 tracking-tight">
            <span className="text-xs font-normal text-muted-foreground">
              Reminder
            </span>
            <span className="text-sm font-semibold">SYNNKR</span>
          </Link>
        </div>
      </header>

      <IOSInstallPrompt />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6">
        {children}
      </main>

      <NavBottom />
    </div>
  );
}
