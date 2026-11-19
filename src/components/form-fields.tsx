"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

type FieldProps = {
  name: string;
  label: string;
  errors?: string[];
  hint?: string;
  textarea?: boolean;
  rows?: number;
} & React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Field({ name, label, errors, hint, textarea, rows, className, ...props }: FieldProps) {
  const id = `field-${name}`;
  const describedBy = [errors?.length ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  const inputClass = cn(
    "w-full rounded-lg border bg-surface px-3 py-2.5 focus:border-brand focus:outline-none",
    errors?.length ? "border-accent" : "border-border",
    className,
  );
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      {textarea ? (
        <textarea id={id} name={name} rows={rows} aria-invalid={Boolean(errors?.length)} aria-describedby={describedBy} className={inputClass} {...props} />
      ) : (
        <input id={id} name={name} aria-invalid={Boolean(errors?.length)} aria-describedby={describedBy} className={inputClass} {...props} />
      )}
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-muted">{hint}</p>}
      {errors?.length ? <p id={`${id}-error`} className="mt-1 text-sm text-accent">{errors[0]}</p> : null}
    </div>
  );
}

export function SubmitButton({ children, pendingText }: { children: React.ReactNode; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-strong disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? pendingText : children}
    </button>
  );
}

export function FormMessage({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" className="rounded-lg bg-accent-soft px-4 py-3 text-sm text-accent">{message}</p>;
}
