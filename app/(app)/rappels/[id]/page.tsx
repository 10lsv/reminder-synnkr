import { redirect } from "next/navigation";
import { markAsDone, updateReminder } from "@/app/actions/reminders";
import { DeleteReminderButton } from "@/components/features/DeleteReminderButton";
import { ReminderForm } from "@/components/features/ReminderForm";
import { Button } from "@/components/ui/Button";
import { listUserCategories } from "@/lib/categories";
import { getPartner } from "@/lib/circle";
import { RECURRENCE_VALUES, type Recurrence } from "@/lib/recurrence";
import { createClient } from "@/lib/supabase/server";

function toRecurrence(value: string | null | undefined): Recurrence {
  return (RECURRENCE_VALUES as readonly string[]).includes(value ?? "")
    ? (value as Recurrence)
    : "none";
}

function toPriority(
  value: string | null | undefined,
): "urgent" | "normal" | "low" {
  if (value === "urgent" || value === "low") return value;
  return "normal";
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

  if (!reminder) {
    redirect("/rappels");
  }

  const [partner, existingCategories] = await Promise.all([
    getPartner(supabase, user.id),
    listUserCategories(supabase),
  ]);

  const boundUpdate = updateReminder.bind(null, id);
  const isDone = reminder.status === "done";

  return (
    <div className="page-enter -mx-4 divide-y divide-foreground border-y border-foreground">
      <section className="px-4 py-6">
        <p className="brand-mark text-muted-foreground">Édition</p>
        <h1 className="mt-2 text-[34px] font-medium leading-none tracking-tight">
          Modifier.
        </h1>
      </section>

      <section className="px-4 py-6">
        <ReminderForm
          action={boundUpdate}
          partner={
            partner
              ? {
                  id: partner.id,
                  name: partner.display_name ?? "ton associé",
                }
              : null
          }
          existingCategories={existingCategories}
          initialData={{
            message: reminder.message,
            scheduledAt: reminder.scheduled_at,
            recurrence: toRecurrence(reminder.recurrence),
            category: reminder.category,
            scope: reminder.circle_id ? "shared" : "personal",
            priority: toPriority(reminder.priority),
          }}
          submitLabel="Enregistrer →"
        />
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 px-4 py-5">
        {isDone ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-success">
            ✓ déjà marqué fait
          </p>
        ) : (
          <form action={markAsDone.bind(null, id)}>
            <Button type="submit" variant="success" size="sm">
              ✓ Marquer fait
            </Button>
          </form>
        )}
        <DeleteReminderButton id={id} />
      </section>
    </div>
  );
}
