"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form-fields";
import { shareArticle } from "./actions";

export function ShareForm({ slug, contacts }: { slug: string; contacts: { name: string; username: string }[] }) {
  const [state, action] = useActionState(shareArticle, undefined);
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage message={state?.message} />
      <input type="hidden" name="slug" value={slug} />
      <Field
        name="username"
        label="Enviar para (nome de usuário)"
        required
        list="contatos"
        autoComplete="off"
        defaultValue={state?.values?.username}
        errors={state?.errors?.username}
      />
      <datalist id="contatos">
        {contacts.map((c) => <option key={c.username} value={c.username}>{c.name}</option>)}
      </datalist>
      <Field name="note" label="Mensagem (opcional)" textarea rows={3} maxLength={500} defaultValue={state?.values?.note} errors={state?.errors?.note} />
      <SubmitButton pendingText="Enviando…">Enviar no chat</SubmitButton>
    </form>
  );
}
