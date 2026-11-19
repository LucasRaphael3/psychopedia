# Onboarding

## Pré-requisitos

Node.js 20.9 ou superior (testado com 22.17) e pnpm 10 (`corepack enable`).

## Banco: Supabase

1. Crie um projeto em <https://supabase.com/dashboard> e anote a senha do banco.
2. No projeto, clique em **Connect** e copie a URI do **Session pooler** (porta 5432, funciona em IPv4).
3. Em `.env.local` (já ignorado pelo git), troque `[YOUR-PASSWORD]` pela senha e acrescente os parâmetros de SSL:

   ```env
   DATABASE_URL=postgresql://postgres.<ref>:<senha>@aws-0-<região>.pooler.supabase.com:5432/postgres?uselibpqcompat=true&sslmode=require
   ```

   `uselibpqcompat=true&sslmode=require` criptografa a conexão sem validar a cadeia de certificados, como o `libpq`. Para validar também, baixe o certificado em *Database Settings → SSL* e use `sslmode=verify-full&sslrootcert=/caminho/prod-ca-2021.crt`.

4. Aplique o schema e, se quiser, os dados de demonstração:

   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

   A migração ativa o RLS em todas as tabelas, o que bloqueia a Data API pública do Supabase.

## Primeiro fluxo

```bash
pnpm dev
```

Abra <http://localhost:3000>, crie uma conta em **Cadastre-se**, publique um artigo em **Publicar** e, em outra janela anônima, crie uma segunda conta para testar o chat. Também é possível entrar com `ana@demo.psychopedia.dev` / `psychopedia123` depois do seed.

## Mudando o schema

Edite `src/db/schema/index.ts` (com `.enableRLS()` nas novas tabelas) e rode `pnpm db:generate`. Revise o SQL em `drizzle/` e só então rode `pnpm db:migrate`.
