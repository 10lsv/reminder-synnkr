import Link from "next/link";
import { AcceptInviteForm } from "@/components/features/AcceptInviteForm";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AssocierPage({ searchParams }: PageProps) {
  const { token: rawToken } = await searchParams;
  const token = rawToken?.trim() ?? "";

  if (!token) {
    return (
      <main className="mx-auto flex max-w-sm flex-col items-center gap-6 px-6 py-24 text-center pb-32">
        <SectionLabel withDot>Lien invalide</SectionLabel>
        <p className="text-base text-fg-secondary">
          Ce lien d&apos;invitation est vide ou mal formé.
        </p>
        <Link
          href="/reglages"
          className="text-sm text-fg-secondary underline-offset-4 hover:underline"
        >
          Aller dans Réglages
        </Link>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("circle_id")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  // Si l'user est déjà dans un cercle, on l'avertit avant de remplacer.
  const alreadyInCircle = Boolean(profile?.circle_id);

  return (
    <main className="mx-auto flex max-w-sm flex-col items-center gap-8 px-6 py-16 text-center pb-32">
      <SectionLabel withDot>Invitation</SectionLabel>
      <h1 className="text-2xl font-bold text-fg">Rejoindre un cercle</h1>
      <p className="text-base text-fg-secondary">
        Tu vas être associé à un autre utilisateur. Vous partagerez les rappels
        marqués « commun ».
      </p>
      {alreadyInCircle && (
        <p className="text-sm text-danger">
          Tu fais déjà partie d&apos;un cercle. Accepter cette invitation te
          basculera dans le nouveau.
        </p>
      )}
      <AcceptInviteForm token={token} />
    </main>
  );
}
