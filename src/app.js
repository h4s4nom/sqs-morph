(function () {
  'use strict';

  const VERSION = '0.2.1';
  const script = document.currentScript || document.getElementById('sqs-morph');
  if (!script) return;

  const token = String(script.dataset.token || '').trim();
  const debugEnabled = script.dataset.debug === 'true' || /(?:\?|&)sqm-debug=1(?:&|$)/.test(location.search);
  const scriptUrl = new URL(script.src, location.href);
  const baseUrl = scriptUrl.origin;

  const log = (...args) => debugEnabled && console.info('[SQS Morph]', ...args);
  const warn = (...args) => console.warn('[SQS Morph]', ...args);

  const state = {
    version: VERSION,
    token,
    baseUrl,
    config: null,
    modules: new Map(),
    mounted: [],
    startedAt: Date.now()
  };

  function emit(name, detail) {
    document.dispatchEvent(new CustomEvent('sqsmorph:' + name, { detail }));
  }

  function currentPathMatches(match) {
    if (!match) return true;
    const path = location.pathname;
    if (Array.isArray(match.paths) && match.paths.length) {
      return match.paths.some((pattern) => {
        if (pattern === '*') return true;
        if (pattern.endsWith('*')) return path.startsWith(pattern.slice(0, -1));
        return path === pattern;
      });
    }
    return true;
  }

  function previewOverride(feature) {
    const params = new URLSearchParams(location.search);
    if (feature.type === 'product-grid') {
      const preset = params.get('sqm-product');
      if (preset) return Object.assign({}, feature, { preset, enabled: true });
    }
    return feature;
  }

  async function fetchConfig() {
    if (!token) throw new Error('Missing data-token on SQS Morph script.');
    const url = `${baseUrl}/config/${encodeURIComponent(token)}.json?t=${Date.now()}`;
    const response = await fetch(url, { credentials: 'omit', mode: 'cors', cache: 'no-store' });
    if (!response.ok) throw new Error(`Config request failed (${response.status})`);
    const config = await response.json();
    if (!config || !Array.isArray(config.features)) throw new Error('Invalid config payload.');
    return config;
  }

  async function loadModule(type) {
    if (state.modules.has(type)) return state.modules.get(type);
    const moduleUrl = `${baseUrl}/modules/${encodeURIComponent(type)}.js?v=${VERSION}`;
    const mod = await import(moduleUrl);
    if (!mod || typeof mod.mount !== 'function') throw new Error(`Module ${type} has no mount() export.`);
    state.modules.set(type, mod);
    return mod;
  }

  async function mountFeature(rawFeature) {
    const feature = previewOverride(rawFeature);
    if (!feature || feature.enabled === false || !currentPathMatches(feature.match)) return;
    try {
      const mod = await loadModule(feature.type);
      const result = await mod.mount({
        feature,
        baseUrl,
        version: VERSION,
        debug: debugEnabled,
        log,
        emit
      });
      state.mounted.push({ type: feature.type, result });
      emit('feature-mounted', { feature, result });
    } catch (error) {
      warn(`Feature "${feature.type}" skipped:`, error);
      emit('feature-error', { feature, message: error.message });
    }
  }

  async function start() {
    if (window.__SQSMORPH_PRODUCT_RUNTIME__) {
      log('Runtime already present; skipping duplicate loader.');
      return;
    }
    window.__SQSMORPH_PRODUCT_RUNTIME__ = state;

    try {
      state.config = await fetchConfig();
      log('Config loaded', state.config);
      for (const feature of state.config.features) await mountFeature(feature);
      emit('ready', { version: VERSION, token, mounted: state.mounted.length });
    } catch (error) {
      warn(error.message);
      emit('error', { message: error.message });
    }
  }

  window.SQSMorph = Object.freeze({
    version: VERSION,
    state: () => ({
      version: state.version,
      token: state.token,
      config: state.config,
      mounted: state.mounted.map((x) => ({ type: x.type, result: x.result }))
    }),
    debug: () => ({
      script: script.src,
      baseUrl,
      token,
      path: location.pathname,
      productSections: Array.from(document.querySelectorAll('[data-sqsp-section="product-list"]')).map((section) => ({
        id: section.id || null,
        items: section.querySelectorAll('.product-list-item').length,
        layout: section.querySelector('.product-list-layout-container')?.getAttribute('data-product-list-layout') || null
      }))
    })
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
