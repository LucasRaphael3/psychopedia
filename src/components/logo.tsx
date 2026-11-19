import Link from "next/link";

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Psychopedia, página inicial">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <circle cx="16" cy="16" r="16" fill={inverted ? "#ffffff" : "var(--brand)"} />
        <path d="M16 7v18M10 10c0 5 2.5 7 6 7s6-2 6-7" fill="none" stroke={inverted ? "var(--brand)" : "#ffffff"} strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span className={`font-serif text-2xl font-bold tracking-tight ${inverted ? "text-white" : "text-brand"}`}>Psychopedia</span>
    </Link>
  );
}
