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

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-2 px-6 py-10 pb-32">
      <h1 className="text-2xl font-bold text-fg">Bonjour {firstName}</h1>
      <p className="text-sm text-fg-secondary">
        Page d&apos;accueil placeholder — le dashboard arrive bientôt.
      </p>
    </main>
  );
}
