import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

export default function CalendrierPage() {
  return (
    <div className="page-enter space-y-6">
      <header className="space-y-1 pt-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Vue mensuelle
        </p>
        <h1 className="text-[26px] font-medium tracking-tight">Calendrier</h1>
      </header>

      <Card padding="lg">
        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-accent/30">
            <Calendar className="size-5 text-accent-foreground" strokeWidth={1.8} />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium">Bientôt</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Vue calendrier de tes rappels — à venir dans une prochaine version.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
