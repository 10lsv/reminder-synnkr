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
    <div className="page-enter -mx-4 divide-y divide-foreground border-y border-foreground">
      <section className="px-4 py-6">
        <p className="brand-mark text-muted-foreground">Préférences</p>
        <h1 className="mt-2 text-[34px] font-medium leading-none tracking-tight">
          Réglages.
        </h1>
      </section>

      <section className="px-4 py-5">
        <p className="label-mono mb-4">Notifications</p>
        <NotificationsSettings />
      </section>

      {partner && (
        <section className="px-4 py-5">
          <p className="label-mono mb-4">Associé</p>
          <div className="flex items-center gap-4">
            <div className="flex size-10 items-center justify-center border border-foreground bg-foreground font-mono text-sm font-medium text-background">
              {(partner.display_name ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-medium">
                {partner.display_name ?? "Ton associé"}
              </p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                Partage actif
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="px-4 py-5">
        <p className="label-mono mb-4">Compte</p>
        {user?.email && (
          <p className="mb-4 font-mono text-[12px] text-muted-foreground">
            {user.email}
          </p>
        )}
        <form action={signOut} className="w-full">
          <Button type="submit" variant="danger" fullWidth size="sm">
            Se déconnecter
          </Button>
        </form>
      </section>
    </div>
  );
}
