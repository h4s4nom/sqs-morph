const STYLE_ID = 'sqsmorph-product-grid-styles';
const ROOT_SELECTOR = '[data-sqsp-section="product-list"]';
const ITEM_SELECTOR = '.product-list-item';
const CONTAINER_SELECTOR = '.product-list-layout-container';

const SUPPORTED_PRESETS = new Set([
  'bento-featured',
  'editorial-overlay',
  'split-catalog'
]);

function ensureStyles(baseUrl, version) {
  if (document.getElementById(STYLE_ID)) return;
  const link = document.createElement('link');
  link.id = STYLE_ID;
  link.rel = 'stylesheet';
  link.href = `${baseUrl}/styles/product-grid.css?v=${encodeURIComponent(version)}`;
  document.head.appendChild(link);
}

function selectSections(feature) {
  const sections = Array.from(document.querySelectorAll(ROOT_SELECTOR));
  const target = feature.target || { mode: 'all' };
  if (target.mode === 'anchor' && target.id) {
    return sections.filter((section) => section.id === target.id);
  }
  if (target.mode === 'index' && Number.isInteger(target.index)) {
    return sections[target.index] ? [sections[target.index]] : [];
  }
  return sections;
}

function getHealth(section) {
  const container = section.querySelector(CONTAINER_SELECTOR);
  const items = Array.from(section.querySelectorAll(ITEM_SELECTOR));
  const validItems = items.filter((item) => {
    const link = item.querySelector('a.product-list-item-link, a[href]');
    const meta = item.querySelector('.product-list-item-meta');
    const image = item.querySelector('img');
    return Boolean(link && meta && image);
  });

  const layout = container?.getAttribute('data-product-list-layout') || null;
  const ratio = items.length ? validItems.length / items.length : 0;
  const healthy = Boolean(container && items.length && ratio >= 0.8);

  return {
    healthy,
    layout,
    itemCount: items.length,
    validCount: validItems.length,
    reason: healthy ? null : !container ? 'missing-layout-container' : !items.length ? 'no-product-items' : 'unexpected-product-markup'
  };
}

function applyOptions(section, options = {}) {
  const numericPx = {
    gap: '--sqm-product-gap',
    radius: '--sqm-product-radius',
    metaPadding: '--sqm-product-meta-padding'
  };
  Object.entries(numericPx).forEach(([key, cssVar]) => {
    if (typeof options[key] === 'number') section.style.setProperty(cssVar, `${options[key]}px`);
  });
  if (typeof options.imageRatio === 'string' && /^\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?$/.test(options.imageRatio)) {
    section.style.setProperty('--sqm-product-ratio', options.imageRatio.replace(/\s+/g, ''));
  }
  if (typeof options.overlayOpacity === 'number') {
    const opacity = Math.min(0.95, Math.max(0, options.overlayOpacity));
    section.style.setProperty('--sqm-overlay-opacity', String(opacity));
  }
}

function decorate(section) {
  const items = Array.from(section.querySelectorAll(ITEM_SELECTOR));
  const count = items.length;
  const density = count <= 1 ? 'single' : count === 2 ? 'duo' : count === 3 ? 'trio' : 'bento';
  section.setAttribute('data-sqm-count', String(count));
  section.setAttribute('data-sqm-density', density);
  items.forEach((item, index) => {
    item.setAttribute('data-sqm-product-index', String(index + 1));
    item.setAttribute('data-sqm-product-label', String(index + 1).padStart(2, '0'));
  });
}

function apply(section, feature, ctx) {
  const health = getHealth(section);
  if (!health.healthy) {
    ctx.log('Product Grid health check failed', health, section);
    section.setAttribute('data-sqm-status', 'skipped');
    section.setAttribute('data-sqm-reason', health.reason || 'unknown');
    return { applied: false, health };
  }

  if (!SUPPORTED_PRESETS.has(feature.preset)) {
    return { applied: false, health, reason: `unsupported-preset:${feature.preset}` };
  }

  if (feature.preset === 'bento-featured' && health.layout && health.layout !== 'grid') {
    return { applied: false, health, reason: `bento-requires-grid-layout:${health.layout}` };
  }

  section.setAttribute('data-sqm-product', feature.preset);
  section.setAttribute('data-sqm-status', 'active');
  section.removeAttribute('data-sqm-reason');
  applyOptions(section, feature.options || {});
  decorate(section);

  return { applied: true, health, preset: feature.preset, sectionId: section.id || null };
}

function observe(sections, feature, ctx) {
  let timer = null;
  const observer = new MutationObserver((mutations) => {
    const relevant = mutations.some((m) => m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length));
    if (!relevant) return;
    clearTimeout(timer);
    timer = setTimeout(() => sections.forEach((section) => apply(section, feature, ctx)), 120);
  });
  sections.forEach((section) => observer.observe(section, { childList: true, subtree: true }));
  return observer;
}

export async function mount(ctx) {
  ensureStyles(ctx.baseUrl, ctx.version);
  const sections = selectSections(ctx.feature);
  if (!sections.length) {
    return { applied: 0, skipped: 0, reason: 'no-product-list-sections' };
  }

  const results = sections.map((section) => apply(section, ctx.feature, ctx));
  const observer = observe(sections, ctx.feature, ctx);

  return {
    applied: results.filter((x) => x.applied).length,
    skipped: results.filter((x) => !x.applied).length,
    results,
    stop: () => observer.disconnect()
  };
}
