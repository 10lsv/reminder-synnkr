import { Card, CardContent } from "@/components/ui/Card";

export default function CalendrierPage() {
  return (
    <div className="space-y-5">
      <header className="space-y-1 pt-2">
        <h1 className="text-2xl font-medium tracking-tight">Calendrier</h1>
        <p className="text-sm text-muted-foreground">
          Vue mensuelle de tes rappels.
        </p>
      </header>

      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-base font-medium">Bientôt</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Vue calendrier de tes rappels — à venir dans une prochaine version.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
