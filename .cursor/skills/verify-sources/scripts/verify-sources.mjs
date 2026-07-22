#!/usr/bin/env node
/**
 * Verifica links externos do relatório (index.html).
 * Uso: node .cursor/skills/verify-sources/scripts/verify-sources.mjs [--file index.html]
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../../..');

const args = process.argv.slice(2);
const fileArg = args.find((a) => !a.startsWith('--')) || 'index.html';
const htmlPath = resolve(ROOT, fileArg);
const strict = !args.includes('--lenient');
const timeoutMs = 15000;
const concurrency = 6;

const SKIP_HOSTS = new Set([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
]);

const NOT_FOUND_TITLE_PATTERNS = [
  /\b404\b/,
  /\bn[aã]o encontrad[oa]\b/i,
  /\bpage not found\b/i,
  /\bp[aá]gina n[aã]o encontrada\b/i,
];

const NOT_FOUND_BODY_PATTERNS = [
  /\bo endere[cç]o abaixo n[aã]o existe\b/i,
  /\berro 404\b/i,
];

const HOMEPAGE_ONLY_HOSTS = new Set([
  'www.ipea.gov.br',
  'www.ipeadata.gov.br',
  'publicacoes.forumseguranca.org.br',
]);

const BOT_BLOCK_STATUSES = new Set([401, 403, 429]);

function getTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
}

function getH1(html) {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return match ? match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
}

function isSoft404(html) {
  const title = getTitle(html);
  const h1 = getH1(html);
  const prominent = `${title} ${h1}`.toLowerCase();

  if (NOT_FOUND_TITLE_PATTERNS.some((pattern) => pattern.test(prominent))) {
    return 'título ou H1 indicam página inexistente';
  }

  const intro = html.slice(0, 5000).toLowerCase();
  if (NOT_FOUND_BODY_PATTERNS.some((pattern) => pattern.test(intro))) {
    return 'mensagem de endereço inexistente no corpo';
  }

  return null;
}

function isHomepageUrl(url) {
  try {
    const { hostname, pathname } = new URL(url);
    if (HOMEPAGE_ONLY_HOSTS.has(hostname) && (pathname === '/' || pathname === '')) {
      return true;
    }
    return pathname === '/' || pathname === '';
  } catch {
    return false;
  }
}

function extractLinks(html) {
  const links = [];
  const anchorRe = /<a\b([^>]*?)href=["']([^"']+)["']([^>]*?)>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorRe.exec(html)) !== null) {
    const [, before, href, after, inner] = match;
    const line = html.slice(0, match.index).split('\n').length;
    const attrs = `${before} ${after}`;
    const classMatch = attrs.match(/class=["']([^"']+)["']/);
    const classes = classMatch ? classMatch[1] : '';
    const text = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    links.push({ href, line, classes, text });
  }

  return links;
}

function normalizeUrl(href) {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return null;
  }

  try {
    const url = new URL(href, 'https://tribunal-de-dados.pages.dev/');
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (SKIP_HOSTS.has(url.hostname)) return null;
    return url.href;
  } catch {
    return null;
  }
}

function keywordsFromContext(text) {
  const tokens = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .match(/[a-z0-9]{4,}/g) || [];

  const stop = new Set([
    'fonte', 'fontes', 'confirma', 'dados', 'oficial', 'oficiais', 'relatorio',
    'brasil', 'sobre', 'para', 'como', 'mais', 'entre', 'desde', 'total',
    'informes', 'noticias', 'publicacoes', 'agencia', 'release', 'releases',
  ]);

  return [...new Set(tokens.filter((t) => !stop.has(t)))].slice(0, 6);
}

async function fetchWithTimeout(url, method = 'GET', attempt = 1) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'tribunal-de-dados-source-checker/1.0 (+https://tribunal-de-dados.pages.dev)',
        Accept: 'text/html,application/pdf,application/json,text/plain,*/*',
      },
    });
  } catch (error) {
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return fetchWithTimeout(url, method, attempt + 1);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function checkLink(entry) {
  const { url, line, label, keywords } = entry;
  const result = {
    url,
    line,
    label,
    ok: false,
    status: null,
    finalUrl: url,
    issues: [],
  };

  try {
    let response = await fetchWithTimeout(url, 'HEAD');
    const headType = response.headers.get('content-type') || '';

    if (
      BOT_BLOCK_STATUSES.has(response.status)
      || response.status === 405
      || headType.includes('text/html')
    ) {
      response = await fetchWithTimeout(url, 'GET');
    }

    result.status = response.status;
    result.finalUrl = response.url;

    if (BOT_BLOCK_STATUSES.has(response.status)) {
      result.issues.push(`HTTP ${response.status} (possível bloqueio a bots — verificar manualmente no navegador)`);
      result.ok = false;
      result.manualReview = true;
      return result;
    }

    if (response.status < 200 || response.status >= 400) {
      result.issues.push(`HTTP ${response.status}`);
      return result;
    }

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/html') || contentType.includes('application/xhtml')) {
      const body = await response.text();
      const soft404 = isSoft404(body);

      if (soft404) {
        result.issues.push(soft404);
      }

      if (
        body.length < 200
        && !isHomepageUrl(response.url)
        && !body.includes('http-equiv="refresh"')
      ) {
        result.issues.push(`corpo HTML muito curto (${body.length} bytes)`);
      }

      if (
        strict
        && keywords.length > 0
        && !isHomepageUrl(response.url)
      ) {
        const normalizedBody = body
          .toLowerCase()
          .normalize('NFD')
          .replace(/\p{M}/gu, '');
        const hits = keywords.filter((kw) => normalizedBody.includes(kw));
        if (hits.length === 0) {
          result.issues.push(`nenhuma palavra-chave do contexto encontrada (${keywords.join(', ')})`);
        }
      }
    }

    result.ok = result.issues.length === 0;
    return result;
  } catch (error) {
    result.issues.push(error.name === 'AbortError' ? 'timeout' : error.message);
    return result;
  }
}

