export default function CalendrierPage() {
  return (
    <div className="page-enter -mx-4 divide-y divide-foreground border-y border-foreground">
      <section className="px-4 py-6">
        <p className="brand-mark text-muted-foreground">Vue mensuelle</p>
        <h1 className="mt-2 text-[34px] font-medium leading-none tracking-tight">
          Calendrier.
        </h1>
      </section>

      <section className="px-4 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          // soon
        </p>
        <p className="mt-3 max-w-sm text-xl font-medium leading-tight">
          Vue calendrier de tes rappels — à venir.
        </p>
      </section>
    </div>
  );
}
