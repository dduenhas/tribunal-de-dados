/* ══════════════════════════════════════════════════════════════
   APP.JS — Interactive Report: Brasil 2016–2026
   Charts, animations, scroll-driven interactions
   ══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollEffects();
  initRevealAnimations();
  initCountUp();
  initCharts();
  initTableDragScroll();
  initFloatingActions();
});


/* ══════════════════════════════════════
   SCROLL (rAF-throttled)
   ══════════════════════════════════════ */

function initScrollEffects() {
  const nav = document.getElementById('mainNav');
  const bar = document.getElementById('progressBar');
  let ticking = false;

  function update() {
    const scrollY = window.scrollY;
    nav.classList.toggle('nav--scrolled', scrollY > 80);
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? scrollY / docHeight : 0;
    bar.style.transform = `scaleX(${progress})`;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  update();
}


/* ══════════════════════════════════════
   NAVIGATION
   ══════════════════════════════════════ */

function initNavigation() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    toggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  });

  // Close mobile menu on link click
  links.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menu');
    });
  });
}


/* ══════════════════════════════════════
   MOTION & VIEWPORT HELPERS
   ══════════════════════════════════════ */

const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');

function shouldReduceMotion() {
  return motionMedia.matches;
}

function isInViewport(el, marginRatio = 0.06) {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const margin = vh * marginRatio;
  return rect.top < vh - margin && rect.bottom > margin;
}

function getRevealStaggerDelay(el) {
  const parent = el.parentElement;
  if (!parent) return 0;

  const siblings = [...parent.children].filter((node) => node.classList.contains('reveal'));
  const index = siblings.indexOf(el);
  return index > 0 ? index * 150 : 0;
}

function scheduleWhenVisible(el, onVisible, options = {}) {
  if (shouldReduceMotion()) {
    onVisible();
    return () => {};
  }

  const {
    threshold = 0.06,
    rootMargin = '0px 0px -4% 0px',
  } = options;

  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    onVisible();
  };

  if (isInViewport(el)) {
    requestAnimationFrame(run);
    return () => {};
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.disconnect();
      run();
      break;
    }
  }, { threshold, rootMargin });

  observer.observe(el);

  let scrollTicking = false;
  const onScroll = () => {
    if (done || scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      scrollTicking = false;
      if (!done && isInViewport(el)) {
        observer.disconnect();
        run();
      }
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('load', () => {
    if (!done && isInViewport(el)) {
      observer.disconnect();
      run();
    }
  }, { once: true });

  return () => {
    observer.disconnect();
    window.removeEventListener('scroll', onScroll);
  };
}


/* ══════════════════════════════════════
   REVEAL ANIMATIONS (Intersection Observer)
   ══════════════════════════════════════ */

function initRevealAnimations() {
  const elements = document.querySelectorAll('.reveal');

  if (shouldReduceMotion()) {
    elements.forEach((el) => el.classList.add('visible'));
    return;
  }

  elements.forEach((el) => {
    scheduleWhenVisible(el, () => {
      const delay = getRevealStaggerDelay(el);
      window.setTimeout(() => el.classList.add('visible'), delay);
    }, {
      threshold: 0.06,
      rootMargin: '0px 0px -4% 0px',
    });
  });
}


/* ══════════════════════════════════════
   COUNT-UP ANIMATION
   ══════════════════════════════════════ */

function initCountUp() {
  const counters = document.querySelectorAll('[data-count]');

  counters.forEach((el) => {
    scheduleWhenVisible(el, () => {
      const target = parseFloat(el.getAttribute('data-count'));
      animateCount(el, target);
    }, {
      threshold: 0.2,
      rootMargin: '0px 0px -4% 0px',
    });
  });
}

function animateCount(el, target) {
  const duration = shouldReduceMotion() ? 0 : 2800;
  const start = performance.now();
  const isDecimal = target % 1 !== 0;

  if (duration === 0) {
    el.textContent = isDecimal ? target.toFixed(1) : Math.round(target).toLocaleString('pt-BR');
    return;
  }

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = target * ease;

    if (isDecimal) {
      el.textContent = current.toFixed(1);
    } else {
      el.textContent = Math.round(current).toLocaleString('pt-BR');
    }

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}


/* ══════════════════════════════════════
   CHART.JS CONFIGURATION
   ══════════════════════════════════════ */

const COLORS = {
  gold:       '#C4A265',
  goldDim:    '#9E8350',
  goldAlpha:  'rgba(196, 162, 101, 0.15)',
  teal:       '#4A9BAA',
  tealDim:    '#3A7B8A',
  tealAlpha:  'rgba(74, 155, 170, 0.15)',
  danger:     '#C4524A',
  dangerAlpha:'rgba(196, 82, 74, 0.15)',
  success:    '#5B9A72',
  successAlpha:'rgba(91, 154, 114, 0.15)',
  warning:    '#D4A04A',
  warningAlpha:'rgba(212, 160, 74, 0.15)',
  slate:      '#6B7385',
  slateAlpha: 'rgba(107, 115, 133, 0.15)',
};

function createGradient(ctx, color1, color2) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 280);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);
  return gradient;
}

function configureChartDefaults() {
  Chart.defaults.color = '#A8B0C0';
  Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.06)';
  Chart.defaults.font.family = "'Source Sans 3', system-ui, sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.padding = 20;
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(26, 32, 48, 0.95)';
  Chart.defaults.plugins.tooltip.titleColor = '#E8E6E1';
  Chart.defaults.plugins.tooltip.bodyColor = '#A8B0C0';
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.1)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.displayColors = true;
  Chart.defaults.plugins.tooltip.boxPadding = 6;
}

