import { LoginForm } from "@/components/features/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col px-6">
      <header className="border-b border-foreground py-3">
        <p className="brand-mark text-foreground">
          <span className="text-muted-foreground">REMINDER</span> ↗ SYNNKR
        </p>
      </header>
      <div className="flex flex-1 flex-col justify-center py-12">
        <p className="brand-mark text-muted-foreground">Authentification</p>
        <h1 className="mt-3 mb-10 text-[34px] font-medium leading-none tracking-tight">
          Bienvenue.
        </h1>
        <LoginForm />
      </div>
    </main>
  );
}
