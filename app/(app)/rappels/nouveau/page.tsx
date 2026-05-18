import { redirect } from "next/navigation";
import { createReminder } from "@/app/actions/reminders";
import { ReminderForm } from "@/components/features/ReminderForm";
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
    <div className="page-enter -mx-4 divide-y divide-foreground border-y border-foreground">
      <section className="px-4 py-6">
        <p className="brand-mark text-muted-foreground">Programmer</p>
        <h1 className="mt-2 text-[34px] font-medium leading-none tracking-tight">
          Nouveau rappel.
        </h1>
      </section>

      <section className="px-4 py-6">
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
          submitLabel="Programmer →"
        />
      </section>
    </div>
  );
}
