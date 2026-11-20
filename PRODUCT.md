# Psychopedia

## Problema e objetivo

Quem se interessa por psicologia encontra bons textos espalhados e poucos lugares em português para publicar, discutir e indicar leituras a outras pessoas. A Psychopedia é um portal comunitário de artigos de psicologia, com visual editorial inspirado em revistas de psicologia como a Psychology Today, onde qualquer membro publica, lê, compartilha e conversa com outros leitores.

## Público e papéis

- **Visitante:** lê artigos, navega por tema, busca e vê perfis de autores.
- **Membro (conta criada):** tudo do visitante, mais publicar artigos, conversar por chat privado com outros membros e compartilhar artigos dentro do chat.

Não há papéis administrativos no MVP.

## Fluxos da primeira versão

1. **Cadastro:** nome, usuário, e-mail e senha. A conta é criada e a pessoa já entra logada.
2. **Login e logout:** e-mail e senha. Sessão de 30 dias em cookie httpOnly.
3. **Leitura:** a home tem um destaque, "Essenciais de hoje" e "Mais recentes" com paginação. Também há páginas por categoria, página de artigo com "Leia também" e busca por título ou resumo.
4. **Publicação:** formulário com título, resumo, categoria, texto e link de fonte opcional.
5. **Chat:** iniciar uma conversa pelo perfil de um autor ou por @usuario. Lista de conversas com contador de não lidas e conversa que se atualiza a cada 3 s.
6. **Fotos no chat:** anexar uma foto (JPG, PNG ou WebP, redimensionada no navegador) com legenda opcional. Só os participantes da conversa conseguem vê-la.
7. **Vídeos no chat:** anexar um vídeo (MP4, MOV ou WebM, até 50 MB) com legenda opcional e barra de progresso. Só os participantes da conversa conseguem assistir.
8. **Reações:** reagir a qualquer mensagem com um emoji (barra rápida com 6 opções e "+" para a lista completa). Cada pessoa tem uma reação por mensagem, que pode trocar ou remover.
9. **Emojis e "digitando":** aba de emojis no campo de mensagem e aviso "Fulano está digitando…" na conversa.
10. **Compartilhar artigo:** a partir do artigo, enviar para outro membro pelo chat com mensagem opcional. O artigo aparece como cartão na conversa.

## Fora do escopo (por enquanto)

Edição e exclusão de artigos, comentários, curtidas, imagens nos artigos, GIFs no chat, recuperação de senha, verificação de e-mail, moderação e denúncias, notificações por e-mail, chat em grupo e tempo real via WebSocket.

## Requisitos

- Interface em português (pt-BR), mobile first, acessível (labels, foco visível, `aria-live` no chat, skip link).
- Senhas com bcrypt (custo 12). Token de sessão aleatório de 256 bits, com apenas o hash SHA-256 guardado no banco.
- Somente participantes leem ou escrevem numa conversa, e isso é verificado no servidor em toda operação.
- O rodapé indica o CVV (188) e avisa que os artigos não substituem atendimento profissional.

## Restrições e decisões técnicas

Next.js 16 (App Router), TypeScript estrito, Tailwind 4, Drizzle ORM com PostgreSQL hospedado no **Supabase** (escolha do usuário) e driver `pg`, além de Zod, Pino, Vitest e pnpm. A autenticação é própria (sessões no banco), sem usar o Supabase Auth, para manter um único caminho de dados pelo Drizzle. O chat usa polling em vez de Supabase Realtime, para não expor tabelas pela API pública. Detalhes em `docs/architecture.md`.

## Suposições e pendências

- **Pendente:** credenciais do projeto Supabase em `.env.local`. Sem elas, as páginas que leem dados não abrem.
- **Suposição reversível:** o polling de 3 s basta para o volume do MVP. Se o chat crescer, avaliar Supabase Realtime ou SSE.
- **Suposição reversível:** o texto dos artigos é simples (parágrafos e subtítulos `##`), sem Markdown completo.

## Critérios de aceite

- Um visitante cria uma conta, sai, entra de novo e continua logado ao recarregar.
- Um membro publica um artigo, que aparece na home, na categoria e no próprio perfil.
- O membro A abre o perfil de B, envia uma mensagem, e B vê o contador de não lidas e a mensagem em até cerca de 3 s com a conversa aberta.
- A compartilha um artigo com B, que vê o cartão do artigo no chat.
- A envia um vídeo a B, que o assiste na conversa. B reage com um emoji e A vê a reação. Enquanto A digita, B vê "está digitando…".
- Um usuário não consegue ler uma conversa da qual não participa (404 na página e na API).

## Próxima entrega

Edição e exclusão dos próprios artigos e edição da bio no perfil.

## Manutenção

Atualize este documento quando objetivo, escopo, restrições ou critérios de aceite mudarem.
