import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

const COLORS = ["bg-[#1d3a6e]", "bg-[#c2492f]", "bg-[#2f6f5e]", "bg-[#6b4c9a]", "bg-[#a0672b]", "bg-[#336b8f]"];

function colorFor(seed: string) {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

export function Avatar({ name, seed, size = "md" }: { name: string; seed?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-11 w-11 text-sm", lg: "h-20 w-20 text-2xl" };
  return (
    <span aria-hidden="true" className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white", sizes[size], colorFor(seed ?? name))}>
      {initials(name)}
    </span>
  );
}
