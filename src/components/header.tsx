import Link from "next/link";
import { logout } from "@/features/auth/actions";
import { getCurrentUser } from "@/features/auth/session";
import { countUnread } from "@/features/chat/queries";
import { CATEGORIES } from "@/lib/categories";
import { Avatar } from "./avatar";
import { Logo } from "./logo";

export async function Header() {
  const user = await getCurrentUser();
  const unread = user ? await countUnread(user.id) : 0;

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <Logo />
        <form action="/busca" role="search" className="order-last w-full sm:order-none sm:ml-auto sm:w-72">
          <label htmlFor="busca" className="sr-only">Buscar artigos</label>
          <input
            id="busca"
            name="q"
            type="search"
            placeholder="Buscar artigos…"
            className="w-full rounded-full border border-border bg-background px-4 py-2 text-sm placeholder:text-muted focus:border-brand focus:outline-none"
          />
        </form>
        <nav aria-label="Conta" className="ml-auto flex items-center gap-2 sm:ml-0">
          {user ? (
            <>
              <Link href="/publicar" className="hidden rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 sm:inline-block">
                Publicar
              </Link>
              <Link href="/mensagens" className="relative rounded-full px-3 py-2 text-sm font-medium text-foreground hover:bg-brand-soft">
                Mensagens
                {unread > 0 && (
                  <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-white">
                    {unread > 99 ? "99+" : unread}
                    <span className="sr-only"> não lidas</span>
                  </span>
                )}
              </Link>
              <details className="relative">
                <summary className="flex cursor-pointer list-none items-center rounded-full" aria-label="Menu da conta">
                  <Avatar name={user.name} seed={user.username} size="sm" />
                </summary>
                <div className="absolute right-0 z-20 mt-2 w-52 rounded-lg border border-border bg-surface py-2 shadow-lg">
                  <p className="truncate px-4 pb-2 text-sm font-semibold">{user.name}</p>
                  <Link href={`/autores/${user.username}`} className="block px-4 py-2 text-sm hover:bg-brand-soft">Meu perfil</Link>
                  <Link href="/publicar" className="block px-4 py-2 text-sm hover:bg-brand-soft">Publicar artigo</Link>
                  <form action={logout}>
                    <button type="submit" className="block w-full px-4 py-2 text-left text-sm hover:bg-brand-soft">Sair</button>
                  </form>
                </div>
              </details>
            </>
          ) : (
            <>
              <Link href="/entrar" className="rounded-full px-4 py-2 text-sm font-medium hover:bg-brand-soft">Entrar</Link>
              <Link href="/cadastro" className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong">Cadastre-se</Link>
            </>
          )}
        </nav>
      </div>
      <nav aria-label="Categorias" className="bg-brand">
        <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 text-sm font-medium text-white/90">
          {CATEGORIES.map((c) => (
            <li key={c.slug} className="shrink-0">
              <Link href={`/categorias/${c.slug}`} className="block px-3 py-2.5 hover:bg-white/10 hover:text-white">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
