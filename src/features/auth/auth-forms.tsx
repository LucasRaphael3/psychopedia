"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form-fields";
import { login, signup } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage message={state?.message} />
      <input type="hidden" name="next" value={next ?? "/"} />
      <Field name="email" label="E-mail" type="email" autoComplete="email" required defaultValue={state?.values?.email} errors={state?.errors?.email} />
      <Field name="password" label="Senha" type="password" autoComplete="current-password" required errors={state?.errors?.password} />
      <SubmitButton pendingText="Entrando…">Entrar</SubmitButton>
      <p className="text-center text-sm text-muted">
        Ainda não tem conta? <Link href="/cadastro" className="font-semibold text-brand hover:underline">Cadastre-se</Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const [state, action] = useActionState(signup, undefined);
  const v = state?.values;
  const e = state?.errors;
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage message={state?.message} />
      <Field name="name" label="Nome" autoComplete="name" required defaultValue={v?.name} errors={e?.name} />
      <Field name="username" label="Nome de usuário" autoComplete="username" required defaultValue={v?.username} errors={e?.username} hint="Aparece no seu perfil: psychopedia/autores/usuario" />
      <Field name="email" label="E-mail" type="email" autoComplete="email" required defaultValue={v?.email} errors={e?.email} />
      <Field name="password" label="Senha" type="password" autoComplete="new-password" required minLength={8} errors={e?.password} hint="Mínimo de 8 caracteres." />
      <SubmitButton pendingText="Criando conta…">Criar conta</SubmitButton>
      <p className="text-center text-sm text-muted">
        Já tem conta? <Link href="/entrar" className="font-semibold text-brand hover:underline">Entrar</Link>
      </p>
    </form>
  );
}
