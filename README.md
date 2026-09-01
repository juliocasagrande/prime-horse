# Prime Horse — Gestão Empresarial

Sistema web (PWA) de gestão empresarial da Prime Horse — módulo de estoque de
feno, insumos e medicamentos, substituindo o controle por planilha. Ver
[prime-horse-estoque-spec.md](prime-horse-estoque-spec.md) para a especificação completa.

## Stack

- **Frontend:** React + Vite, PWA (service worker via `vite-plugin-pwa`, estratégia `injectManifest`)
- **Backend/API:** Node.js + Express
- **Banco de dados / Auth:** Supabase (Postgres + Auth + Row Level Security)
- **Notificações push:** Web Push (VAPID)
- **Hospedagem:** Railway (um único serviço serve a API e o build do frontend)

## Estrutura

```
supabase/migrations/   SQL: schema, RLS e seed (rodar em ordem no SQL Editor do Supabase)
server/                API Node/Express (usa a service role key do Supabase)
web/                   Frontend React (PWA)
scripts/               utilitário para gerar os ícones do manifest
```

## Rodando localmente

Pré-requisitos: Node 18+, um projeto Supabase com as migrations aplicadas
(veja `supabase/migrations/*.sql`, na ordem 0001 → 0002 → 0003).

1. Copie `server/.env.example` → `server/.env` e `web/.env.example` → `web/.env`
   e preencha com as chaves do seu projeto Supabase (Settings → API) e as
   chaves VAPID (`npm run generate-vapid`).
2. Na raiz do projeto:
   ```bash
   npm install
   npm run dev
   ```
   Isso sobe o backend (`http://localhost:8787`) e o frontend
   (`http://localhost:5173`) juntos, com hot-reload nos dois.
3. Crie o primeiro usuário Administrador com:
   ```bash
   node server/scripts/create-admin.js "Nome" email@exemplo.com "SenhaTemporaria123"
   ```
   Esse usuário será obrigado a trocar a senha no primeiro login.

> **Rede corporativa com inspeção de TLS:** se `npm run dev` ou os scripts do
> backend falharem com erro de certificado (`unable to get local issuer
> certificate`), é porque um proxy corporativo re-assina o HTTPS. O script
> `dev` do servidor já roda com `NODE_OPTIONS=--use-system-ca` para usar o
> repositório de certificados do Windows nesse caso; isso não é necessário em
> produção (Railway).

## Deploy (Railway + Supabase)

1. **Supabase:** crie um projeto novo, rode as 3 migrations de
   `supabase/migrations/` no SQL Editor, e pegue a Project URL + as chaves
   (anon/publishable e service_role/secret) em Settings → API.
2. **Railway:** crie um projeto novo, conecte-o a este repositório GitHub
   (o Nixpacks detecta o monorepo Node automaticamente: `npm install` →
   `npm run build` [gera `web/dist`] → `npm start` [sobe a API, que também
   serve `web/dist`]).
3. Configure as variáveis de ambiente do serviço no Railway:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CONTACT_EMAIL`
   - `WEB_ORIGIN` (o próprio domínio Railway, para CORS)
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (variáveis de **build**,
     precisam estar setadas antes do `npm run build` rodar)
4. Gere um domínio público no Railway e configure-o como Redirect URL
   permitida em Supabase → Authentication → URL Configuration (para o link
   de recuperação de senha funcionar).

## Perfis de usuário

| Perfil | Acesso |
|---|---|
| Administrador | Total: itens, categorias, locais, unidades, usuários, limites de alerta |
| Operador de campo | Só registra entrada/saída |
| Financeiro | Somente leitura |

Aplicado tanto no backend (checagem de `role` em cada rota) quanto via RLS no
Postgres (defesa em profundidade).

## PWA e offline — o que funciona offline e o que não funciona

- ✅ **Consulta ao estoque** (itens, categorias, locais, histórico) — cache
  local (service worker, estratégia NetworkFirst) mostra o último dado
  conhecido sem internet.
- ✅ **Registro de movimentações offline** — fica em uma fila local
  (IndexedDB) e sincroniza automaticamente assim que a conexão volta.
- ❌ **Notificações push** — dependem de conexão para o navio de push
  (Web Push) entregar a mensagem; alertas gerados enquanto o usuário está
  offline aparecem na Central de Notificações assim que ele reconectar.
- ❌ **Gestão de usuários e configurações administrativas** — exigem
  comunicação em tempo real com o backend (ações do Administrador), não
  funcionam offline.

## Regras de negócio importantes

- Uma saída que deixa o estoque negativo **é registrada normalmente**, com
  destaque visual (badge vermelho) — não é bloqueada, pois indica um erro de
  lançamento anterior a ser investigado.
- Toda movimentação exige motivo/observação.
- O alerta de "estoque baixo" (badge + push) dispara só no momento em que o
  item **cruza** para baixo do mínimo, não a cada movimentação subsequente.
