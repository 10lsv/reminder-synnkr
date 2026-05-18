import { signOut } from "@/app/actions/auth";
import { NotificationsSettings } from "@/components/features/NotificationsSettings";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { getPartner } from "@/lib/circle";
import { createClient } from "@/lib/supabase/server";

export default async function ReglagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const partner = user ? await getPartner(supabase, user.id) : null;

  return (
    <div className="page-enter space-y-6">
      <header className="space-y-1 pt-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Préférences
        </p>
        <h1 className="text-[26px] font-medium tracking-tight">Réglages</h1>
      </header>

      <Card padding="lg">
        <CardContent className="space-y-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Notifications
          </p>
          <NotificationsSettings />
        </CardContent>
      </Card>

      {partner && (
        <Card padding="lg">
          <CardContent className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Associé
            </p>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-accent/40 text-sm font-medium text-accent-foreground">
                {(partner.display_name ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 space-y-0.5">
                <p className="text-sm font-medium">
                  {partner.display_name ?? "Ton associé"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Tu partages les rappels marqués « commun ».
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card padding="lg">
        <CardContent className="space-y-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Compte
          </p>
          {user?.email && (
            <p className="text-sm text-muted-foreground">{user.email}</p>
          )}
          <form action={signOut} className="w-full">
            <Button type="submit" variant="primary" fullWidth size="sm">
              Se déconnecter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
