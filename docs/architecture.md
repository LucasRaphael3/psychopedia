# Arquitetura

## Estrutura

```text
src/
├── app/                      # rotas App Router (somente apresentação)
│   ├── page.tsx              # home: destaque, essenciais, recentes, autores
│   ├── artigos/[slug]/       # artigo e /compartilhar
│   ├── categorias/[slug]/    # listagem por tema
│   ├── autores/[username]/   # perfil + "Enviar mensagem"
│   ├── busca/, publicar/, entrar/, cadastro/
│   ├── mensagens/            # lista de conversas e /[id] (chat)
│   └── api/conversations/[id]/messages/route.ts   # polling do chat (GET)
├── components/               # UI compartilhada (header, cards, form fields…)
├── features/
│   ├── auth/                 # schemas, session (cookie + DB), actions, forms
│   ├── articles/             # schemas, queries, actions, article-form
│   ├── chat/                 # schemas, queries, actions, chat-room, share-form
│   └── users/                # perfil público
├── db/                       # getDb() + schema Drizzle
└── lib/                      # env, logger, categorias, formatação, slug, safe-next
drizzle/                      # SQL versionado (gerado por drizzle-kit)
scripts/seed.mjs              # dados de demonstração (dev)
```

## Dados

| Tabela | Papel |
|---|---|
| `users` | conta, com `username` e `email` únicos e `password_hash` (bcrypt) |
| `sessions` | `id` = SHA-256 do token do cookie, `expires_at` |
| `articles` | `slug` único, `category` (slug de `lib/categories.ts`), autor |
| `conversations` | par ordenado (`user_a_id < user_b_id`, `CHECK` + índice único), resultando numa conversa por par |
| `messages` | `body`, `article_id` opcional (artigo compartilhado) e `read_at` |

Todas as tabelas têm **RLS habilitado sem políticas**, o que bloqueia a Data API pública do Supabase (`anon` e `authenticated`). O app usa o papel `postgres` pela connection string, que ignora o RLS.

## Decisões

- **Supabase só como PostgreSQL gerenciado.** O acesso a dados passa todo pelo Drizzle no servidor, sem SDK `@supabase/*` e sem chaves públicas.
- **Autenticação própria** em vez do Supabase Auth: sessões no banco, cookie `psy_session` httpOnly, `SameSite=Lax` e `Secure` em produção. O logout remove a sessão no banco. A comparação de senha usa um hash fictício quando o e-mail não existe, para equalizar o tempo de resposta.
- **Server Actions** para cadastro, login, publicação, início de conversa, envio e compartilhamento. Os redirecionamentos pós-login só aceitam caminhos relativos (`lib/safe-next.ts`).
- **Chat por polling** (3 s, pausado com a aba oculta), usando `GET /api/conversations/:id/messages?after=ISO`. A mesma consulta marca como lidas as mensagens recebidas. O cliente deduplica por `id`. Não há WebSocket nem Supabase Realtime.
- **`cacheComponents` desligado**: todas as rotas são dinâmicas, porque o header depende do cookie em todas as páginas.
- Busca com `ILIKE` (com escape de `%` e `_`) em título e resumo. Se o volume crescer, avaliar `tsvector`/`pg_trgm`.

## Limites conhecidos

- O polling gera uma query a cada 3 s por conversa aberta.
- Não há rate limiting em login, cadastro e envio de mensagens (pendente antes de produção).
- Sessões expiradas não são limpas automaticamente (são apenas ignoradas na leitura).
