# Setup: evidências

- **Data:** 2026-11-19
- **Receita:** github.com/soumatheusgomes/vibe-coding-toolkit, revisão `7ef68dd` (`docs/04-project-bootstrap.md`, `docs/06-project-defaults.md` e `templates/`)
- **Referência visual:** psychologytoday.com/us (estrutura editorial, sem reuso de marca)

## Versões

Node 22.17.1, pnpm 10.17.1, Next.js 16.4.6, React 19.3.0, Tailwind 4.3.3, drizzle-orm e drizzle-kit (ver lockfile), pg 8.23.1, zod 4.6.7, bcryptjs, pino e vitest. Os tipos `@types/node@22` estão alinhados ao runtime.

## O que foi aplicado

| Item | Estado |
|---|---|
| Scaffold `create-next-app` (App Router, TS, Tailwind, ESLint, `src/`, `@/*`, pnpm) | validado |
| `cacheComponents`/`partialPrefetching` removidos do `next.config.ts` (o toolkit recomenda começar sem) | validado (build) |
| Templates `templates/next/` (db, env, logger, utils, testes, vitest, drizzle.config) | validado (testes) |
| ESLint `next-app` + `eslint-rules/` + perfil tipado + autoteste | validado |
| Schema, migração `drizzle/0000_*.sql` (5 tabelas e RLS) | validado: aplicada no Supabase (session pooler, us-east-1); `relrowsecurity = true` nas 5 tabelas |
| Seed de demonstração | validado: 3 autores e 9 artigos |
| Fluxos via HTTP sem JS (`pnpm start`) | validado em 2026-11-19, 15/15: cadastro, duplicado rejeitado, senha errada, publicação, início de conversa, compartilhamento, não lidas, API de polling, 404 para não participante (página e API), logout invalidando o token, bloqueio de open redirect. Contas de teste removidas depois |
| Migração `drizzle/0002_*.sql` (reações, "digitando" e colunas de vídeo) | validado: aplicada no Supabase em 2026-11-20; `relrowsecurity = true` e nenhuma política nas 2 tabelas novas |
| Bucket `chat-videos` | validado: criado por `pnpm storage:setup` (privado, 50 MB, MP4/MOV/WebM) |
| Vídeo, reações e "digitando" via HTTP (`pnpm start`) | validado em 2026-11-20, 42/42: reações (adicionar, trocar, duas pessoas, remover, emoji fora do conjunto, não participante e sem login recusados), "digitando" (marca, limpa, some ao enviar, 404/401), vídeo (upload assinado, confirmação, chave reaproveitada recusada, 302 para URL assinada com 206, 404/401, falso vídeo recusado e apagado, bucket recusa HTML, limite de 50 MB). Contas e arquivos de teste removidos depois |
| Chat no navegador (Chrome headless via DevTools Protocol, duas sessões) | validado em 2026-11-20, 32/32: cadastro pelo formulário, "digitando…", aba de emojis (inserção no cursor, Esc), envio pelo Enter e recebimento por polling, reações (barra rápida, "+", troca, duas pessoas), vídeo MP4 enviado e reproduzido pelo outro lado, foto, composer em 390 e 360 px, sem erros no console. Contas e arquivos de teste removidos depois |
| Git | `git init` local, sem remoto e sem commits |

## Diferenças em relação aos padrões

- O banco é o PostgreSQL do **Supabase**, por pedido do usuário. O toolkit é agnóstico de provedor, e o RLS foi adicionado por causa da Data API do Supabase.
- A autenticação é própria: o toolkit pede para "escolher autenticação e testar autorização no servidor", e a escolha foi sessão em banco, sem dependências externas.

## Pendentes (não executados)

- Skills de agente do toolkit (Vercel skills, `next-dev-loop`, `supabase-postgres-best-practices`), Context7, Graphify, Ponytail, Caveman, Superpowers e RTK: **não instalados** neste setup.
- Avaliação de harness (prompt 15) e memória: não executadas. Este projeto usa `AGENTS.md` com `CLAUDE.md` como ponte.
- Teste de migração e dos fluxos com o banco real.
