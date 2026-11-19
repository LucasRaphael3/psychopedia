import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="mt-16 bg-brand-strong text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo inverted />
          <p className="mt-4 text-sm leading-relaxed">
            Uma comunidade para ler, publicar e conversar sobre psicologia.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-white">Temas</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {CATEGORIES.slice(0, 4).map((c) => (
              <li key={c.slug}><Link href={`/categorias/${c.slug}`} className="hover:text-white">{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold text-white">Mais temas</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {CATEGORIES.slice(4).map((c) => (
              <li key={c.slug}><Link href={`/categorias/${c.slug}`} className="hover:text-white">{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold text-white">Precisa de ajuda agora?</h2>
          <p className="mt-3 text-sm leading-relaxed">
            Os artigos daqui não substituem atendimento profissional. No Brasil, o CVV atende 24h pelo número{" "}
            <a href="tel:188" className="font-semibold text-white underline">188</a> ou em{" "}
            <a href="https://cvv.org.br" className="font-semibold text-white underline" rel="noopener noreferrer" target="_blank">cvv.org.br</a>.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs">© {new Date().getFullYear()} Psychopedia</p>
      </div>
    </footer>
  );
}
