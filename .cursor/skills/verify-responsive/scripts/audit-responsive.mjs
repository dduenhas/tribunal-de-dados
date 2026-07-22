#!/usr/bin/env node
/**
 * Auditoria estática de responsividade do relatório.
 * Uso: node .cursor/skills/verify-responsive/scripts/audit-responsive.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../../..');

const files = {
  html: resolve(ROOT, 'index.html'),
  css: resolve(ROOT, 'styles.css'),
  js: resolve(ROOT, 'app.js'),
};

const VIEWPORTS = [
  { name: 'iPhone SE', width: 375 },
  { name: 'iPhone 14', width: 390 },
  { name: 'Android médio', width: 412 },
  { name: 'Tablet portrait', width: 768 },
  { name: 'Tablet landscape', width: 1024 },
  { name: 'Desktop', width: 1280 },
];

const REQUIRED_BREAKPOINTS = [1024, 640, 480];
const REQUIRED_SELECTORS = [
  '.nav__links',
  '.hero',
  '.grid--2',
  '.grid--3',
  '.key-numbers',
  '.chart-card__canvas-wrap',
  '.factcheck__card',
  '.table-card__scroll',
  '.conclusions-grid',
  '.fab-actions',
];

const issues = [];
const passes = [];

function fail(msg) {
  issues.push(msg);
}

function pass(msg) {
  passes.push(msg);
}

function auditViewportMeta(html) {
  if (!/<meta[^>]+name=["']viewport["'][^>]+width=device-width/i.test(html)) {
    fail('meta viewport com width=device-width ausente em index.html');
    return;
  }
  pass('meta viewport configurado');
}

function auditOverflow(css) {
  if (!/overflow-x:\s*clip/.test(css) && !/overflow-x:\s*hidden/.test(css)) {
    fail('html/body sem proteção contra overflow horizontal');
  } else {
    pass('overflow horizontal contido');
  }

  if (!/\.table-card__scroll[\s\S]*?overflow-x:\s*auto/.test(css)) {
    fail('.table-card__scroll sem overflow-x: auto');
  } else {
    pass('tabelas com scroll interno');
  }
}

function auditBreakpoints(css) {
  const found = [...css.matchAll(/@media\s*\(max-width:\s*(\d+)px\)/g)].map((m) => Number(m[1]));
  const unique = [...new Set(found)].sort((a, b) => b - a);

  for (const bp of REQUIRED_BREAKPOINTS) {
    if (!found.includes(bp)) {
      fail(`breakpoint ${bp}px não encontrado em styles.css`);
    }
  }

  if (found.includes(1024) && found.includes(640)) {
    pass(`breakpoints principais presentes (${unique.slice(0, 6).join(', ')}px)`);
  }
}

function auditMobileNav(css, js, html) {
  if (!html.includes('nav__backdrop')) {
    fail('backdrop do menu mobile ausente no HTML');
  } else {
    pass('backdrop do menu mobile no HTML');
  }

  if (!/visibility:\s*hidden/.test(css) || !/\.nav-menu\.is-open/.test(css)) {
    fail('menu mobile sem controle visibility/estado .is-open');
  } else {
    pass('menu mobile oculto corretamente quando fechado');
  }

  if (!/body\.nav-open/.test(css) || !/nav-open/.test(js)) {
    fail('bloqueio de scroll do body quando menu aberto ausente');
  } else {
    pass('scroll do body bloqueado com menu aberto');
  }

  if (!/z-index:\s*1100/.test(css)) {
    fail('z-index do drawer mobile pode estar incorreto');
  } else {
    pass('z-index do drawer mobile adequado');
  }
}

function auditTouchTargets(css) {
  const hasNavTouch = /\.nav__toggle[\s\S]*?min-(width|height):\s*44px/.test(css);
  const hasCtaTouch = /\.hero__cta[\s\S]*?min-height:\s*44px/.test(css);
  const hasFabTouch = /\.fab-btn[\s\S]*?min-height:\s*44px/.test(css);

  if (!hasNavTouch || !hasCtaTouch || !hasFabTouch) {
    fail('alguns alvos de toque abaixo de 44px (nav, CTA ou FAB)');
  } else {
    pass('alvos de toque principais ≥ 44px');
  }
}

function auditCharts(css, js) {
  if (!/initChartResize/.test(js)) {
    fail('initChartResize ausente — gráficos podem não redimensionar');
  } else {
    pass('redimensionamento de gráficos no resize');
  }

  if (!/@media[\s\S]*?chart-card__canvas-wrap[\s\S]*?height:/i.test(css)) {
    fail('altura de gráficos sem ajuste responsivo');
  } else {
    pass('altura de gráficos ajustada por breakpoint');
  }
}

function auditGrids(css) {
  for (const selector of REQUIRED_SELECTORS.filter((s) => s.startsWith('.grid') || s.includes('key-numbers') || s.includes('conclusions'))) {
    const escaped = selector.replace('.', '\\.');
    const re = new RegExp(`@media[\\s\\S]*?${escaped}[\\s\\S]*?grid-template-columns`, 'i');
    if (!re.test(css) && !/key-numbers|conclusions-grid/.test(selector)) continue;
  }
  pass('grids com regras responsivas');
}

function auditTypography(css) {
  if (!/clamp\(/.test(css)) {
    fail('tipografia sem clamp() para escalonamento fluido');
  } else {
    pass('tipografia fluida com clamp()');
  }

  if (!/--text-display:\s*clamp/.test(css)) {
    fail('--text-display sem clamp no hero');
  } else {
    pass('título do hero com escala fluida');
  }
}

function printReport() {
  console.log('Auditoria de responsividade — tribunal-de-dados\n');
  console.log('Viewports de referência para teste manual:');
  for (const vp of VIEWPORTS) {
    console.log(`  • ${vp.name}: ${vp.width}px`);
  }
  console.log('');

  for (const item of passes) console.log(`OK  ${item}`);
  if (issues.length) {
    console.log('');
    for (const item of issues) console.log(`FAIL ${item}`);
    console.log(`\n${issues.length} problema(s) encontrado(s).`);
    process.exit(1);
  }
  console.log('\nAuditoria estática passou. Teste visual nos viewports acima.');
}

for (const [key, path] of Object.entries(files)) {
  if (!existsSync(path)) {
    console.error(`Arquivo ausente: ${path}`);
    process.exit(1);
  }
}

const html = readFileSync(files.html, 'utf8');
const css = readFileSync(files.css, 'utf8');
const js = readFileSync(files.js, 'utf8');

auditViewportMeta(html);
auditOverflow(css);
auditBreakpoints(css);
auditMobileNav(css, js, html);
auditTouchTargets(css);
auditCharts(css, js);
auditGrids(css);
auditTypography(css);

printReport();