function chartStagger(ctx, step = 100) {
  if (ctx.type !== 'data' || ctx.mode !== 'default') return 0;
  return ctx.dataIndex * step + ctx.datasetIndex * 60;
}

function entranceAnimation(kind) {
  if (shouldReduceMotion()) return { duration: 0 };

  const presets = {
    bar: {
      duration: 2400,
      easing: 'easeOutQuart',
      delay: (ctx) => chartStagger(ctx, 200),
    },
    barH: {
      duration: 2600,
      easing: 'easeOutQuart',
      delay: (ctx) => chartStagger(ctx, 160),
    },
    line: {
      duration: 2800,
      easing: 'easeOutQuart',
      delay: (ctx) => chartStagger(ctx, 95),
    },
    doughnut: {
      animateRotate: true,
      animateScale: true,
      duration: 2600,
      easing: 'easeOutCubic',
      delay: (ctx) => chartStagger(ctx, 120),
    },
  };

  return presets[kind] || presets.bar;
}

function entranceAnimationsLine() {
  if (shouldReduceMotion()) return {};

  return {
    y: {
      type: 'number',
      easing: 'easeOutQuart',
      duration: 2800,
      from: (ctx) => {
        if (ctx.type === 'data') {
          const scale = ctx.chart.scales.y;
          return scale.getPixelForValue(scale.min);
        }
      },
      delay: (ctx) => (ctx.type === 'data' ? ctx.dataIndex * 95 + ctx.datasetIndex * 55 : 0),
    },
    tension: {
      duration: 2800,
      easing: 'easeOutQuart',
      from: 0,
    },
    radius: {
      duration: 700,
      easing: 'easeOutQuart',
      from: 0,
      delay: (ctx) => (ctx.type === 'data' ? ctx.dataIndex * 95 + ctx.datasetIndex * 55 + 650 : 0),
    },
  };
}

function entranceAnimationsBarH() {
  if (shouldReduceMotion()) return {};

  return {
    x: {
      type: 'number',
      easing: 'easeOutQuart',
      duration: 2600,
      from: 0,
      delay: (ctx) => (ctx.type === 'data' ? ctx.dataIndex * 160 : 0),
    },
  };
}

function buildChart(ctx, config) {
  const type = config.type;
  const isHorizontal = config.options?.indexAxis === 'y';
  let kind = type;
  if (type === 'bar' && isHorizontal) kind = 'barH';

  config.options = config.options || {};
  const customAnimation = config.options.animation;
  const customAnimations = config.options.animations;

  config.options.animation = {
    ...customAnimation,
    ...entranceAnimation(kind),
  };

  if (type === 'line') {
    config.options.animations = {
      ...customAnimations,
      ...entranceAnimationsLine(),
    };
  } else if (kind === 'barH') {
    config.options.animations = {
      ...customAnimations,
      ...entranceAnimationsBarH(),
    };
  }

  return new Chart(ctx, config);
}

function observeChartReveal(canvasId, createFn) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const entry = { createFn, rendered: false };
  chartRegistry.set(canvasId, entry);

  const mountChart = () => {
    if (entry.rendered) return;
    entry.rendered = true;
    createFn();
  };

  const wrap = canvas.closest('.chart-card__canvas-wrap');
  if (!wrap) {
    mountChart();
    return;
  }

  wrap.classList.add('chart-card__canvas-wrap--pending');

  const revealAndMount = () => {
    if (entry.rendered) return;
    wrap.classList.remove('chart-card__canvas-wrap--pending');
    wrap.classList.add('chart-card__canvas-wrap--revealed');
    requestAnimationFrame(() => {
      requestAnimationFrame(mountChart);
    });
  };

  if (shouldReduceMotion()) {
    revealAndMount();
    return;
  }

  scheduleWhenVisible(wrap, revealAndMount, {
    threshold: 0.1,
    rootMargin: '0px 0px -2% 0px',
  });
}


/* ══════════════════════════════════════
   CHARTS
   ══════════════════════════════════════ */

const chartRegistry = new Map();

function initCharts() {
  configureChartDefaults();

  const charts = [
    ['chartHomicidios', chartHomicidios],
    ['chartArmas', chartArmas],
    ['chartFeminicidioSerie', chartFeminicidioSerie],
    ['chartFeminicidioMeios', chartFeminicidioMeios],
    ['chartIPCA', chartIPCA],
    ['chartSelic', chartSelic],
    ['chartDesemprego', chartDesemprego],
    ['chartBolsaFamilia', chartBolsaFamilia],
    ['chartResultadoPrimario', chartResultadoPrimario],
    ['chartEndividamento', chartEndividamento],
    ['chartPerfilDivida', chartPerfilDivida],
    ['chartApostasMercado', chartApostasMercado],
    ['chartApostadoresGasto', chartApostadoresGasto],
    ['chartCoercaoApostas', chartCoercaoApostas],
    ['chartRouanetCaptacao', chartRouanetCaptacao],
    ['chartRouanetRetorno', chartRouanetRetorno],
    ['chartRouanetGastos', chartRouanetGastos],
    ['chartCulturaEscala', chartCulturaEscala],
    ['chartCulturaViolencia', chartCulturaViolencia],
  ];

  charts.forEach(([id, fn]) => observeChartReveal(id, fn));
}


// ── 1. Homicídios Dolosos (total nacional — SIM / Atlas da Violência) ──
const HOMICIDIOS_NACIONAL = { y2016: 62517, y2024: 42590 };

