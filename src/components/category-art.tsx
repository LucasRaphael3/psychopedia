import { cn } from "@/lib/utils";

const ART: Record<string, { from: string; to: string; glyph: string }> = {
  ansiedade: { from: "#2f5d8a", to: "#7fb3d5", glyph: "M8 40 Q20 10 32 40 T56 40" },
  depressao: { from: "#3d3a6b", to: "#8c86c4", glyph: "M32 12 A20 20 0 1 0 52 32 A14 14 0 1 1 32 12" },
  relacionamentos: { from: "#a8432f", to: "#f0a08a", glyph: "M16 26 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M32 38 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0" },
  personalidade: { from: "#6b4c9a", to: "#c3a6e0", glyph: "M12 32 h40 M32 12 v40 M18 18 l28 28" },
  neurociencia: { from: "#22605a", to: "#7cc4b6", glyph: "M14 32 C14 18 50 18 50 32 C50 46 14 46 14 32 M32 18 v28" },
  "crescimento-pessoal": { from: "#2f6f3e", to: "#9dd39f", glyph: "M32 54 V22 M32 30 Q20 26 18 14 M32 36 Q44 32 46 20" },
  familia: { from: "#a0672b", to: "#f1c78c", glyph: "M12 50 V30 L32 14 L52 30 V50 Z" },
  trabalho: { from: "#30475e", to: "#9fb3c8", glyph: "M14 24 h36 v24 h-36 Z M26 24 v-6 h12 v6" },
};

export function CategoryArt({ category, className }: { category: string; className?: string }) {
  const art = ART[category] ?? ART.ansiedade;
  return (
    <div
      aria-hidden="true"
      className={cn("relative overflow-hidden rounded", className)}
      style={{ background: `linear-gradient(135deg, ${art.from}, ${art.to})` }}
    >
      <svg viewBox="0 0 64 64" className="absolute inset-0 m-auto h-3/5 w-3/5 opacity-40">
        <path d={art.glyph} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
