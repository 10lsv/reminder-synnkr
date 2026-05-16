import { SectionLabel } from "@/components/ui/SectionLabel";
import { formatRelative } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

function extractFirstName(email: string | undefined): string {
  if (!email) return "";
  const slug = email.split("@")[0] ?? "";
  if (!slug) return "";
  return slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const firstName = extractFirstName(user?.email);

  const { data: excuses } = await supabase
    .from("snooze_reasons")
    .select("id, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-10 pb-32">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-fg">Bonjour {firstName}</h1>
        <p className="text-sm text-fg-secondary">
          Page d&apos;accueil placeholder — le dashboard arrive bientôt.
        </p>
      </header>

      {excuses && excuses.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionLabel withDot>Tes excuses</SectionLabel>
          <ul className="flex flex-col gap-3">
            {excuses.map((excuse) => (
              <li key={excuse.id} className="flex flex-col gap-1">
                <p className="text-base italic text-fg-secondary">
                  « {excuse.reason} »
                </p>
                {excuse.created_at && (
                  <p className="text-xs text-fg-tertiary">
                    {formatRelative(excuse.created_at)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
