import Link from "next/link";
import { redirect } from "next/navigation";
import { ActiveReminderActions } from "@/components/features/ActiveReminderActions";
import { LocalTime } from "@/components/features/LocalTime";
import { button } from "@/components/ui/Button";
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
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background px-6 text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Reminder · <LocalTime iso={reminder.scheduled_at} mode="time" />
        </p>
        <p className="text-lg text-muted-foreground">
          Ce rappel est déjà marqué fait.
        </p>
        <Link href="/" className={button({ variant: "primary" })}>
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background px-6 pt-16 pb-12">
      <header className="flex justify-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Reminder · <LocalTime iso={reminder.scheduled_at} mode="time" />
        </p>
      </header>

      <div className="flex flex-1 items-center justify-center py-12">
        <p className="text-center text-3xl font-medium leading-tight text-foreground">
          {reminder.message}
        </p>
      </div>

      <div className="mx-auto w-full max-w-sm">
        <ActiveReminderActions id={reminder.id} />
      </div>
    </div>
  );
}
