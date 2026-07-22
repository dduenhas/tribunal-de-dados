---
name: deploy-github-cloudflare
description: >-
  Deploy de sites estáticos no GitHub (commit/push) e Cloudflare Pages (free tier).
  Usa conta dduenhas@gmail.com. Cria repositório e projeto Pages se não existirem.
  Use quando o usuário pedir deploy, publicar, subir para produção, GitHub ou Cloudflare.
---

# Deploy GitHub + Cloudflare Pages

Workflow para publicar o relatório editorial estático neste repositório.

## Conta e identidade

| Serviço | Valor |
|---------|-------|
| E-mail | `dduenhas@gmail.com` |
| GitHub | `dduenhas` |
| Repositório | `dduenhas/tribunal-de-dados` |
| Cloudflare Pages | `tribunal-de-dados` |
| URL produção | `https://tribunal-de-dados.pages.dev` |

Nome escolhido por alinhar ao conceito editorial **"The Data Tribunal"** do relatório.

## Pré-requisitos

```bash
gh auth status          # deve mostrar dduenhas@gmail.com
npx wrangler whoami     # se falhar: npx wrangler login
```

Login Cloudflare (interativo, uma vez):

```bash
npx wrangler login
```

Opcional para CI/automação sem browser: definir `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` no ambiente (nunca commitar).

## Free tier — regras de otimização

**GitHub (grátis, repo público)**
- Apenas arquivos estáticos (`index.html`, `styles.css`, `app.js`, `_headers`)
- Sem binários grandes; manter repo < 1 GB
- Commits atômicos; não versionar `.wrangler/`, `node_modules/`, secrets

**Cloudflare Pages (grátis)**
- Site 100% estático, **sem build step** (deploy direto da raiz)
- Sem Workers, KV, D1 ou R2 — zero custo além do Pages
- Cache agressivo em CSS/JS via `_headers`; HTML com TTL curto (1h)
- CDN global inclusa; limite generoso de requests/mês no free tier
- Um projeto Pages = um site; preview branches automáticos em deploys não-main

## Estrutura de deploy

```
.
├── index.html      # entrada
├── styles.css
├── app.js
├── _headers        # cache Cloudflare
├── wrangler.toml   # config Pages
└── package.json    # script npm run deploy
```

## Workflow completo

### 1. Verificar autenticação

```bash
gh auth status
npx wrangler whoami
```

Se `wrangler whoami` falhar → `npx wrangler login` e aguardar OAuth no browser.

### 2. Commit e push no GitHub

```bash
git config user.email "dduenhas@gmail.com"
git config user.name "dduenhas"

git status
git add index.html styles.css app.js _headers wrangler.toml package.json .gitignore
git add .cursor/skills/deploy-github-cloudflare/
# NÃO adicionar: node_modules, .wrangler, .env, .dev.vars

git commit -m "feat: publicar relatório Brasil 2016–2026"
```

**Repositório novo** (primeira vez):

```bash
gh repo create tribunal-de-dados --public --source=. --remote=origin --description "Relatório editorial: dados oficiais vs fake news no Brasil (2016–2026)"
git push -u origin main
```

**Repositório existente:**

```bash
git push origin main
```

### 3. Criar projeto Cloudflare Pages (primeira vez)

```bash
npx wrangler pages project create tribunal-de-dados --production-branch=main
```

Se o projeto já existir, pular este passo.

### 4. Deploy para Cloudflare

```bash
npm install
npm run deploy
```

Equivalente manual:

```bash
npx wrangler pages deploy . --project-name=tribunal-de-dados --branch=main --commit-dirty=true
```

### 5. Verificar

```bash
npx wrangler pages deployment list --project-name=tribunal-de-dados
```

Abrir `https://tribunal-de-dados.pages.dev` e testar `#conclusao`, gráficos Chart.js e scroll horizontal das tabelas.

## Atualizações (deploy incremental)

```bash
git add -A
git commit -m "descrição da mudança"
git push origin main
npm run deploy
```

## Conectar GitHub → Cloudflare (opcional, deploy automático)

No dashboard Cloudflare: **Workers & Pages → tribunal-de-dados → Settings → Builds**
- Conectar repo `dduenhas/tribunal-de-dados`
- Production branch: `main`
- Build command: *(vazio)*
- Build output directory: `/`

Com isso, cada `git push` dispara deploy sem `npm run deploy` manual.

## Troubleshooting

| Problema | Solução |
|----------|---------|
| `Not logged in` (wrangler) | `npx wrangler login` |
| `gh: repository already exists` | Usar remote existente: `git remote add origin https://github.com/dduenhas/tribunal-de-dados.git` |
| `Project not found` | `npx wrangler pages project create tribunal-de-dados --production-branch=main` |
| Chart.js não carrega | Verificar CDN no `index.html`; testar em preview URL |
| 404 em rotas | Site é SPA de página única; não há rotas — usar `/#secao` |

## Scripts auxiliares

```bash
# Windows PowerShell
.\.cursor\skills\deploy-github-cloudflare\scripts\deploy.ps1

# Unix
./.cursor/skills/deploy-github-cloudflare/scripts/deploy.sh
```

## Checklist pós-deploy

- [ ] `https://tribunal-de-dados.pages.dev` responde 200
- [ ] Gráficos Chart.js renderizam
- [ ] Links de fontes oficiais abrem em nova aba
- [ ] Mobile: tabelas com scroll horizontal funcionam
- [ ] Repo GitHub público em `github.com/dduenhas/tribunal-de-dados`