function chartHomicidios() {
  const ctx = document.getElementById('chartHomicidios').getContext('2d');
  buildChart(ctx, {
    type: 'bar',
    data: {
      labels: ['2016', '2024'],
      datasets: [{
        label: 'Homicídios dolosos (Brasil)',
        data: [HOMICIDIOS_NACIONAL.y2016, HOMICIDIOS_NACIONAL.y2024],
        backgroundColor: [
          COLORS.dangerAlpha,
          COLORS.successAlpha,
        ],
        borderColor: [
          COLORS.danger,
          COLORS.success,
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y.toLocaleString('pt-BR')} homicídios dolosos`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            callback: v => v.toLocaleString('pt-BR'),
            font: { family: "'JetBrains Mono', monospace", size: 11 }
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: "'JetBrains Mono', monospace", size: 12, weight: 600 } }
        }
      },
      animation: {
        duration: 1500,
        easing: 'easeOutQuart'
      }
    }
  });
}


// ── 2b. Feminicídio — série anual ──
function chartFeminicidioSerie() {
  const el = document.getElementById('chartFeminicidioSerie');
  if (!el) return;
  const ctx = el.getContext('2d');

  buildChart(ctx, {
    type: 'line',
    data: {
      labels: ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
      datasets: [
        {
          label: 'Homicídios de mulheres (SIM)',
          data: [4645, 4936, 4519, 3737, 3833, 3858, 3806, 3903, 3642],
          borderColor: COLORS.slate,
          backgroundColor: COLORS.slateAlpha,
          borderWidth: 2.5,
          pointRadius: 4,
          tension: 0.3,
          fill: false,
        },
        {
          label: 'Feminicídios tipificados (FBSP)',
          data: [929, 1075, 1229, 1330, 1354, 1347, 1455, 1475, 1492],
          borderColor: COLORS.danger,
          backgroundColor: COLORS.dangerAlpha,
          borderWidth: 2.5,
          pointRadius: 5,
          pointBackgroundColor: COLORS.danger,
          tension: 0.3,
          fill: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 14, font: { size: 11 }, color: '#A8B0C0' }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('pt-BR')}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 500,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            font: { family: "'JetBrains Mono', monospace", size: 11 }
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: "'JetBrains Mono', monospace", size: 11 } }
        }
      },
      animation: { duration: 1500, easing: 'easeOutQuart' }
    }
  });
}


// ── 2c. Feminicídio — meios empregados (2024) ──
function chartFeminicidioMeios() {
  const el = document.getElementById('chartFeminicidioMeios');
  if (!el) return;
  const ctx = el.getContext('2d');

  buildChart(ctx, {
    type: 'bar',
    data: {
      labels: ['Homicídios de mulheres', 'Feminicídios tipificados'],
      datasets: [
        {
          label: 'Arma de fogo',
          data: [1712, 376],
          backgroundColor: COLORS.danger,
          borderRadius: 4,
        },
        {
          label: 'Arma branca (só feminicídio)',
          data: [0, 727],
          backgroundColor: COLORS.warning,
          borderRadius: 4,
        },
        {
          label: 'Outros meios',
          data: [1930, 389],
          backgroundColor: COLORS.slateAlpha,
          borderColor: COLORS.slate,
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 12, font: { size: 10 }, color: '#A8B0C0' }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('pt-BR')}`
          }
        }
      },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            font: { family: "'JetBrains Mono', monospace", size: 11 }
          }
        }
      },
      animation: { duration: 1500, easing: 'easeOutQuart' }
    }
  });
}


// ── 2. Homicídios por Arma de Fogo ──
function chartArmas() {
  const ctx = document.getElementById('chartArmas').getContext('2d');
  buildChart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Arma de fogo (2016)', 'Outros meios (2016)', 'Arma de fogo (2024)', 'Outros meios (2024)'],
      datasets: [
        {
          label: '2016',
          data: [71.1, 28.9],
          backgroundColor: [COLORS.danger, 'rgba(107, 115, 133, 0.2)'],
          borderColor: ['transparent', 'transparent'],
          borderWidth: 0,
          weight: 1,
        },
        {
          label: '2024',
          data: [70, 30],
          backgroundColor: [COLORS.warning, 'rgba(107, 115, 133, 0.12)'],
          borderColor: ['transparent', 'transparent'],
          borderWidth: 0,
          weight: 1,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '55%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const year = ctx.datasetIndex === 0 ? '2016' : '2024';
              return `${year}: ${ctx.parsed}%`;
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        duration: 1500,
        easing: 'easeOutQuart',
      }
    },
    plugins: [{
      id: 'centerText',
      afterDraw(chart) {
        const { ctx, width, height } = chart;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#E8E6E1';
        ctx.font = "600 24px 'JetBrains Mono', monospace";
        ctx.fillText('~70%', width / 2, height / 2 - 10);
        ctx.fillStyle = '#A8B0C0';
        ctx.font = "400 11px 'Source Sans 3', system-ui, sans-serif";
        ctx.fillText('arma de fogo', width / 2, height / 2 + 14);
        ctx.fillStyle = '#6B7385';
        ctx.font = "400 10px 'JetBrains Mono', monospace";
        ctx.fillText('2016 (ext.) · 2024 (int.)', width / 2, height / 2 + 32);
        ctx.restore();
      }
    }]
  });
}


