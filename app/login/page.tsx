import { LoginForm } from "@/components/features/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col items-center px-6">
      <div className="mt-[35vh] mb-12 flex items-baseline gap-2 text-2xl">
        <span className="font-normal text-muted-foreground">Reminder</span>
        <span className="font-bold text-foreground">SYNNKR</span>
      </div>
      <LoginForm />
    </main>
  );
}
