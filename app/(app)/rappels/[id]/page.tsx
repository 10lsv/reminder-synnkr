import { redirect } from "next/navigation";
import { markAsDone, updateReminder } from "@/app/actions/reminders";
import { DeleteReminderButton } from "@/components/features/DeleteReminderButton";
import { ReminderForm } from "@/components/features/ReminderForm";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { listUserCategories } from "@/lib/categories";
import { getPartner } from "@/lib/circle";
import { listModels } from "@/lib/models";
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

  const [partner, existingCategories, models] = await Promise.all([
    getPartner(supabase, user.id),
    listUserCategories(supabase),
    listModels(supabase, { includeInactive: true }),
  ]);

  const boundUpdate = updateReminder.bind(null, id);

  return (
    <div className="space-y-5">
      <header className="space-y-1 pt-2">
        <h1 className="text-2xl font-medium tracking-tight">Modifier</h1>
        <p className="text-sm text-muted-foreground">
          Ajuste ton rappel — ce qui change s&apos;applique immédiatement.
        </p>
      </header>

      <Card>
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
            currentUserId={user.id}
            models={models}
            existingCategories={existingCategories}
            initialData={{
              message: reminder.message,
              scheduledAt: reminder.scheduled_at,
              recurrence: toRecurrence(reminder.recurrence),
              category: reminder.category,
              scope: reminder.circle_id ? "shared" : "personal",
              priority: toPriority(reminder.priority),
              modelId: reminder.model_id,
              assignedTo: reminder.assigned_to,
            }}
            submitLabel="Enregistrer"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          {reminder.status === "pending" ? (
            <form action={markAsDone.bind(null, id)}>
              <Button type="submit" variant="primary" size="sm">
                Marquer comme fait
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ce rappel est déjà marqué fait.
            </p>
          )}
          <DeleteReminderButton id={id} />
        </CardContent>
      </Card>
    </div>
  );
}
