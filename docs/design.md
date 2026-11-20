# Design

## Direção visual

A referência é a home editorial da Psychology Today: header branco com logo e busca, uma faixa de navegação azul com os temas e um destaque grande no topo. Depois vêm "Essenciais de hoje" e "Mais recentes", com cartões de miniatura quadrada, tópico em caixa alta, título serifado e byline, além de uma barra lateral com autores. A marca, as cores e a ilustração são próprias da Psychopedia e não copiam o original.

- **Tipografia:** Source Serif 4 nos títulos (tom editorial) e Inter no corpo.
- **Cores** (tokens em `src/app/globals.css`): `--brand` azul-marinho `#1d3a6e`, `--accent` terracota `#c2492f`, fundo creme `#fbfaf7` e superfícies brancas.
- **Imagens:** os artigos não têm upload, então cada categoria tem uma arte em gradiente com um glifo SVG (`components/category-art.tsx`). Os avatares mostram iniciais com cor derivada do username.

## Componentes

`Header`, `Footer`, `Logo`, `Avatar`, `CategoryArt`, `FeaturedArticle`, `ArticleRow`, `ArticleCompact`, `Pagination`, `SectionTitle`, `Field`, `SubmitButton`, `FormMessage`, `FloatingPanel`, `ChatRoom`, `Composer`, `MessageBubble`, `EmojiPicker`, `ReactionPicker` e `ShareForm`.

## Acessibilidade

- Skip link para `#conteudo`, `lang="pt-BR"`, landmarks (`header`, `nav` com `aria-label`, `main`, `aside`, `footer`).
- Inputs com `<label>`, erros ligados por `aria-describedby` e `aria-invalid`, e mensagens gerais com `role="alert"`.
- Foco visível global (`:focus-visible` em terracota). O menu da conta usa `<details>` e funciona sem JS e pelo teclado.
- A lista de mensagens do chat usa `aria-live="polite"`. Enter envia e Shift+Enter quebra a linha.
- A aba de emojis e a barra de reações são painéis não modais (`role="dialog"`): Esc fecha e devolve o foco ao botão, e as setas navegam pela grade. A aba de emojis não tira o foco da caixa de texto.
- As reações são botões com `aria-pressed` e um rótulo que diz quem reagiu ("Reação ❤️: Você e Ana"). O aviso "digitando…" fica num `role="status"` de altura fixa, para não deslocar o layout.
- No celular, o botão de reagir fica sempre visível (não há hover) e o de enviar vira um ícone, para a caixa de texto caber em telas de 360 px.
- `prefers-reduced-motion` desativa transições.
- **Pendente:** auditoria de contraste com ferramenta e modo escuro.
