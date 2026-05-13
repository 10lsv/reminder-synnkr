import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Textarea } from "@/components/ui/Textarea";

export default function DevPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-12 px-6 py-10 pb-32">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-fg">Design system — /dev</h1>
        <p className="text-sm text-fg-secondary">
          Showcase Phase 2. Page temporaire, sera supprimée plus tard.
        </p>
      </header>

      {/* SectionLabel */}
      <section className="flex flex-col gap-4">
        <SectionLabel withDot>Section Label</SectionLabel>
        <div className="flex flex-col gap-3">
          <SectionLabel>Sans point</SectionLabel>
          <SectionLabel withDot>Avec point accent</SectionLabel>
        </div>
      </section>

      {/* Card */}
      <section className="flex flex-col gap-4">
        <SectionLabel withDot>Card</SectionLabel>
        <Card>
          <p className="text-base text-fg">
            Padding par défaut (24px). Border 1px, radius 16px, aucune ombre.
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-base text-fg">Padding sm (16px).</p>
        </Card>
        <Card padding="lg">
          <p className="text-base text-fg">Padding lg (32px).</p>
        </Card>
      </section>

      {/* Button variants */}
      <section className="flex flex-col gap-6">
        <SectionLabel withDot>Button — variants</SectionLabel>
        <div className="flex flex-col items-start gap-3">
          <Button variant="primary">Primary CTA</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Supprimer</Button>
        </div>

        <SectionLabel>Button — sizes</SectionLabel>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="default">
            Default
          </Button>
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="secondary" size="sm">
            Lien secondaire sm
          </Button>
        </div>

        <SectionLabel>Button — states</SectionLabel>
        <div className="flex flex-col gap-3">
          <Button variant="primary" disabled>
            Disabled
          </Button>
          <Button variant="primary" fullWidth>
            Full width
          </Button>
        </div>
      </section>

      {/* Input */}
      <section className="flex flex-col gap-4">
        <SectionLabel withDot>Input</SectionLabel>
        <Input label="Email" type="email" placeholder="toi@exemple.com" />
        <Input placeholder="Sans label, juste un placeholder" />
        <Input
          label="Avec erreur"
          placeholder="..."
          defaultValue="valeur invalide"
          error="Cette valeur n'est pas valide."
        />
      </section>

      {/* Textarea */}
      <section className="flex flex-col gap-4">
        <SectionLabel withDot>Textarea</SectionLabel>
        <Textarea
          label="Message à toi-même"
          placeholder="Léo, t'avais promis..."
        />
        <Textarea
          label="Avec erreur"
          placeholder="..."
          error="Minimum 10 caractères."
        />
      </section>

      {/* NavBottom note */}
      <section className="flex flex-col gap-4">
        <SectionLabel withDot>NavBottom</SectionLabel>
        <p className="text-sm text-fg-secondary">
          Désormais fournie par le layout <code>(app)</code>. Visible en bas de
          cette page. L&apos;item actif (cercle violet pâle) correspond au
          pathname courant.
        </p>
      </section>
    </main>
  );
}
