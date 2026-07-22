#!/usr/bin/env bash
# Deploy tribunal-de-dados → GitHub + Cloudflare Pages
# Conta: dduenhas@gmail.com

set -euo pipefail

PROJECT_NAME="tribunal-de-dados"
EMAIL="dduenhas@gmail.com"

echo "==> Verificando autenticacao..."
gh auth status
npx wrangler whoami

echo "==> Configurando git local..."
git config user.email "$EMAIL"
git config user.name "dduenhas"

if [ ! -d .git ]; then
  git init -b main
fi

if [ -n "$(git status --porcelain)" ]; then
  git add index.html styles.css app.js _headers wrangler.toml package.json .gitignore
  git add .cursor/skills/deploy-github-cloudflare/
  git commit -m "chore: atualizar site e configuracao de deploy"
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "==> Criando repositorio GitHub..."
  gh repo create "$PROJECT_NAME" --public --source=. --remote=origin \
    --description "Relatorio editorial: dados oficiais vs fake news no Brasil (2016-2026)"
fi

echo "==> Push para GitHub..."
git push -u origin main

echo "==> Deploy Cloudflare Pages..."
npm install --silent
npm run deploy

echo "==> Concluido: https://${PROJECT_NAME}.pages.dev"
