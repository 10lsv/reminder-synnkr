import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ActiveReminderActions } from "@/components/features/ActiveReminderActions";
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

  if (!reminder || reminder.user_id !== user.id) {
    redirect("/");
  }

  const scheduledTime = format(new Date(reminder.scheduled_at), "HH:mm");

  if (reminder.status === "done") {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 px-6 py-10 text-center">
        <p className="text-xs uppercase tracking-label text-fg-tertiary">
          Reminder · {scheduledTime}
        </p>
        <p className="text-xl text-fg-secondary">
          Ce rappel est déjà marqué fait.
        </p>
        <Link href="/" className={button({ variant: "primary" })}>
          Retour à l&apos;accueil
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 pt-10 pb-12">
      <header className="flex justify-center">
        <p className="text-xs uppercase tracking-label text-fg-tertiary">
          Reminder · {scheduledTime}
        </p>
      </header>

      <div className="flex flex-1 items-center justify-center py-12">
        <p className="text-center text-message font-medium leading-tight text-fg">
          {reminder.message}
        </p>
      </div>

      <ActiveReminderActions id={reminder.id} />
    </main>
  );
}
