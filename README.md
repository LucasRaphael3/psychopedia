# Psychopedia

Portal comunitário de artigos de psicologia: leia, publique, compartilhe e converse com outros leitores.

## Rodando localmente

```bash
pnpm install
# 1. Preencha DATABASE_URL em .env.local (veja docs/onboarding.md, Supabase)
pnpm db:migrate     # cria as tabelas
pnpm db:seed        # opcional: autores e artigos de demonstração
pnpm dev            # http://localhost:3000
```

Login de demonstração após o seed: `ana@demo.psychopedia.dev` / `psychopedia123`.

## Documentos

| Documento | Conteúdo |
|---|---|
| [PRODUCT.md](PRODUCT.md) | Escopo, fluxos e critérios de aceite |
| [AGENTS.md](AGENTS.md) | Comandos e convenções (também para agentes de IA) |
| [docs/architecture.md](docs/architecture.md) | Estrutura, dados e decisões técnicas |
| [docs/design.md](docs/design.md) | Direção visual e acessibilidade |
| [docs/onboarding.md](docs/onboarding.md) | Preparação do ambiente e banco Supabase |
| [docs/quality.md](docs/quality.md) | O que cada verificação prova |
| [docs/setup.md](docs/setup.md) | Versões, fontes e evidências do bootstrap |
