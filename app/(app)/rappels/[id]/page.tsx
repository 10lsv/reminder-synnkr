import { redirect } from "next/navigation";
import { markAsDone, updateReminder } from "@/app/actions/reminders";
import { DeleteReminderButton } from "@/components/features/DeleteReminderButton";
import { ReminderForm } from "@/components/features/ReminderForm";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
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
    <div className="page-enter space-y-6">
      <header className="space-y-1 pt-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Édition
        </p>
        <h1 className="text-[26px] font-medium tracking-tight">Modifier</h1>
      </header>

      <Card padding="lg">
        <CardContent>
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
            submitLabel="Enregistrer"
          />
        </CardContent>
      </Card>

      <Card padding="lg">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          {isDone ? (
            <p className="text-sm text-muted-foreground">
              Ce rappel est déjà marqué fait.
            </p>
          ) : (
            <form action={markAsDone.bind(null, id)}>
              <Button type="submit" variant="success" size="sm">
                Marquer comme fait
              </Button>
            </form>
          )}
          <DeleteReminderButton id={id} />
        </CardContent>
      </Card>
    </div>
  );
}
