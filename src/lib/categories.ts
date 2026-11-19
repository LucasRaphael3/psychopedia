export const CATEGORIES = [
  { slug: "ansiedade", name: "Ansiedade", description: "Preocupação, medo e estratégias para lidar com o estresse." },
  { slug: "depressao", name: "Depressão", description: "Humor, tristeza persistente e caminhos de cuidado." },
  { slug: "relacionamentos", name: "Relacionamentos", description: "Amor, amizade, apego e comunicação." },
  { slug: "personalidade", name: "Personalidade", description: "Traços, temperamento e diferenças individuais." },
  { slug: "neurociencia", name: "Neurociência", description: "Cérebro, comportamento e o que a pesquisa revela." },
  { slug: "crescimento-pessoal", name: "Crescimento Pessoal", description: "Hábitos, propósito e autoconhecimento." },
  { slug: "familia", name: "Família", description: "Parentalidade, infância e dinâmicas familiares." },
  { slug: "trabalho", name: "Trabalho", description: "Carreira, burnout e bem-estar profissional." },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [CategorySlug, ...CategorySlug[]];

export function getCategory(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function categoryName(slug: string) {
  return getCategory(slug)?.name ?? slug;
}
