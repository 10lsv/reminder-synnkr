import Link from "next/link";
import { LocalTime } from "@/components/features/LocalTime";
import { createClient } from "@/lib/supabase/server";

export default async function ExcusesPage() {
  const supabase = await createClient();
  const { data: excuses } = await supabase
    .from("snooze_reasons")
    .select("id, reason, created_at, reminder_id, reminders(id, message)")
    .order("created_at", { ascending: false });

  const list = excuses ?? [];

  return (
    <div className="page-enter -mx-4 divide-y divide-foreground border-y border-foreground">
      <section className="px-4 py-6">
        <p className="brand-mark text-muted-foreground">Archives</p>
        <h1 className="mt-2 text-[34px] font-medium leading-none tracking-tight">
          Tes excuses.
        </h1>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {list.length === 0
            ? "// rien à confesser"
            : `${String(list.length).padStart(2, "0")} raison${list.length > 1 ? "s" : ""} archivée${list.length > 1 ? "s" : ""}`}
        </p>
      </section>

      {list.length > 0 && (
        <section className="px-4">
          <ul className="divide-y divide-border">
            {list.map((excuse) => {
              const linkedReminder = Array.isArray(excuse.reminders)
                ? excuse.reminders[0]
                : excuse.reminders;
              return (
                <li key={excuse.id} className="py-5 first:pt-6 last:pb-6">
                  <p className="text-[15px] leading-snug italic text-foreground">
                    « {excuse.reason} »
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
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
                          className="line-clamp-1 normal-case tracking-normal hover:underline"
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
        </section>
      )}

      <section className="px-4 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground hover:underline"
        >
          ← Retour
        </Link>
      </section>
    </div>
  );
}
