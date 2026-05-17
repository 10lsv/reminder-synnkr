import { createReminder } from "@/app/actions/reminders";
import { ReminderForm } from "@/components/features/ReminderForm";
import { createClient } from "@/lib/supabase/server";

export default async function NouveauRappelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("circle_id")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10 pb-32">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-fg">Nouveau rappel</h1>
        <p className="text-sm text-fg-secondary">
          Écris-toi un message. Ton toi du futur le lira.
        </p>
      </header>

      <ReminderForm
        action={createReminder}
        hasCircle={Boolean(profile?.circle_id)}
        submitLabel="Programmer"
      />
    </main>
  );
}
