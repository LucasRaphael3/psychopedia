# Qualidade

| Comando | O que prova | Quando rodar |
|---|---|---|
| `pnpm lint` | Presets Next/TS, limite de 350 linhas, sem `console` em `src/`, nenhum `.tsx` em `app/` ou `components/` importando `@/db`, e `update`/`delete` do Drizzle com `where` | Sempre |
| `pnpm lint:typed` | Ausência de promises flutuantes ou mal usadas (lint com tipos) | Antes de entregar |
| `pnpm lint:rules` | As regras locais de ESLint funcionam (autoteste) | Ao mexer em `eslint-rules/` |
| `pnpm typecheck` | Tipos de rotas (`next typegen`) e `tsc` estrito | Sempre |
| `pnpm test` | Vitest (Node): validação de env sem vazar valores, redação do logger, ciclo do pool, schemas Zod de auth, artigos e chat, slug, formatação e `safeNext` | Sempre |
| `pnpm build` | Compilação de produção sem banco | Antes de entregar |
| `pnpm check` | Todos os anteriores em sequência | Antes de commit/PR |

## O que não é coberto

- Não há testes de integração com banco real: queries, actions e o fluxo de chat são validados manualmente com um banco Supabase configurado.
- Não há testes de UI/E2E. Eles devem ser adicionados (Playwright) quando os fluxos estabilizarem.
- Não há rate limiting nem testes de carga.

## Revisão de segurança

Para revisar o repositório ou um diff, use o prompt de segurança do toolkit (`docs/prompts/13-security-review.md` em github.com/soumatheusgomes/vibe-coding-toolkit, revisão `7ef68dd`). Mantenha os relatórios privados (fora do git) e foque nas fronteiras de confiança: sessão, autorização do chat, redirecionamento pós-login e RLS no Supabase.
