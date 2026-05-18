import Link from "next/link";
import { redirect } from "next/navigation";
import { ActiveReminderActions } from "@/components/features/ActiveReminderActions";
import { LocalTime } from "@/components/features/LocalTime";
import { createClient } from "@/lib/supabase/server";

export default async function ActiveReminderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: reminder } = await supabase
    .from("reminders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!reminder) {
    redirect("/");
  }

  if (reminder.status === "done") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background px-6 text-center animate-fade-in">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Reminder · <LocalTime iso={reminder.scheduled_at} mode="time" />
        </p>
        <p className="text-lg text-muted-foreground">
          ✓ déjà marqué fait.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 border border-foreground bg-foreground px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-background hover:bg-background hover:text-foreground transition-colors"
        >
          Retour
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-fade-in">
      <header className="flex items-center justify-between border-b border-foreground px-4 py-3">
        <span className="brand-mark text-muted-foreground">REMINDER ↗ SYNNKR</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <LocalTime iso={reminder.scheduled_at} mode="time" />
        </span>
      </header>

      <div className="flex flex-1 flex-col justify-center px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-destructive animate-pulse-dot">
          ● actif
        </p>
        <p className="mt-4 text-[34px] font-medium leading-tight tracking-tight text-foreground animate-fade-in-up">
          {reminder.message}
        </p>
      </div>

      <div className="border-t border-foreground px-4 py-4">
        <ActiveReminderActions id={reminder.id} />
      </div>
    </div>
  );
}

