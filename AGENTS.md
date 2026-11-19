<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Psychopedia

## Produto e stack

- Escopo: `PRODUCT.md`. Estrutura e decisões: `docs/architecture.md`. Evidências de setup: `docs/setup.md`.
- Stack: Next.js 16.4 (App Router, Turbopack), React 19.3, TypeScript 5 estrito, Tailwind 4, Drizzle ORM com PostgreSQL (Supabase) e driver `pg`, Zod 4, Pino, Vitest, Node 22 e pnpm 10.

## Comandos

- Instalar: `pnpm install`
- Desenvolver: `pnpm dev`
- Lint: `pnpm lint` · lint tipado: `pnpm lint:typed` · regras locais: `pnpm lint:rules`
- Tipos: `pnpm typecheck`
- Testes: `pnpm test`
- Build: `pnpm build`
- Verificação completa: `pnpm check` (não conecta ao banco)
- SQL: `pnpm db:generate` (sem conexão) · aplicar: `pnpm db:migrate` (requer `DATABASE_URL`) · demo: `pnpm db:seed`

## Acordos de trabalho

- Leia o código e as instruções relevantes antes de editar. Faça a menor mudança suficiente e reaproveite os padrões existentes.
- Rode as verificações adequadas e não apresente integrações pendentes como se funcionassem.
- Publicar, enviar mensagens a terceiros, gerar custos e executar ações destrutivas (incluindo migrações em banco remoto) exigem autorização.

## Padrões

- Dados: o schema fica em `src/db/schema/`, o SQL versionado em `drizzle/` e a conexão única em `src/db/index.ts` (`getDb()`, pool lazy). Gere o SQL, revise e só então aplique. Nunca migre durante build ou request.
- **Supabase:** toda tabela nova usa `.enableRLS()`, para que a Data API pública não exponha dados. O app conecta com um papel privilegiado.
- Acesso a dados só em `src/features/*/queries.ts` e `actions.ts`. Páginas e componentes `.tsx` não importam `@/db` (regra `quality/no-direct-data-access`).
- Valide toda entrada com Zod. Projeções explícitas, listagens limitadas e DTOs sem `password_hash`.
- Autorização sempre no servidor: `getCurrentUser()`/`requireUser()` e `getConversationForUser()` para o chat.
- Logs com `logger` (Pino, só no servidor), sem senhas, tokens, cookies ou corpos completos.
- Limite de 350 linhas por arquivo. Atualize o documento responsável junto com a mudança.

## Convenções

- Rotas e textos em pt-BR (`/artigos`, `/categorias`, `/autores`, `/mensagens`, `/entrar`, `/cadastro`, `/publicar`, `/busca`).
- Cada feature fica em `src/features/<nome>/` com `schemas.ts` (Zod, testável), `queries.ts` (server-only), `actions.ts` (Server Actions) e os formulários client da própria feature.
- Os componentes visuais compartilhados ficam em `src/components/`, e os tokens de cor em `src/app/globals.css` (`--brand`, `--accent`…).
