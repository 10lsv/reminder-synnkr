import { redirect } from "next/navigation";
import { markAsDone, updateReminder } from "@/app/actions/reminders";
import { DeleteReminderButton } from "@/components/features/DeleteReminderButton";
import { ReminderForm } from "@/components/features/ReminderForm";
import { Button } from "@/components/ui/Button";
import { RECURRENCE_VALUES, type Recurrence } from "@/lib/recurrence";
import { createClient } from "@/lib/supabase/server";

function toRecurrence(value: string | null | undefined): Recurrence {
  return (RECURRENCE_VALUES as readonly string[]).includes(value ?? "")
    ? (value as Recurrence)
    : "none";
}

export default async function RappelDetailPage({
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
    redirect("/rappels");
  }

  const boundUpdate = updateReminder.bind(null, id);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10 pb-32">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-fg">Modifier</h1>
      </header>

      <ReminderForm
        action={boundUpdate}
        initialData={{
          message: reminder.message,
          // ISO brut — le form le convertit en local côté client (TZ correcte).
          scheduledAt: reminder.scheduled_at,
          recurrence: toRecurrence(reminder.recurrence),
          category: reminder.category,
        }}
        submitLabel="Enregistrer"
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
        {reminder.status === "pending" ? (
          <form action={markAsDone.bind(null, id)}>
            <Button type="submit" variant="primary" size="sm">
              Marquer comme fait
            </Button>
          </form>
        ) : (
          <p className="text-sm text-fg-tertiary">
            Ce rappel est déjà marqué fait.
          </p>
        )}
        <DeleteReminderButton id={id} />
      </div>
    </main>
  );
}
