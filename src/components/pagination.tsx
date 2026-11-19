import Link from "next/link";
import { cn } from "@/lib/utils";

export function Pagination({ page, pages, href }: { page: number; pages: number; href: (page: number) => string }) {
  if (pages <= 1) return null;
  const numbers = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => Math.abs(n - page) <= 2 || n === 1 || n === pages);
  return (
    <nav aria-label="Paginação" className="mt-8 flex flex-wrap items-center gap-2">
      {page > 1 && <Link href={href(page - 1)} className="rounded-full px-3 py-1.5 text-sm hover:bg-brand-soft">← Anterior</Link>}
      {numbers.map((n, i) => (
        <span key={n} className="flex items-center gap-2">
          {i > 0 && n - numbers[i - 1] > 1 && <span className="text-muted">…</span>}
          <Link
            href={href(n)}
            aria-current={n === page ? "page" : undefined}
            className={cn("rounded-full px-3 py-1.5 text-sm", n === page ? "bg-brand text-white" : "hover:bg-brand-soft")}
          >
            {n}
          </Link>
        </span>
      ))}
      {page < pages && <Link href={href(page + 1)} className="rounded-full px-3 py-1.5 text-sm hover:bg-brand-soft">Próxima →</Link>}
    </nav>
  );
}

export function parsePage(value: string | string[] | undefined) {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 && n < 10_000 ? n : 1;
}

export function SectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="border-b-2 border-foreground pb-2 font-serif text-2xl font-bold">
      {children}
    </h2>
  );
}
