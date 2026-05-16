import { redirect } from "next/navigation";
import { IOSInstallPrompt } from "@/components/features/IOSInstallPrompt";
import { NavBottom } from "@/components/ui/NavBottom";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <IOSInstallPrompt />
      {children}
      <NavBottom />
    </>
  );
}
