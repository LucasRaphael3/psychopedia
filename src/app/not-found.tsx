import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-accent">404</p>
      <h1 className="mt-2 font-serif text-4xl font-bold">Página não encontrada</h1>
      <p className="mt-4 text-muted">O conteúdo que você procura não existe ou foi removido.</p>
      <Link href="/" className="mt-8 inline-block rounded-full bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-strong">
        Voltar ao início
      </Link>
    </div>
  );
}
