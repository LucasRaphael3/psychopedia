# Arquitetura

## Estrutura

```text
src/
├── app/                      # rotas App Router (somente apresentação)
│   ├── page.tsx              # home: destaque, essenciais, recentes, autores
│   ├── artigos/[id]/         # artigo (URL por id; slug antigo redireciona) e /compartilhar
│   ├── categorias/[slug]/    # listagem por tema
│   ├── autores/[username]/   # perfil + "Enviar mensagem"
│   ├── busca/ (termo via POST + cookie, fora da URL), publicar/, entrar/, cadastro/
│   ├── mensagens/            # lista de conversas e /[id] (chat)
│   └── api/
│       ├── conversations/[id]/messages/   # polling do chat (GET): mensagens, reações e "digitando"
│       ├── conversations/[id]/typing/     # "digitando" (POST marca, DELETE limpa)
│       └── chat/images/[id], chat/videos/[id]   # mídia do chat, só para participantes
├── components/               # UI compartilhada (header, cards, form fields, floating-panel…)
├── features/
│   ├── auth/                 # schemas, session (cookie + DB), actions, forms
│   ├── articles/             # schemas, queries, actions, article-form
│   ├── chat/                 # schemas, queries, actions, storage, chat-room, composer,
│   │                         # message-bubble, emoji-picker, share-form
│   └── users/                # perfil público
├── db/                       # getDb() + schema Drizzle
└── lib/                      # env, logger, categorias, formatação, slug, safe-next
drizzle/                      # SQL versionado (gerado por drizzle-kit)
scripts/seed.mjs              # dados de demonstração (dev)
scripts/setup-storage.mjs     # cria/atualiza os buckets privados do chat
```

## Dados

| Tabela | Papel |
|---|---|
| `users` | conta, com `username` e `email` únicos e `password_hash` (bcrypt) |
| `sessions` | `id` = SHA-256 do token do cookie, `expires_at` |
| `articles` | `slug` único, `category` (slug de `lib/categories.ts`), autor |
| `conversations` | par ordenado (`user_a_id < user_b_id`, `CHECK` + índice único), resultando numa conversa por par |
| `messages` | `body`, `article_id` opcional (artigo compartilhado), `image_path`/`image_width`/`image_height` opcionais (foto), `video_path` (único)/`video_width`/`video_height` opcionais (vídeo) e `read_at` |
| `message_reactions` | uma reação por pessoa por mensagem (PK `message_id, user_id`), `emoji` de um conjunto fixo |
| `typing_indicators` | último sinal de "digitando" por pessoa e conversa (PK `conversation_id, user_id`) e `typed_at` |

### Fotos no chat

- **Bucket privado** `chat-images` no Supabase Storage (4 MB, só JPEG, PNG e WebP), criado por `pnpm storage:setup`. Os objetos ficam em `<conversationId>/<uuid>.<ext>`.
- **Cliente** (`prepare-image.ts`): redimensiona para no máximo 1600 px e re-codifica em JPEG 0,85. Isso também **remove o EXIF (inclusive GPS)**.
- **Servidor** (`sendImageMessage`): exige sessão, valida o formato pelos *magic bytes* (o MIME declarado não é considerado), aplica o limite de 4 MB e confere a participação na conversa. Depois envia ao Storage com a secret key, só no servidor, e grava a mensagem. Se o insert falhar, o objeto é removido.
- **Leitura**: `GET /api/chat/images/:messageId` confere a participação e repassa o arquivo com `Cache-Control: private`, `nosniff` e CSP `default-src 'none'`. Não há URL pública nem assinada.
- O limite de body das Server Actions foi elevado para 5 MB em `next.config.ts`.

### Vídeos no chat

