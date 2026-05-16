import { SectionLabel } from "@/components/ui/SectionLabel";

export default function CalendrierPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-24 text-center pb-32">
      <SectionLabel withDot>Calendrier</SectionLabel>
      <p className="text-2xl font-medium text-fg">Bientôt</p>
      <p className="max-w-xs text-sm text-fg-secondary">
        Vue calendrier de tes rappels — à venir dans une prochaine version.
      </p>
    </main>
  );
}