// ── 3. IPCA ──
function chartIPCA() {
  const ctx = document.getElementById('chartIPCA').getContext('2d');
  const gradient = createGradient(ctx, COLORS.goldAlpha, 'rgba(196, 162, 101, 0.01)');

  buildChart(ctx, {
    type: 'line',
    data: {
      labels: ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', 'Jun/2026*'],
      datasets: [{
        label: 'IPCA (%)',
        data: [6.29, 2.95, 3.75, 4.31, 4.52, 10.06, 5.79, 4.62, 4.83, 4.50, 4.64],
        fill: true,
        backgroundColor: gradient,
        borderColor: COLORS.gold,
        borderWidth: 2.5,
        pointBackgroundColor: COLORS.gold,
        pointBorderColor: '#1A2030',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
        tension: 0.35,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `IPCA: ${ctx.parsed.y.toFixed(2)}%`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            callback: v => v + '%',
            font: { family: "'JetBrains Mono', monospace", size: 11 }
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: "'JetBrains Mono', monospace", size: 11 } }
        }
      },
      animation: { duration: 1500, easing: 'easeOutQuart' }
    }
  });
}


// ── 4. Selic ──
function chartSelic() {
  const ctx = document.getElementById('chartSelic').getContext('2d');
  const gradient = createGradient(ctx, COLORS.tealAlpha, 'rgba(74, 155, 170, 0.01)');

  buildChart(ctx, {
    type: 'line',
    data: {
      labels: ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', 'Jun/2026*'],
      datasets: [{
        label: 'Selic (% a.a.)',
        data: [14.25, 10.0, 6.5, 5.0, 2.0, 4.25, 13.75, 13.25, 12.25, 14.25, 14.50],
        fill: true,
        backgroundColor: gradient,
        borderColor: COLORS.teal,
        borderWidth: 2.5,
        pointBackgroundColor: COLORS.teal,
        pointBorderColor: '#1A2030',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
        tension: 0.35,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `Selic: ${ctx.parsed.y.toFixed(2)}% a.a.`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            callback: v => v + '%',
            font: { family: "'JetBrains Mono', monospace", size: 11 }
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 } }
        }
      },
      animation: { duration: 1500, easing: 'easeOutQuart' }
    }
  });
}


// ── 5. Desemprego ──
function chartDesemprego() {
  const ctx = document.getElementById('chartDesemprego').getContext('2d');
  const gradient = createGradient(ctx, COLORS.successAlpha, 'rgba(91, 154, 114, 0.01)');

  buildChart(ctx, {
    type: 'line',
    data: {
      labels: ['2016', '2025 (média)', 'Nov-Jan/26', 'Fev/2026', 'Jun/2026*'],
      datasets: [{
        label: 'Desemprego (%)',
        data: [12.0, 5.1, 5.4, 5.8, 5.8],
        fill: true,
        backgroundColor: gradient,
        borderColor: COLORS.success,
        borderWidth: 2.5,
        pointBackgroundColor: (ctx) => {
          return ctx.dataIndex === 1 ? '#FFD700' : COLORS.success;
        },
        pointBorderColor: '#1A2030',
        pointBorderWidth: 2,
        pointRadius: (ctx) => ctx.dataIndex === 1 ? 8 : 5,
        pointHoverRadius: 10,
        tension: 0.35,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              let extra = ctx.dataIndex === 1 ? ' — MENOR DA HISTÓRIA' : '';
              return `Desemprego: ${ctx.parsed.y}%${extra}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 3,
          max: 14,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            callback: v => v + '%',
            font: { family: "'JetBrains Mono', monospace", size: 11 }
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 } }
        }
      },
      animation: { duration: 1500, easing: 'easeOutQuart' }
    }
  });
}


// ── 6. Bolsa Família — famílias beneficiárias (dez/ano, MDS/Ipeadata) ──
function chartBolsaFamilia() {
  const ctx = document.getElementById('chartBolsaFamilia').getContext('2d');
  const gradient = createGradient(ctx, COLORS.goldAlpha, 'rgba(196, 162, 101, 0.01)');

  buildChart(ctx, {
    type: 'line',
    data: {
      labels: ['2016', '2019', '2022', '2023', '2024', '2025', 'Abr/26'],
      datasets: [{
        label: 'Famílias (milhões)',
        data: [13.56, 13.24, 20.98, 20.88, 20.44, 18.62, 18.93],
        fill: true,
        backgroundColor: gradient,
        borderColor: COLORS.gold,
        borderWidth: 2.5,
        pointBackgroundColor: COLORS.gold,
        pointBorderColor: '#1A2030',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
        tension: 0.3,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y} milhões de famílias`,
            afterLabel: ctx => {
              if (ctx.dataIndex === 2) return 'Pico: Auxílio Brasil (eleição 2022)';
              if (ctx.dataIndex === 3) return 'Retorno ao nome Bolsa Família';
              return '';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 12,
          max: 22,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            callback: v => v + ' mi',
            font: { family: "'JetBrains Mono', monospace", size: 11 }
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: "'JetBrains Mono', monospace", size: 11 } }
        }
      },
      animation: { duration: 1500, easing: 'easeOutQuart' }
    }
  });
}


// ── 7. Resultado Primário (Governo Central) ──
function chartResultadoPrimario() {
  const canvas = document.getElementById('chartResultadoPrimario');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const years = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];
  const values = [-154.3, -124.0, -124.4, -94.6, -743.3, -35.9, 59.4, -230.5, -52.8, -61.7];

  buildChart(ctx, {
    type: 'bar',
    data: {
      labels: years,
      datasets: [{
        label: 'Resultado primário (R$ bi)',
        data: values,
        backgroundColor: values.map(v =>
          v >= 0 ? COLORS.successAlpha : COLORS.dangerAlpha
        ),
        borderColor: values.map(v =>
          v >= 0 ? COLORS.success : COLORS.danger
        ),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.75,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const val = ctx.parsed.y;
              const tipo = val >= 0 ? 'Superávit' : 'Déficit';
              return `${tipo}: R$ ${Math.abs(val).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} bi`;
            }
          }
        }
      },
      scales: {
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            callback: v => {
              const abs = Math.abs(v);
              return (v >= 0 ? '+' : '−') + abs + ' bi';
            },
            font: { family: "'JetBrains Mono', monospace", size: 10 }
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { family: "'JetBrains Mono', monospace", size: 10 },
            maxRotation: 45,
            minRotation: 45,
          }
        }
      },
      animation: { duration: 1500, easing: 'easeOutQuart' }
    }
  });
}


