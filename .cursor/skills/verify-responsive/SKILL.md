---
name: verify-responsive
description: >-
  Audita e corrige responsividade do relatório editorial (mobile, tablet, desktop):
  menu mobile, grids, gráficos, tabelas, tipografia e overflow. Use ao ajustar layout,
  antes de deploy, quando o usuário reportar problemas em smartphones/tablets, ou para
  garantir UX impecável em todos os tamanhos de tela.
---

# Verificar responsividade do relatório

Layout quebrado em mobile destrói a credibilidade editorial. Este skill cobre auditoria e correção sistemática.

## Quando usar

- Antes de deploy que altere `styles.css`, `index.html` ou `app.js`
- Quando links/menu/gráficos sobrepõem conteúdo em telas pequenas
- Após adicionar seções, tabelas largas ou novos componentes
- Revisão periódica em smartphone e tablet

## Comandos

```bash
npm run verify:responsive
```

Teste visual obrigatório nos DevTools (ou dispositivo real):

| Dispositivo | Largura |
|-------------|---------|
| iPhone SE | 375px |
| iPhone 14 | 390px |
| Android médio | 412px |
| Tablet portrait | 768px |
| Tablet landscape | 1024px |
| Desktop | 1280px+ |

## Workflow do agente

```
1. npm run verify:responsive
2. Abrir index.html em 375px e 768px
3. Verificar: hero, menu, gráficos, tabelas, fontes, FAB
4. Corrigir CSS/JS/HTML
5. Reexecutar auditoria + teste visual
6. Commit + deploy
```

## Breakpoints do projeto

| Breakpoint | Uso |
|------------|-----|
| `1024px` | Menu drawer, grids 3→2 colunas, padding reduzido |
| `640px` | Mobile: coluna única, hero compacto, gráficos menores |
| `480px` | Phones pequenos: nav links, FAB circular |

Tokens em `:root`: `--bp-tablet`, `--bp-mobile`, `--bp-mobile-sm`, `--nav-height`.

## Checklist por componente

### Menu mobile (crítico)
- [ ] Links **invisíveis** quando menu fechado (`visibility: hidden` + `opacity: 0`)
- [ ] Drawer com `z-index: 1100`, acima do hero
- [ ] Backdrop clicável fecha menu
- [ ] `body.nav-open { overflow: hidden }`
- [ ] Hamburger anima para X (`.nav__toggle.is-active`)
- [ ] Escape e resize > 1024px fecham menu
- [ ] Alvos de toque ≥ 44px

### Hero
- [ ] `padding-top` compensa nav fixa
- [ ] `min-height: 100dvh` / `100svh`
- [ ] Título com `clamp()` — não estoura em 375px
- [ ] Meta items empilham verticalmente no mobile
- [ ] CTA com largura adequada e contraste

### Grids e cards
- [ ] `.grid--2` → 1 col em ≤1024px
- [ ] `.grid--3` → 2 col tablet, 1 col mobile
- [ ] `.key-numbers` → 2 col tablet, 1 col mobile
- [ ] `.factcheck__card` → 1 col em ≤640px
- [ ] `.conclusions-grid` → 2 col tablet, 1 col mobile

### Gráficos
- [ ] Altura reduzida: 280px → 250px tablet → 220px mobile
- [ ] `initChartResize()` redimensiona Chart.js no resize/orientação
- [ ] Canvas dentro de `.chart-card__canvas-wrap` sem overflow da página

### Tabelas largas
- [ ] Scroll **apenas** em `.table-card__scroll`, não na página
- [ ] `max-width: 100%` no `.table-card`
- [ ] Hint de arrastar visível em mobile

### Tipografia e contraste
- [ ] Body ≥ 16px (`html { font-size: 16px }`)
- [ ] Títulos com `text-wrap: balance`
- [ ] Links em `.source` quebram linha no mobile (`white-space: normal`)
- [ ] Contraste texto secundário legível (#A8B0C0 sobre #0C0F14)

### FAB e toast
- [ ] Em ≤480px: botão circular, só ícone
- [ ] Não cobre conteúdo crítico do rodapé

## Anti-padrões a evitar

| Problema | Correção |
|----------|----------|
| Menu com só `opacity: 0` | Adicionar `visibility: hidden` e `pointer-events: none` |
| `z-index: 999` no drawer dentro de nav `1000` | Drawer `1100`, toggle/brand `1102` |
| Nav links centralizados sobre hero fechado | Drawer off-screen ou visibility hidden |
| `100vh` no iOS | Usar `100dvh` / `100svh` |
| Tabelas sem wrapper scroll | `.table-card__scroll { overflow-x: auto }` |
| `white-space: nowrap` em links longos | Quebrar no mobile |

## Caso real: menu sobre o hero

**Sintoma:** textos "Dívida Pública", "Endividamento" sobrepostos ao título do hero em smartphone.

**Causa:** drawer mobile com `opacity: 0` mas sem `visibility: hidden`, `z-index` abaixo do esperado, links ainda renderizados no centro da viewport.

**Correção aplicada:**
- Backdrop + drawer com visibility/opacity/transform
- Lista vertical com separadores, setas `→`, padding top para nav
- `body.nav-open` bloqueia scroll

## Saída esperada

```
OK  meta viewport configurado
OK  menu mobile oculto corretamente quando fechado
...
Auditoria estática passou. Teste visual nos viewports acima.
```

Exit code `1` = corrigir antes do deploy.

## Após correções

1. `npm run verify:responsive`
2. `npm run verify:sources` (se links alterados)
3. Commit + deploy
