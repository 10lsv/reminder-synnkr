import { SectionLabel } from "@/components/ui/SectionLabel";

export default function StatsPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-24 text-center pb-32">
      <SectionLabel withDot>Stats</SectionLabel>
      <p className="text-2xl font-medium text-fg">Bientôt</p>
      <p className="max-w-xs text-sm text-fg-secondary">
        Compteurs et tendances sur tes rappels — à venir dans une prochaine
        version.
      </p>
    </main>
  );
}
