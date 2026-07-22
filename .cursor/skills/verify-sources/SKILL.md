---
name: verify-sources
description: >-
  Audita links de fontes do relatório editorial (index.html): status HTTP, páginas
  404 e presença de conteúdo esperado. Use ao adicionar/alterar fontes, antes de
  deploy, quando o usuário reportar link quebrado, ou para garantir confiabilidade
  padrão ouro das referências.
---

# Verificar fontes do relatório

Confiabilidade das fontes é requisito crítico deste projeto. Toda alteração em links ou dados citados deve passar por esta verificação.

## Quando usar

- Antes de commit/deploy que altere `index.html`
- Quando o usuário reportar link quebrado ou conteúdo inacessível
- Após atualizar dados numéricos (conferir se a fonte ainda sustenta o valor)
- Revisão periódica de links externos

## Comando

```bash
npm run verify:sources
```

Opções do script:

```bash
node .cursor/skills/verify-sources/scripts/verify-sources.mjs
node .cursor/skills/verify-sources/scripts/verify-sources.mjs --lenient   # ignora checagem de palavras-chave
```

Exit code `1` = há links com problema. Corrija antes do deploy.

## O que o script verifica

1. **HTTP** — status 2xx ou 3xx válido (falha em 4xx/5xx)
2. **Soft 404** — padrões como "página não encontrada", "Ops!", "404"
3. **Corpo vazio** — HTML com menos de 512 bytes
4. **Conteúdo esperado** — palavras-chave extraídas do rótulo do link devem aparecer no HTML (modo strict)

Ignora automaticamente: `fonts.googleapis.com`, `fonts.gstatic.com`, âncoras `#`, `mailto:`, `tel:`.

## Workflow do agente

```
1. npm run verify:sources
2. Se FAIL → abrir URL no browser / buscar fonte primária oficial
3. Corrigir index.html (preferir fonte primária: órgão emissor > repositório > imprensa)
4. Reexecutar até passar
5. Commit + deploy
```

## Hierarquia de fontes (padrão ouro)

| Prioridade | Tipo | Exemplos |
|------------|------|----------|
| 1 | Órgão emissor / repositório oficial | `gov.br`, `bcb.gov.br`, `ipea.gov.br`, `ibge.gov.br`, `portaldocomercio.org.br` (CNC) |
| 2 | PDF ou dataset oficial | `bcb.gov.br/content/...pdf`, `repositorio.ipea.gov.br` |
| 3 | Agência de imprensa confiável | Valor, Agência Brasil — só se primária indisponível |
| 4 | Evitar | Blogs, redes sociais, sites sem autoria clara |

## Corrigir link quebrado

1. Identificar dado citado no relatório (número, período, indicador)
2. Buscar no site do órgão emissor
3. Testar URL manualmente (não confiar só no slug)
4. Atualizar `href` e, se necessário, `section-sources__org` / `section-sources__name`
5. Rodar `npm run verify:sources` novamente

### Caso real: CNC / PEIC maio/2026

- **Quebrado:** slug Valor com `historico` (grafia errada) → 404 Globo
- **Correto (primário):** `https://portaldocomercio.org.br/publicacoes_posts/pesquisa-de-endividamento-e-inadimplencia-do-consumidor-peic-maio-de-2026/`
- **Alternativa imprensa:** `https://valor.globo.com/brasil/noticia/2026/06/10/parcela-de-endividados-bate-novamente-recorde-histrico-em-maio-diz-cnc.ghtml` (note `histrico` sem segundo "o")

### Caso real: IPEA TD 2499 (Bolsa Família)

- **Quebrado:** `handle/11058/8479` após migração DSpace → documento errado
- **Correto:** `https://repositorio.ipea.gov.br/items/53006dfc-16db-46d0-a9bc-212c7121c2af`

## Interpretação da saída

| Tag | Significado |
|-----|-------------|
| `OK` | Link acessível e conteúdo coerente |
| `WARN` | Bloqueio a bots (403) — testar no navegador |
| `FAIL` | 404, soft-404 ou conteúdo incompatível — corrigir antes do deploy |

## Checklist pré-deploy

- [ ] `npm run verify:sources` passou
- [ ] Números no texto batem com a fonte linkada
- [ ] Links usam `target="_blank" rel="noopener noreferrer"`
- [ ] Fonte primária preferida sobre reprise jornalística

## Saída esperada

```
OK  [L125] 200 https://repositorio.ipea.gov.br/...
...
Todos os N links passaram.
```

Em falha, corrigir cada `FAIL` antes de prosseguir.