// ── 8. Endividamento Famílias 2026 ──
function chartEndividamento() {
  const ctx = document.getElementById('chartEndividamento').getContext('2d');
  const gradient = createGradient(ctx, COLORS.dangerAlpha, 'rgba(196, 82, 74, 0.01)');

  buildChart(ctx, {
    type: 'line',
    data: {
      labels: ['Mar', 'Abr', 'Mai', 'Jun'],
      datasets: [{
        label: 'Famílias endividadas (%)',
        data: [80.4, 80.9, 81.6, 81.6],
        fill: true,
        backgroundColor: gradient,
        borderColor: COLORS.danger,
        borderWidth: 2.5,
        pointBackgroundColor: (ctx) => {
          return ctx.dataIndex >= 2 ? '#FF6B6B' : COLORS.danger;
        },
        pointBorderColor: '#1A2030',
        pointBorderWidth: 2,
        pointRadius: (ctx) => ctx.dataIndex >= 2 ? 7 : 5,
        pointHoverRadius: 10,
        tension: 0.35,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              let extra = ctx.dataIndex >= 2 ? ' — RECORDE' : '';
              return `Endividadas: ${ctx.parsed.y}%${extra}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 40,
          max: 90,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            callback: v => v + '%',
            font: { family: "'JetBrains Mono', monospace", size: 11 }
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: "'JetBrains Mono', monospace", size: 12 } }
        }
      },
      animation: { duration: 1500, easing: 'easeOutQuart' }
    }
  });
}


// ── 9. Perfil do Endividamento ──
function chartPerfilDivida() {
  const ctx = document.getElementById('chartPerfilDivida').getContext('2d');

  buildChart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Cartão de crédito', 'Muitas dívidas', 'Pouco endividadas', 'Outros'],
      datasets: [{
        data: [84.6, 23, 46, 31],
        backgroundColor: [
          COLORS.danger,
          COLORS.warning,
          COLORS.teal,
          COLORS.slateAlpha,
        ],
        borderColor: '#1A2030',
        borderWidth: 3,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            font: { size: 11, family: "'Source Sans 3', system-ui, sans-serif" },
            color: '#A8B0C0',
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${ctx.parsed}%`
          }
        }
      },
      animation: {
        animateRotate: true,
        duration: 1500,
        easing: 'easeOutQuart',
      }
    }
  });
}


// ── 10. Mercado regulado de bets ──
function chartApostasMercado() {
  const el = document.getElementById('chartApostasMercado');
  if (!el) return;
  const ctx = el.getContext('2d');

  buildChart(ctx, {
    type: 'bar',
    data: {
      labels: ['Apostadores\n(milhões)', 'GGR\n(R$ bi)', 'Arrecadação\nfederal (R$ bi)', 'Empresas\nautorizadas', 'Sites ilegais\nbloqueados (mil)'],
      datasets: [{
        label: 'Indicador 2025',
        data: [25.2, 37, 9.95, 79, 25],
        backgroundColor: [
          COLORS.tealAlpha,
          COLORS.warningAlpha,
          COLORS.successAlpha,
          COLORS.slateAlpha,
          COLORS.dangerAlpha,
        ],
        borderColor: [
          COLORS.teal,
          COLORS.warning,
          COLORS.success,
          COLORS.slate,
          COLORS.danger,
        ],
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const labels = ['25,2 milhões', 'R$ 37 bi', 'R$ 9,95 bi', '79 empresas', '25 mil+'];
              return labels[ctx.dataIndex];
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { font: { family: "'JetBrains Mono', monospace", size: 11 } }
        },
        y: {
          grid: { display: false },
          ticks: { font: { family: "'Source Sans 3', system-ui, sans-serif", size: 11 } }
        }
      },
      animation: { duration: 1500, easing: 'easeOutQuart' }
    }
  });
}


