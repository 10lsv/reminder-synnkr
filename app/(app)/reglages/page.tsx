import { signOut } from "@/app/actions/auth";
import { NotificationsSettings } from "@/components/features/NotificationsSettings";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getPartner } from "@/lib/circle";
import { createClient } from "@/lib/supabase/server";

export default async function ReglagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const partner = user ? await getPartner(supabase, user.id) : null;

  return (
    <div className="space-y-5">
      <header className="space-y-1 pt-2">
        <h1 className="text-2xl font-medium tracking-tight">Réglages</h1>
        <p className="text-sm text-muted-foreground">
          Notifications, associé et compte.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationsSettings />
        </CardContent>
      </Card>

      {partner && (
        <Card>
          <CardHeader>
            <CardTitle>Associé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">
              Tu partages tes rappels communs avec{" "}
              <span className="font-medium">
                {partner.display_name ?? "ton associé"}
              </span>
              .
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Compte</CardTitle>
        </CardHeader>
        <CardContent>
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
