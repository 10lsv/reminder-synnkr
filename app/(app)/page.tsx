import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
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
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10 pb-32">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-fg">Bonjour {firstName}</h1>
        <p className="text-sm text-fg-secondary">
          Page d&apos;accueil placeholder — le dashboard arrive en Phase 4.
        </p>
      </header>

      <form action={signOut}>
        <Button type="submit" variant="secondary">
          Se déconnecter
        </Button>
      </form>
    </main>
  );
}