- **Bucket privado** `chat-videos` (50 MB; MP4, MOV e WebM), criado por `pnpm storage:setup`. Os objetos ficam em `<conversationId>/<senderId>/<uuid>.<ext>`.
- **Upload direto ao Storage.** As funções da Vercel aceitam no máximo 4,5 MB de body, então o vídeo não passa pelo app. `createVideoUpload` confere sessão, participação, tipo e tamanho e devolve uma URL de upload assinada, válida só para essa chave e sem sobrescrita. O navegador faz o `PUT` com barra de progresso e pode cancelar.
- **Confirmação** (`sendVideoMessage`): a chave precisa ser da conversa e do remetente e não pode estar em outra mensagem (índice único). O servidor lê os primeiros 16 bytes (`Range`) e confere tipo, extensão, tamanho e a assinatura do contêiner (`ftyp` para MP4/MOV, EBML para WebM). Se algo não bater, o objeto é apagado.
- **Leitura**: `GET /api/chat/videos/:messageId` confere a participação e redireciona (302) para uma URL assinada de 1 hora, que aceita `Range` para avançar e voltar. A resposta usa `Cache-Control: private, no-store` e `Referrer-Policy: no-referrer`.
- O cliente lê largura e altura com um `<video>` (`loadedmetadata`) para reservar o espaço do player. O vídeo não é re-codificado, então **os metadados (como localização) permanecem**, e a interface avisa isso antes do envio.
- `readVideoHead` não espera o `cancel()` do stream: dentro do Next, o `fetch` duplica o body (tee), e esperar o cancelamento de um dos ramos travava a requisição.

### Reações, emojis e "digitando"

- **Reações**: uma por pessoa por mensagem. O mesmo emoji de novo remove a reação, e outro emoji a substitui. O servidor só aceita emojis do conjunto de `emoji-data.ts`. A interface atualiza na hora (otimista), e o polling devolve as reações das mensagens carregadas (`since`). Um contador de versão impede que uma resposta de polling antiga desfaça uma reação recém-feita.
- **Aba de emojis**: `EmojiPicker` dentro de `FloatingPanel` (portal com posição fixa, abre acima ou abaixo do botão e fecha com Esc, clique fora ou saída do foco). O emoji entra na posição do cursor sem tirar o foco da caixa de texto, e "Recentes" fica no `localStorage` do navegador.
- **"Digitando…"**: enquanto há texto, o composer envia `POST /api/conversations/:id/typing` no máximo a cada 2,5 s. Ao apagar o rascunho ou sair da conversa, envia `DELETE`. O polling considera ativo um sinal com menos de 6 s, e enviar uma mensagem limpa o sinal. É uma rota HTTP, e não Server Action, porque as Server Actions de um mesmo cliente rodam em fila e atrasariam o envio.

Todas as tabelas têm **RLS habilitado sem políticas**, o que bloqueia a Data API pública do Supabase (`anon` e `authenticated`). O app usa o papel `postgres` pela connection string, que ignora o RLS.

## Decisões

- **Supabase só como PostgreSQL gerenciado.** O acesso a dados passa todo pelo Drizzle no servidor, sem SDK `@supabase/*` e sem chaves públicas.
- **Autenticação própria** em vez do Supabase Auth: sessões no banco, cookie `psy_session` httpOnly, `SameSite=Lax` e `Secure` em produção. O logout remove a sessão no banco. A comparação de senha usa um hash fictício quando o e-mail não existe, para equalizar o tempo de resposta.
- **Server Actions** para cadastro, login, publicação, início de conversa, envio e compartilhamento. Os redirecionamentos pós-login só aceitam caminhos relativos (`lib/safe-next.ts`).
- **Chat por polling** (3 s, pausado com a aba oculta), usando `GET /api/conversations/:id/messages?after=ISO&since=ISO`, que devolve as mensagens novas, as reações das mensagens já carregadas e se a outra pessoa está digitando. A mesma consulta marca como lidas as mensagens recebidas. O cliente deduplica por `id`. Não há WebSocket nem Supabase Realtime.
- **`cacheComponents` desligado**: todas as rotas são dinâmicas, porque o header depende do cookie em todas as páginas.
- Busca com `ILIKE` (com escape de `%` e `_`) em título e resumo. Se o volume crescer, avaliar `tsvector`/`pg_trgm`.

## Limites conhecidos

- O polling gera três queries a cada 3 s por conversa aberta (mensagens, reações e "digitando"). Reações e "digitando" chegam ao outro lado com até cerca de 3 s de atraso.
- Uploads de vídeo abandonados (enviados ao Storage, mas sem mensagem, por exemplo ao fechar a aba no meio) ficam órfãos no bucket. Não há limpeza automática.
- A URL assinada do vídeo vale 1 hora. Depois disso, um player aberto há muito tempo pode precisar recarregar a página.
- Os vídeos guardam os metadados originais (inclusive localização, se o celular gravou).
- Não há rate limiting em login, cadastro e envio de mensagens (pendente antes de produção).
- Sessões expiradas não são limpas automaticamente (são apenas ignoradas na leitura).
