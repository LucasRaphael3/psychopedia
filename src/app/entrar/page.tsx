import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/auth-forms";
import { getCurrentUser } from "@/features/auth/session";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/entrar">) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center font-serif text-4xl font-bold">Entrar</h1>
      <p className="mb-8 mt-2 text-center text-muted">Bom te ver de novo.</p>
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <LoginForm next={next} />
      </div>
    </div>
  );
}
