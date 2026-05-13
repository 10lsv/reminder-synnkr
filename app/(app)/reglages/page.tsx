import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";

export default function ReglagesPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col items-center justify-center gap-12 px-6 pb-32">
      <div className="flex items-baseline gap-2 text-2xl">
        <span className="font-normal text-fg-tertiary">Reminder</span>
        <span className="font-bold text-fg">SYNNKR</span>
      </div>
      <form action={signOut} className="w-full">
        <Button type="submit" variant="primary" fullWidth>
          Se déconnecter
        </Button>
      </form>
    </main>
  );
}