async function mapPool(items, limit, worker) {
  const results = [];
  let index = 0;

  async function run() {
    while (index < items.length) {
      const current = index++;
      results[current] = await worker(items[current], current);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function main() {
  const html = readFileSync(htmlPath, 'utf8');
  const rawLinks = extractLinks(html);
  const byUrl = new Map();

  for (const link of rawLinks) {
    const url = normalizeUrl(link.href);
    if (!url) continue;

    const keywords = keywordsFromContext(link.text);
    const label = link.text.slice(0, 80) || link.classes || '(sem rótulo)';

    if (!byUrl.has(url)) {
      byUrl.set(url, { url, line: link.line, label, keywords, lines: [link.line] });
    } else {
      const existing = byUrl.get(url);
      existing.lines.push(link.line);
      existing.keywords = [...new Set([...existing.keywords, ...keywords])].slice(0, 8);
    }
  }

  return {
    file: fileArg,
    total: byUrl.size,
    entries: [...byUrl.values()],
  };
}

const { file, total, entries } = main();

console.log(`Verificando ${total} URLs únicas em ${file}...\n`);

const results = await mapPool(entries, concurrency, checkLink);
const failures = results.filter((r) => !r.ok);
const manual = failures.filter((r) => r.manualReview);
const hardFailures = failures.filter((r) => !r.manualReview);
const successes = results.filter((r) => r.ok);

for (const r of successes) {
  console.log(`OK  [L${r.line}] ${r.status} ${r.url}`);
}

if (failures.length > 0) {
  console.log('');
  for (const r of failures) {
    const tag = r.manualReview ? 'WARN' : 'FAIL';
    console.log(`${tag} [L${r.line}] ${r.status ?? '—'} ${r.url}`);
    if (r.finalUrl !== r.url) console.log(`     → ${r.finalUrl}`);
    for (const issue of r.issues) console.log(`     • ${issue}`);
    if (r.label) console.log(`     • rótulo: ${r.label}`);
  }

  if (hardFailures.length > 0) {
    console.log(`\n${hardFailures.length} link(s) com falha confirmada de ${total}.`);
    process.exit(1);
  }

  console.log(`\n${manual.length} link(s) exigem verificação manual (bloqueio a bots).`);
  process.exit(0);
}

console.log(`\nTodos os ${total} links passaram.`);
