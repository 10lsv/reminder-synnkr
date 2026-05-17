import Link from "next/link";
import { LocalTime } from "@/components/features/LocalTime";
import { Card, CardContent } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";

export default async function ExcusesPage() {
  const supabase = await createClient();
  const { data: excuses } = await supabase
    .from("snooze_reasons")
    .select("id, reason, created_at, reminder_id, reminders(id, message)")
    .order("created_at", { ascending: false });

  const list = excuses ?? [];

  return (
    <div className="space-y-5">
      <header className="space-y-1 pt-2">
        <h1 className="text-2xl font-medium tracking-tight">Tes excuses</h1>
        <p className="text-sm text-muted-foreground">
          {list.length === 0
            ? "Pas encore d'excuse — tu honores tes rappels."
            : `${list.length} raison${list.length > 1 ? "s" : ""} archivée${list.length > 1 ? "s" : ""}.`}
        </p>
      </header>

      {list.length > 0 ? (
        <Card>
          <CardContent>
            <ul className="space-y-4">
              {list.map((excuse) => {
                const linkedReminder = Array.isArray(excuse.reminders)
                  ? excuse.reminders[0]
                  : excuse.reminders;
                return (
                  <li
                    key={excuse.id}
                    className="space-y-1 border-b border-border/60 pb-4 last:border-b-0 last:pb-0"
                  >
                    <p className="text-sm italic text-foreground">
                      « {excuse.reason} »
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
          </CardContent>
        </Card>
      ) : null}

      <Link
        href="/"
        className="inline-block text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Retour à l&apos;accueil
      </Link>
    </div>
  );
}
