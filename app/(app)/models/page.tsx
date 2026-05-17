import { redirect } from "next/navigation";
import { ModelForm } from "@/components/features/ModelForm";
import { ModelsList } from "@/components/features/ModelsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getPartner } from "@/lib/circle";
import { listModels } from "@/lib/models";
import { createClient } from "@/lib/supabase/server";

export default async function ModelsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, partner] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle(),
    getPartner(supabase, user.id),
  ]);

  const models = await listModels(supabase, { includeInactive: true });

  const owners = [
    {
      id: user.id,
      display_name: profile?.display_name ?? "Moi",
    },
    ...(partner
      ? [{ id: partner.id, display_name: partner.display_name }]
      : []),
  ];

  const active = models.filter((m) => m.status === "active");
  const paused = models.filter((m) => m.status === "paused");
  const dropped = models.filter((m) => m.status === "dropped");

  return (
    <div className="space-y-5">
      <header className="space-y-1 pt-2">
        <h1 className="text-2xl font-medium tracking-tight">Models</h1>
        <p className="text-sm text-muted-foreground">
          Vos talents et leur owner principal.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter une model</CardTitle>
        </CardHeader>
        <CardContent>
          <ModelForm owners={owners} currentUserId={user.id} />
        </CardContent>
      </Card>

      {active.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Actives ({active.length})
          </h2>
          <ModelsList
            models={active}
            owners={owners}
            currentUserId={user.id}
          />
        </section>
      )}

      {paused.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            En pause ({paused.length})
          </h2>
          <ModelsList
            models={paused}
            owners={owners}
            currentUserId={user.id}
          />
        </section>
      )}

      {dropped.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Droppées ({dropped.length})
          </h2>
          <ModelsList
            models={dropped}
            owners={owners}
            currentUserId={user.id}
          />
        </section>
      )}
    </div>
  );
}
