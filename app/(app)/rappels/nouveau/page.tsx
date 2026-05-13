import { createReminder } from "@/app/actions/reminders";
import { ReminderForm } from "@/components/features/ReminderForm";

export default function NouveauRappelPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10 pb-32">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-fg">Nouveau rappel</h1>
        <p className="text-sm text-fg-secondary">
          Écris-toi un message. Ton toi du futur le lira.
        </p>
      </header>

      <ReminderForm action={createReminder} submitLabel="Programmer" />
    </main>
  );
}
