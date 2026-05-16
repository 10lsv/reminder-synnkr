import Link from "next/link";
import { LocalTime } from "@/components/features/LocalTime";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { createClient } from "@/lib/supabase/server";

export default async function ExcusesPage() {
  const supabase = await createClient();
  const { data: excuses } = await supabase
    .from("snooze_reasons")
    .select("id, reason, created_at, reminder_id, reminders(id, message)")
    .order("created_at", { ascending: false });

  const list = excuses ?? [];

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10 pb-32">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-fg">Tes excuses</h1>
        <p className="text-sm text-fg-secondary">
          {list.length === 0
            ? "Pas encore d'excuse — tu honores tes rappels."
            : `${list.length} raison${list.length > 1 ? "s" : ""} archivée${list.length > 1 ? "s" : ""}.`}
        </p>
      </header>

      {list.length > 0 && (
        <ul className="flex flex-col gap-6">
          {list.map((excuse) => {
            const linkedReminder = Array.isArray(excuse.reminders)
              ? excuse.reminders[0]
              : excuse.reminders;
            return (
              <li key={excuse.id} className="flex flex-col gap-1">
                <p className="text-base italic text-fg-secondary">
                  « {excuse.reason} »
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-fg-tertiary">
                  {excuse.created_at && (
                    <span>
                      <LocalTime iso={excuse.created_at} />
                    </span>
                  )}
                  {linkedReminder && (
                    <>
                      <span aria-hidden>·</span>
                      <Link
                        href={`/rappels/${linkedReminder.id}`}
                        className="line-clamp-1 underline-offset-4 hover:underline"
                      >
                        « {linkedReminder.message} »
                      </Link>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div>
        <SectionLabel>← Retour</SectionLabel>
        <Link
          href="/"
          className="mt-2 inline-block text-sm text-fg-secondary underline-offset-4 hover:underline"
        >
          Accueil
        </Link>
      </div>
    </main>
  );
}