// ── 11. Gasto mensal dos apostadores ──
function chartApostadoresGasto() {
  const el = document.getElementById('chartApostadoresGasto');
  if (!el) return;
  const ctx = el.getContext('2d');

  buildChart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Até R$ 50', 'R$ 50–100', 'R$ 100–150', 'R$ 150–200', 'R$ 200–300', 'Acima R$ 300'],
      datasets: [{
        data: [53.3, 7.4, 4.1, 2.7, 4.2, 28.3],
        backgroundColor: [
          COLORS.teal,
          COLORS.success,
          COLORS.warning,
          '#E8A838',
          COLORS.dangerAlpha,
          COLORS.danger,
        ],
        borderColor: '#1A2030',
        borderWidth: 3,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '55%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 12,
            font: { size: 10, family: "'Source Sans 3', system-ui, sans-serif" },
            color: '#A8B0C0',
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${ctx.parsed}% dos apostadores`
          }
        }
      },
      animation: {
        animateRotate: true,
        duration: 1500,
        easing: 'easeOutQuart',
      }
    }
  });
}


// ── 12. Ações de coerção e bloqueio ──
function chartCoercaoApostas() {
  const el = document.getElementById('chartCoercaoApostas');
  if (!el) return;
  const ctx = el.getContext('2d');

  const metrics = [
    { label: 'BF/BPC proibidos de cadastrar', value: 27, unit: 'mi' },
    { label: 'Contas encerradas (BF/BPC)', value: 2.8, unit: 'mi' },
    { label: 'Autoexclusões voluntárias', value: 925, unit: 'mil' },
    { label: 'Sites ilegais bloqueados', value: 25, unit: 'mil' },
    { label: 'Contas bancárias ilegais encerradas', value: 550, unit: '' },
  ];

  buildChart(ctx, {
    type: 'bar',
    data: {
      labels: metrics.map(m => m.label),
      datasets: [{
        label: 'Escala logarítmica (valores absolutos)',
        data: metrics.map(m => m.unit === 'mi' ? m.value * 1e6 : m.unit === 'mil' ? m.value * 1e3 : m.value),
        backgroundColor: [
          'rgba(196, 82, 74, 0.85)',
          'rgba(196, 82, 74, 0.65)',
          'rgba(212, 160, 74, 0.85)',
          'rgba(74, 155, 170, 0.85)',
          'rgba(107, 115, 133, 0.85)',
        ],
        borderColor: COLORS.danger,
        borderWidth: 0,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const m = metrics[ctx.dataIndex];
              const fmt = m.unit === 'mi' ? `${m.value} milhões` : m.unit === 'mil' ? `${m.value} mil` : `${m.value}`;
              return fmt;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'logarithmic',
          min: 100,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            callback: v => {
              if (v >= 1e6) return (v / 1e6) + ' mi';
              if (v >= 1e3) return (v / 1e3) + ' mil';
              return v;
            },
            font: { family: "'JetBrains Mono', monospace", size: 10 }
          }
        },
        y: {
          grid: { display: false },
          ticks: { font: { family: "'Source Sans 3', system-ui, sans-serif", size: 11 } }
        }
      },
      animation: { duration: 1500, easing: 'easeOutQuart' }
    }
  });
}


// ── 13. Lei Rouanet — renúncia fiscal efetiva ──
function chartRouanetCaptacao() {
  const el = document.getElementById('chartRouanetCaptacao');
  if (!el) return;
  const ctx = el.getContext('2d');
  const gradient = createGradient(ctx, COLORS.goldAlpha, 'rgba(196, 162, 101, 0.01)');

  buildChart(ctx, {
    type: 'line',
    data: {
      labels: ['2016', '2017*', '2018*', '2019*', '2020', '2021*', '2022', '2023', '2024'],
      datasets: [{
        label: 'Renúncia fiscal efetiva (R$ bi)',
        data: [1.3, 1.4, 1.6, 1.8, 2.3, 2.0, 2.1, 2.4, 3.0],
        fill: true,
        backgroundColor: gradient,
        borderColor: COLORS.gold,
        borderWidth: 2.5,
        pointBackgroundColor: COLORS.gold,
        pointBorderColor: '#1A2030',
        pointBorderWidth: 2,
        pointRadius: 5,
        tension: 0.35,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `R$ ${ctx.parsed.y.toFixed(1)} bi`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            callback: v => 'R$ ' + v + ' bi',
            font: { family: "'JetBrains Mono', monospace", size: 11 }
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 } }
        }
      },
      animation: { duration: 1500, easing: 'easeOutQuart' }
    }
  });
}


// ── 14. Lei Rouanet — multiplicador econômico ──
function chartRouanetRetorno() {
  const el = document.getElementById('chartRouanetRetorno');
  if (!el) return;
  const ctx = el.getContext('2d');

  buildChart(ctx, {
    type: 'bar',
    data: {
      labels: ['Movimentação na economia', 'Arrecadação tributária', 'Estudo 2018 (referência)'],
      datasets: [{
        label: 'R$ retornados por R$ 1 renunciado',
        data: [7.59, 1.39, 1.59],
        backgroundColor: [COLORS.teal, COLORS.success, COLORS.slateAlpha],
        borderColor: [COLORS.teal, COLORS.success, COLORS.slate],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `R$ ${ctx.parsed.y.toFixed(2)} por R$ 1,00`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            callback: v => 'R$ ' + v,
            font: { family: "'JetBrains Mono', monospace", size: 11 }
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: "'Source Sans 3', system-ui, sans-serif", size: 10 } }
        }
      },
      animation: { duration: 1500, easing: 'easeOutQuart' }
    }
  });
}


// ── 15. Lei Rouanet — perfil de gastos ──
function chartRouanetGastos() {
  const el = document.getElementById('chartRouanetGastos');
  if (!el) return;
  const ctx = el.getContext('2d');

  buildChart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Abaixo de R$ 5 mil', 'R$ 5 mil – R$ 10 mil', 'Acima de R$ 10 mil'],
      datasets: [{
        data: [78.5, 11.5, 10],
        backgroundColor: [COLORS.teal, COLORS.gold, COLORS.slateAlpha],
        borderColor: '#1A2030',
        borderWidth: 3,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '55%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 12, font: { size: 10 }, color: '#A8B0C0' }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${ctx.parsed}% dos pagamentos`
          }
        }
      },
      animation: { animateRotate: true, duration: 1500, easing: 'easeOutQuart' }
    },
    plugins: [{
      id: 'gastosCenter',
      afterDraw(chart) {
        const { ctx, width, height } = chart;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#E8E6E1';
        ctx.font = "600 22px 'JetBrains Mono', monospace";
        ctx.fillText('78,5%', width / 2, height / 2 - 8);
        ctx.fillStyle = '#A8B0C0';
        ctx.font = "400 10px 'Source Sans 3', system-ui, sans-serif";
        ctx.fillText('< R$ 5 mil', width / 2, height / 2 + 12);
        ctx.restore();
      }
    }]
  });
}


