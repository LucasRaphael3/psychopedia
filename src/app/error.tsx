"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-serif text-3xl font-bold">Algo deu errado</h1>
      <p className="mt-4 text-muted">Não foi possível carregar esta página agora. Tente novamente em instantes.</p>
      <button type="button" onClick={reset} className="mt-8 rounded-full bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-strong">
        Tentar novamente
      </button>
    </div>
  );
}
