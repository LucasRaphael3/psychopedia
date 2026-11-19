import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/features/auth/auth-forms";
import { getCurrentUser } from "@/features/auth/session";

export const metadata: Metadata = { title: "Cadastre-se" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center font-serif text-4xl font-bold">Crie sua conta</h1>
      <p className="mb-8 mt-2 text-center text-muted">Publique artigos e converse com outros leitores.</p>
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <SignupForm />
      </div>
    </div>
  );
}