// ── 16. Economia criativa vs renúncia Rouanet ──
function chartCulturaEscala() {
  const el = document.getElementById('chartCulturaEscala');
  if (!el) return;
  const ctx = el.getContext('2d');

  buildChart(ctx, {
    type: 'bar',
    data: {
      labels: ['PIB economia criativa*', 'Movimentação Rouanet', 'Renúncia fiscal', 'Tributos gerados'],
      datasets: [{
        label: 'R$ bilhões (2024)',
        data: [220, 25.7, 3.0, 3.9],
        backgroundColor: [
          'rgba(196, 162, 101, 0.35)',
          COLORS.tealAlpha,
          COLORS.goldAlpha,
          COLORS.successAlpha,
        ],
        borderColor: [COLORS.gold, COLORS.teal, COLORS.gold, COLORS.success],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `R$ ${ctx.parsed.y.toFixed(1)} bi`
          }
        }
      },
      scales: {
        y: {
          type: 'logarithmic',
          min: 1,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            callback: v => 'R$ ' + v + ' bi',
            font: { family: "'JetBrains Mono', monospace", size: 11 }
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: "'Source Sans 3', system-ui, sans-serif", size: 10 } }
        }
      },
      animation: { duration: 1500, easing: 'easeOutQuart' }
    }
  });
}


