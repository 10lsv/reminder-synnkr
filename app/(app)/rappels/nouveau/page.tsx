import { redirect } from "next/navigation";
import { createReminder } from "@/app/actions/reminders";
import { ReminderForm } from "@/components/features/ReminderForm";
import { Card, CardContent } from "@/components/ui/Card";
import { listUserCategories } from "@/lib/categories";
import { getPartner } from "@/lib/circle";
import { createClient } from "@/lib/supabase/server";

export default async function NouveauRappelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [partner, existingCategories] = await Promise.all([
    getPartner(supabase, user.id),
    listUserCategories(supabase),
  ]);

  return (
    <div className="space-y-6">
      <header className="space-y-1 pt-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Programmer
        </p>
        <h1 className="text-[26px] font-medium tracking-tight">Nouveau rappel</h1>
        <p className="text-sm text-muted-foreground">
          Écris-toi un message. Ton toi du futur le lira.
        </p>
      </header>

      <Card padding="lg">
        <CardContent>
          <ReminderForm
            action={createReminder}
            partner={
              partner
                ? {
                    id: partner.id,
                    name: partner.display_name ?? "ton associé",
                  }
                : null
            }
            existingCategories={existingCategories}
            submitLabel="Programmer"
          />
        </CardContent>
      </Card>
    </div>
  );
}
