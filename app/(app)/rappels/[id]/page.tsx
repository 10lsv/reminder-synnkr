import { redirect } from "next/navigation";
import { updateReminder } from "@/app/actions/reminders";
import { DeleteReminderButton } from "@/components/features/DeleteReminderButton";
import { ReminderForm } from "@/components/features/ReminderForm";
import { createClient } from "@/lib/supabase/server";

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
        }}
        submitLabel="Enregistrer"
      />

      <div className="mt-4 flex justify-end border-t border-border pt-6">
        <DeleteReminderButton id={id} />
      </div>
    </main>
  );
}