// ── 17. Cultura e violência — comparativo internacional ──
function chartCulturaViolencia() {
  const el = document.getElementById('chartCulturaViolencia');
  if (!el) return;
  const ctx = el.getContext('2d');

  buildChart(ctx, {
    type: 'bar',
    data: {
      labels: ['Medellín (pico)', 'Medellín (atual)', 'Ciudad Juárez (pico)', 'Ciudad Juárez (atual)', 'Brasil (2024)'],
      datasets: [{
        label: 'Homicídios por 100 mil hab.',
        data: [395, 20, 130, 15, 20.1],
        backgroundColor: [
          COLORS.dangerAlpha,
          COLORS.success,
          COLORS.dangerAlpha,
          COLORS.success,
          COLORS.warning,
        ],
        borderColor: [
          COLORS.danger,
          COLORS.success,
          COLORS.danger,
          COLORS.success,
          COLORS.warning,
        ],
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y} homicídios/100 mil hab.`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            font: { family: "'JetBrains Mono', monospace", size: 11 }
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: "'Source Sans 3', system-ui, sans-serif", size: 10 } }
        }
      },
      animation: { duration: 1500, easing: 'easeOutQuart' }
    }
  });
}


/* ══════════════════════════════════════
   TABLE DRAG SCROLL (wide tables)
   ══════════════════════════════════════ */

function initTableDragScroll() {
  document.querySelectorAll('.table-card__scroll').forEach((container) => {
    observeTableScrollability(container);
    setupTableDragScroll(container);
  });
}

function observeTableScrollability(container) {
  const update = () => {
    const scrollable = container.scrollWidth > container.clientWidth + 2;
    container.classList.toggle('table-card__scroll--draggable', scrollable);
  };

  update();

  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(update);
    observer.observe(container);
    const table = container.querySelector('table');
    if (table) observer.observe(table);
  }

  window.addEventListener('resize', update, { passive: true });
}

function setupTableDragScroll(container) {
  let isDragging = false;
  let startX = 0;
  let startScrollLeft = 0;
  let hasMoved = false;

  const onMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) hasMoved = true;
    container.scrollLeft = startScrollLeft - dx;
  };

  const endDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    container.classList.remove('is-dragging');
    document.body.classList.remove('is-table-dragging');
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', endDrag);
  };

  container.addEventListener('mousedown', (e) => {
    if (!container.classList.contains('table-card__scroll--draggable')) return;
    if (e.button !== 0) return;
    if (e.target.closest('a, button, input, select, textarea, label')) return;

    isDragging = true;
    hasMoved = false;
    startX = e.clientX;
    startScrollLeft = container.scrollLeft;
    container.classList.add('is-dragging');
    document.body.classList.add('is-table-dragging');
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', endDrag);
  });

  container.addEventListener('click', (e) => {
    if (hasMoved) {
      e.preventDefault();
      e.stopImmediatePropagation();
      hasMoved = false;
    }
  }, true);

  container.addEventListener('dragstart', (e) => e.preventDefault());
}


/* ══════════════════════════════════════
   FLOATING ACTIONS — PDF & SHARE
   ══════════════════════════════════════ */

const SHARE_TITLE = 'Brasil 2016–2026 — Dados, Fake News e Realidade';
const SHARE_TEXT = 'Relatório analítico com dados oficiais sobre violência, economia, programas sociais e dívida pública no Brasil.';

function initFloatingActions() {
  const pdfBtn = document.getElementById('fabPdfBtn');
  const shareBtn = document.getElementById('fabShareBtn');
  const sharePanel = document.getElementById('fabSharePanel');
  const shareWhatsApp = document.getElementById('fabShareWhatsApp');
  const shareCopy = document.getElementById('fabShareCopy');

  if (!pdfBtn || !shareBtn) return;

  const pageUrl = window.location.href.split('#')[0];
  const whatsappMessage = `${SHARE_TITLE}\n\n${SHARE_TEXT}\n\n${pageUrl}`;
  shareWhatsApp.href = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  pdfBtn.addEventListener('click', handlePrintPdf);
  shareBtn.addEventListener('click', () => toggleSharePanel(shareBtn, sharePanel));
  shareCopy.addEventListener('click', () => copyShareLink(pageUrl));

  document.addEventListener('click', (e) => {
    if (!sharePanel || sharePanel.hidden) return;
    if (e.target.closest('.fab-actions')) return;
    closeSharePanel(shareBtn, sharePanel);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sharePanel && !sharePanel.hidden) {
      closeSharePanel(shareBtn, sharePanel);
    }
  });

  window.addEventListener('afterprint', restoreChartsAfterPrint);
}

function toggleSharePanel(btn, panel) {
  const isOpen = !panel.hidden;
  if (isOpen) {
    closeSharePanel(btn, panel);
  } else {
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
  }
}

function closeSharePanel(btn, panel) {
  panel.hidden = true;
  btn.setAttribute('aria-expanded', 'false');
}

async function copyShareLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    showFabToast('Link copiado!');
  } catch {
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showFabToast('Link copiado!');
  }
}

function showFabToast(message) {
  const toast = document.getElementById('fabToast');
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.add('is-visible');
  clearTimeout(showFabToast._timer);
  showFabToast._timer = setTimeout(() => {
    toast.classList.remove('is-visible');
    toast.hidden = true;
  }, 2600);
}

function forceRenderAllCharts() {
  chartRegistry.forEach((entry) => {
    if (!entry.rendered) {
      entry.createFn();
      entry.rendered = true;
    }
  });

  document.querySelectorAll('.chart-card__canvas-wrap--pending').forEach((wrap) => {
    wrap.classList.remove('chart-card__canvas-wrap--pending');
    wrap.classList.add('chart-card__canvas-wrap--revealed');
  });
}

function forEachChart(callback) {
  document.querySelectorAll('canvas').forEach((canvas) => {
    const chart = Chart.getChart(canvas);
    if (chart) callback(chart);
  });
}

function applyPrintChartTheme() {
  document.querySelectorAll('.chart-card__canvas-wrap, canvas').forEach((el) => {
    el.style.setProperty('background', '#ffffff', 'important');
  });

  forEachChart((chart) => {
    chart.$printBackup = {
      color: chart.options.color,
      legendColor: chart.options.plugins?.legend?.labels?.color,
      scales: {},
    };

    chart.options.animation = { duration: 0 };
    chart.options.color = '#444444';

    if (chart.options.plugins?.legend?.labels) {
      chart.options.plugins.legend.labels.color = '#222222';
    }

    Object.entries(chart.options.scales || {}).forEach(([key, scale]) => {
      chart.$printBackup.scales[key] = {
        tickColor: scale.ticks?.color,
        gridColor: scale.grid?.color,
      };
      if (scale.ticks) scale.ticks.color = '#555555';
      if (scale.grid) scale.grid.color = 'rgba(0, 0, 0, 0.1)';
    });

    chart.update('none');
  });
}

const PRINT_SURFACE_SELECTORS = [
  'section',
  '.hero',
  '.chart-card',
  '.table-card',
  '.factcheck',
  '.factcheck__fake',
  '.factcheck__real',
  '.analysis-box',
  '.context-box',
  '.key-number',
  '.data-highlight__item',
  '.program-card',
  '.program-card__header',
  '.section-sources',
  '.data-note',
  '.executive-summary',
  '.conclusion-card',
  '.recommendations',
  '.footer',
  '.concept-card',
  '.chart-card__canvas-wrap',
  'canvas',
];

function forcePrintSurfaces() {
  PRINT_SURFACE_SELECTORS.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.dataset.printBg = el.getAttribute('style') || '';
      el.style.setProperty('background', '#ffffff', 'important');
      el.style.setProperty('background-image', 'none', 'important');
      el.style.setProperty('box-shadow', 'none', 'important');
    });
  });
}

function restorePrintSurfaces() {
  PRINT_SURFACE_SELECTORS.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      if ('printBg' in el.dataset) {
        el.setAttribute('style', el.dataset.printBg);
        delete el.dataset.printBg;
      } else {
        el.style.removeProperty('background');
        el.style.removeProperty('background-image');
        el.style.removeProperty('box-shadow');
      }
    });
  });
}

function finalizeCountUpValues() {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseFloat(el.getAttribute('data-count'));
    if (Number.isNaN(target)) return;
    el.textContent = target % 1 !== 0
      ? target.toFixed(1)
      : Math.round(target).toLocaleString('pt-BR');
  });
}

function restoreChartsAfterPrint() {
  forEachChart((chart) => {
    const backup = chart.$printBackup;
    if (!backup) return;

    chart.options.color = backup.color;
    if (chart.options.plugins?.legend?.labels && backup.legendColor !== undefined) {
      chart.options.plugins.legend.labels.color = backup.legendColor;
    }

    Object.entries(chart.options.scales || {}).forEach(([key, scale]) => {
      const saved = backup.scales[key];
      if (!saved) return;
      if (scale.ticks && saved.tickColor !== undefined) scale.ticks.color = saved.tickColor;
      if (scale.grid && saved.gridColor !== undefined) scale.grid.color = saved.gridColor;
    });

    delete chart.$printBackup;
    chart.update('none');
  });

  restorePrintSurfaces();
  document.body.classList.remove('is-printing');
}

async function handlePrintPdf() {
  const pdfBtn = document.getElementById('fabPdfBtn');
  if (!pdfBtn || pdfBtn.classList.contains('is-loading')) return;

  pdfBtn.classList.add('is-loading');
  pdfBtn.setAttribute('aria-busy', 'true');

  try {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
    finalizeCountUpValues();
    forceRenderAllCharts();
    document.body.classList.add('is-printing');
    forcePrintSurfaces();
    applyPrintChartTheme();

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    window.print();
  } finally {
    pdfBtn.classList.remove('is-loading');
    pdfBtn.removeAttribute('aria-busy');
  }
}
