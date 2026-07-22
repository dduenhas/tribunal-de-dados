# Deploy tribunal-de-dados → GitHub + Cloudflare Pages
# Conta: dduenhas@gmail.com

$ErrorActionPreference = "Stop"
$ProjectName = "tribunal-de-dados"
$Email = "dduenhas@gmail.com"

Write-Host "==> Verificando autenticacao..." -ForegroundColor Cyan
gh auth status | Out-Null
$wranglerWhoami = npx wrangler whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Wrangler nao autenticado. Execute: npx wrangler login" -ForegroundColor Yellow
    exit 1
}

Write-Host "==> Configurando git local..." -ForegroundColor Cyan
git config user.email $Email
git config user.name "dduenhas"

if (-not (Test-Path ".git")) {
    git init -b main
}

$status = git status --porcelain
if ($status) {
    git add index.html styles.css app.js _headers wrangler.toml package.json .gitignore
    git add .cursor/skills/deploy-github-cloudflare/
    git commit -m "chore: atualizar site e configuracao de deploy"
}

if (-not (git remote get-url origin 2>$null)) {
    Write-Host "==> Criando repositorio GitHub..." -ForegroundColor Cyan
    gh repo create $ProjectName --public --source=. --remote=origin --description "Relatorio editorial: dados oficiais vs fake news no Brasil (2016-2026)"
}

Write-Host "==> Push para GitHub..." -ForegroundColor Cyan
git push -u origin main

Write-Host "==> Deploy Cloudflare Pages..." -ForegroundColor Cyan
npm install --silent
npm run deploy

Write-Host "==> Concluido: https://$ProjectName.pages.dev" -ForegroundColor Green
