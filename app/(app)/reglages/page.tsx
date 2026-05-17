import { signOut } from "@/app/actions/auth";
import { NotificationsSettings } from "@/components/features/NotificationsSettings";
import { Button } from "@/components/ui/Button";
import { getPartner } from "@/lib/circle";
import { createClient } from "@/lib/supabase/server";

export default async function ReglagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const partner = user ? await getPartner(supabase, user.id) : null;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-12 px-6 py-10 pb-32">
      <div className="flex items-baseline gap-2 text-2xl">
        <span className="font-normal text-fg-tertiary">Reminder</span>
        <span className="font-bold text-fg">SYNNKR</span>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-medium text-fg">Notifications</h2>
        <NotificationsSettings />
      </section>

      {partner && (
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-medium text-fg">Associé</h2>
          <p className="text-sm text-fg-secondary">
            Tu partages tes rappels communs avec{" "}
            <span className="font-medium text-fg">
              {partner.display_name ?? "ton associé"}
            </span>
            .
          </p>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-medium text-fg">Compte</h2>
        {user?.email && (
          <p className="text-sm text-fg-secondary">{user.email}</p>
        )}
        <form action={signOut} className="w-full">
          <Button type="submit" variant="primary" fullWidth>
            Se déconnecter
          </Button>
        </form>
      </section>
    </main>
  );
}
