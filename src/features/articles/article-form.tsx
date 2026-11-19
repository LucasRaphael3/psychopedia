"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form-fields";
import { CATEGORIES } from "@/lib/categories";
import { createArticle } from "./actions";

export function ArticleForm() {
  const [state, action] = useActionState(createArticle, undefined);
  const v = state?.values;
  const e = state?.errors;
  return (
    <form action={action} className="space-y-6" noValidate>
      <FormMessage message={state?.message} />
      <Field name="title" label="Título" required maxLength={140} defaultValue={v?.title} errors={e?.title} />
      <Field name="summary" label="Resumo" textarea rows={2} required maxLength={300} defaultValue={v?.summary} errors={e?.summary} hint="Uma ou duas frases que aparecem nas listagens." />
      <div>
        <label htmlFor="field-category" className="mb-1.5 block text-sm font-medium">Categoria</label>
        <select
          id="field-category"
          name="category"
          required
          defaultValue={v?.category ?? ""}
          aria-invalid={Boolean(e?.category?.length)}
          aria-describedby={e?.category?.length ? "field-category-error" : undefined}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 focus:border-brand focus:outline-none"
        >
          <option value="" disabled>Escolha um tema</option>
          {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        {e?.category?.length ? <p id="field-category-error" className="mt-1 text-sm text-accent">{e.category[0]}</p> : null}
      </div>
      <Field
        name="content"
        label="Texto do artigo"
        textarea
        rows={16}
        required
        defaultValue={v?.content}
        errors={e?.content}
        hint='Separe parágrafos com uma linha em branco. Comece uma linha com "## " para criar um subtítulo.'
      />
      <Field name="sourceUrl" label="Link da fonte (opcional)" type="url" placeholder="https://" defaultValue={v?.sourceUrl} errors={e?.sourceUrl} hint="Se você está compartilhando um texto de outro lugar, cite a fonte." />
      <SubmitButton pendingText="Publicando…">Publicar artigo</SubmitButton>
    </form>
  );
}
