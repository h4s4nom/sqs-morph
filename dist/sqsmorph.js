/* SQS Morph v0.1.0 | Squarespace 7.1 structured component skin runtime */
(function (global) {
  'use strict';
  const NS = global.__SQSMORPH__ = global.__SQSMORPH__ || {};
  NS.version = '0.1.0';
  NS.state = NS.state || {
    components: new Map(),
    selectedId: null,
    observer: null,
    designer: null,
    initialized: false,
    scanTimer: null
  };
  NS.utils = NS.utils || {};
  NS.adapters = NS.adapters || [];
  NS.presets = NS.presets || {};
})(window);


(function (global) {
  'use strict';
  const NS = global.__SQSMORPH__;

  function cssEscape(value) {
    if (global.CSS && typeof global.CSS.escape === 'function') return global.CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function hashString(input) {
    let h = 2166136261;
    const s = String(input || '');
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  function pathFor(el) {
    if (!el || el.nodeType !== 1) return null;
    if (el.id) return '#' + cssEscape(el.id);
    const sectionId = el.getAttribute('data-section-id');
    if (sectionId) return '[data-section-id="' + String(sectionId).replace(/"/g, '\\"') + '"]';
    const blockId = el.getAttribute('data-block-id');
    if (blockId) return '[data-block-id="' + String(blockId).replace(/"/g, '\\"') + '"]';

    const parts = [];
    let node = el;
    while (node && node !== document.body && parts.length < 5) {
      const tag = node.tagName.toLowerCase();
      const parent = node.parentElement;
      if (!parent) break;
      const siblings = Array.from(parent.children).filter((x) => x.tagName === node.tagName);
      const idx = siblings.indexOf(node) + 1;
      parts.unshift(tag + ':nth-of-type(' + idx + ')');
      node = parent;
    }
    return 'body > ' + parts.join(' > ');
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function debounce(fn, wait) {
    let t;
    return function () {
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(null, args); }, wait);
    };
  }

  function mergeTokens(base, overrides) {
    return Object.assign({}, base || {}, overrides || {});
  }

  function safeQuery(selector, root) {
    try { return (root || document).querySelector(selector); } catch (e) { return null; }
  }

  function safeQueryAll(selector, root) {
    try { return Array.from((root || document).querySelectorAll(selector)); } catch (e) { return []; }
  }

  function pageKey() {
    return location.pathname.replace(/\/+$/, '') || '/';
  }

  function storageKey() {
    return 'sqsmorph:config:' + location.host + ':' + pageKey();
  }

  function getLocalConfig() {
    try {
      const raw = localStorage.getItem(storageKey());
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function setLocalConfig(config) {
    try {
      localStorage.setItem(storageKey(), JSON.stringify(config));
      return true;
    } catch (e) { return false; }
  }

  function revisionKey() {
    return 'sqsmorph:revisions:' + location.host + ':' + pageKey();
  }

  function getRevisions() {
    try {
      const raw = localStorage.getItem(revisionKey());
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function pushRevision(config) {
    try {
      const revisions = getRevisions();
      const snapshot = { savedAt: new Date().toISOString(), config: deepClone(config) };
      const last = revisions[revisions.length - 1];
      if (!last || JSON.stringify(last.config) !== JSON.stringify(snapshot.config)) revisions.push(snapshot);
      while (revisions.length > 10) revisions.shift();
      localStorage.setItem(revisionKey(), JSON.stringify(revisions));
      return revisions;
    } catch (e) { return []; }
  }

  function popRevision() {
    try {
      const revisions = getRevisions();
      if (revisions.length < 2) return null;
      revisions.pop();
      const previous = revisions[revisions.length - 1] || null;
      localStorage.setItem(revisionKey(), JSON.stringify(revisions));
      return previous;
    } catch (e) { return null; }
  }

  NS.utils = Object.assign(NS.utils, {
    cssEscape, hashString, pathFor, deepClone, debounce, mergeTokens,
    safeQuery, safeQueryAll, pageKey, storageKey, getLocalConfig, setLocalConfig,
    revisionKey, getRevisions, pushRevision, popRevision
  });
})(window);


(function (global) {
  'use strict';
  const NS = global.__SQSMORPH__;
  const U = NS.utils;

  function registerAdapter(adapter) {
    if (!adapter || !adapter.type || typeof adapter.find !== 'function') throw new Error('Invalid SQS Morph adapter');
    NS.adapters.push(adapter);
  }

  function componentId(adapter, el) {
    const locator = U.pathFor(el) || adapter.type;
    return adapter.type + '-' + U.hashString(location.pathname + '|' + locator);
  }

  function scan() {
    const found = new Map();
    NS.adapters.forEach(function (adapter) {
      let elements = [];
      try { elements = adapter.find(document) || []; } catch (e) { elements = []; }
      elements.forEach(function (el) {
        if (!(el instanceof Element)) return;
        const id = componentId(adapter, el);
        const locator = U.pathFor(el);
        const health = typeof adapter.health === 'function' ? adapter.health(el) : { status: 'healthy', notes: [] };
        const component = {
          id,
          type: adapter.type,
          label: adapter.label || adapter.type,
          element: el,
          locator,
          health,
          adapter
        };
        el.setAttribute('data-sqsmorph-component', id);
        el.setAttribute('data-sqsmorph-type', adapter.type);
        found.set(id, component);
      });
    });
    NS.state.components = found;
    document.dispatchEvent(new CustomEvent('sqsmorph:scan', { detail: { components: Array.from(found.values()) } }));
    return Array.from(found.values());
  }

  function resolveByLocator(locator) {
    return U.safeQuery(locator);
  }

  NS.registry = { registerAdapter, scan, resolveByLocator };
})(window);


(function (global) {
  'use strict';
  const NS = global.__SQSMORPH__;
  const U = NS.utils;

  const TOKEN_TO_CSS = {
    radius: '--sqm-radius',
    gap: '--sqm-gap',
    fontScale: '--sqm-font-scale',
    mediaRatio: '--sqm-media-ratio',
    cardPadding: '--sqm-card-padding',
    shadow: '--sqm-shadow',
    borderWidth: '--sqm-border-width',
    imageRadius: '--sqm-image-radius'
  };

  function getPreset(componentType, presetId) {
    const list = NS.presets[componentType] || [];
    return list.find(function (p) { return p.id === presetId; }) || null;
  }

  function clearClasses(el) {
    Array.from(el.classList).forEach(function (name) {
      if (name.indexOf('sqm-skin-') === 0 || name.indexOf('sqm-semantic-') === 0) el.classList.remove(name);
    });
    Object.keys(TOKEN_TO_CSS).forEach(function (key) { el.style.removeProperty(TOKEN_TO_CSS[key]); });
    el.removeAttribute('data-sqsmorph-preset');
    el.removeAttribute('data-sqsmorph-semantic');
  }

  function applyTokens(el, tokens) {
    Object.keys(tokens || {}).forEach(function (key) {
      const prop = TOKEN_TO_CSS[key];
      if (!prop) return;
      let val = tokens[key];
      if (val === null || typeof val === 'undefined' || val === '') return;
      if (key === 'radius' || key === 'gap' || key === 'cardPadding' || key === 'borderWidth' || key === 'imageRadius') {
        if (typeof val === 'number') val = val + 'px';
      }
      if (key === 'fontScale' && typeof val === 'number') val = String(val);
      el.style.setProperty(prop, String(val));
    });
  }

  function applyRule(rule) {
    if (!rule || !rule.locator || !rule.preset) return { ok: false, reason: 'invalid-rule' };
    const el = U.safeQuery(rule.locator);
    if (!el) return { ok: false, reason: 'not-found' };
    const type = rule.type || el.getAttribute('data-sqsmorph-type');
    const preset = getPreset(type, rule.preset);
    if (!preset) return { ok: false, reason: 'preset-not-found' };

    clearClasses(el);
    el.classList.add('sqm-enabled', 'sqm-skin-' + preset.id);
    if (rule.semantic) {
      el.classList.add('sqm-semantic-' + rule.semantic);
      el.setAttribute('data-sqsmorph-semantic', rule.semantic);
    }
    el.setAttribute('data-sqsmorph-preset', preset.id);
    applyTokens(el, U.mergeTokens(preset.tokens, rule.tokens));
    return { ok: true, element: el, preset: preset };
  }

  function disableByElement(el) {
    if (!el) return;
    clearClasses(el);
    el.classList.remove('sqm-enabled');
  }

  function applyConfig(config) {
    const rules = (config && Array.isArray(config.rules)) ? config.rules : [];
    const results = rules.map(applyRule);
    document.dispatchEvent(new CustomEvent('sqsmorph:config-applied', { detail: { results: results } }));
    return results;
  }

  function collectCurrentRules() {
    return Array.from(document.querySelectorAll('[data-sqsmorph-preset]')).map(function (el) {
      const type = el.getAttribute('data-sqsmorph-type');
      const tokens = {};
      Object.keys(TOKEN_TO_CSS).forEach(function (key) {
        const val = el.style.getPropertyValue(TOKEN_TO_CSS[key]);
        if (val) tokens[key] = val;
      });
      return {
        locator: U.pathFor(el),
        type: type,
        preset: el.getAttribute('data-sqsmorph-preset'),
        semantic: el.getAttribute('data-sqsmorph-semantic') || undefined,
        tokens: tokens
      };
    });
  }

  NS.engine = { getPreset, applyRule, applyConfig, disableByElement, collectCurrentRules, clearClasses };
})(window);


(function (global) {
  'use strict';
  const NS = global.__SQSMORPH__;
  NS.registry.registerAdapter({
    type: 'product-list',
    label: 'Product List',
    find: function (root) { return Array.from(root.querySelectorAll('[data-sqsp-section="product-list"]')); },
    health: function (el) {
      const items = el.querySelectorAll('.product-list-item, [data-product-id]');
      return items.length ? { status: 'healthy', notes: [items.length + ' product items'] } : { status: 'degraded', notes: ['No product-list items detected'] };
    }
  });
})(window);


(function (global) {
  'use strict';
  const NS = global.__SQSMORPH__;
  NS.registry.registerAdapter({
    type: 'product-detail',
    label: 'Product Detail',
    find: function (root) { return Array.from(root.querySelectorAll('[data-sqsp-section="product-detail"]')); },
    health: function (el) {
      const hasImage = !!el.querySelector('img');
      const hasPrice = !!el.querySelector('.product-price, .product-price-value, [class*="price"]');
      return hasImage ? { status: hasPrice ? 'healthy' : 'degraded', notes: hasPrice ? [] : ['Price mapping not confirmed'] } : { status: 'degraded', notes: ['Product image not found'] };
    }
  });
})(window);


(function (global) {
  'use strict';
  const NS = global.__SQSMORPH__;
  NS.registry.registerAdapter({
    type: 'summary',
    label: 'Summary Block',
    find: function (root) { return Array.from(root.querySelectorAll('[data-sqsp-block="summary"]')); },
    health: function (el) {
      const items = el.querySelectorAll('.summary-item, [class*="summary-item"]');
      return items.length ? { status: 'healthy', notes: [items.length + ' summary items'] } : { status: 'degraded', notes: ['No summary items detected'] };
    }
  });
})(window);


(function (global) {
  'use strict';
  const NS = global.__SQSMORPH__;
  NS.registry.registerAdapter({
    type: 'auto-layout',
    label: 'Auto Layout',
    find: function (root) { return Array.from(root.querySelectorAll('[data-sqsp-section="auto-layout"]')); },
    health: function (el) {
      const items = el.querySelectorAll('.list-item, [class*="list-item"]');
      return items.length ? { status: 'healthy', notes: [items.length + ' list items'] } : { status: 'degraded', notes: ['Auto Layout found but item mapping is uncertain'] };
    }
  });
})(window);


(function (global) {
  'use strict';
  const NS = global.__SQSMORPH__;
  NS.presets = {
    'product-list': [
      { id: 'product-minimal', name: 'Minimal Commerce', tokens: { radius: 0, gap: 24, fontScale: 1, imageRadius: 0 } },
      { id: 'product-editorial', name: 'Luxury Editorial', tokens: { radius: 22, gap: 30, fontScale: 1.04, imageRadius: 22, shadow: '0 18px 50px rgba(0,0,0,.08)' } },
      { id: 'product-hover', name: 'Hover Reveal', tokens: { radius: 18, gap: 20, fontScale: 1, imageRadius: 18, shadow: '0 14px 40px rgba(0,0,0,.10)' } },
      { id: 'product-compact', name: 'Compact Catalog', tokens: { radius: 12, gap: 14, fontScale: .94, imageRadius: 10 } }
    ],
    'product-detail': [
      { id: 'detail-sticky', name: 'Sticky Product Sheet', tokens: { radius: 20, gap: 36, fontScale: 1, imageRadius: 16 } },
      { id: 'detail-editorial', name: 'Editorial Split', tokens: { radius: 0, gap: 56, fontScale: 1.08, imageRadius: 0 } },
      { id: 'detail-luxe', name: 'Minimal Luxe', tokens: { radius: 28, gap: 40, fontScale: 1.03, imageRadius: 28, shadow: '0 22px 60px rgba(0,0,0,.08)' } }
    ],
    'summary': [
      { id: 'summary-magazine', name: 'Magazine Grid', tokens: { radius: 0, gap: 28, fontScale: 1.02, imageRadius: 0 } },
      { id: 'summary-cards', name: 'Floating Cards', tokens: { radius: 20, gap: 22, fontScale: 1, imageRadius: 15, cardPadding: 18, shadow: '0 18px 45px rgba(0,0,0,.08)' } },
      { id: 'summary-edge', name: 'Borderless Editorial', tokens: { radius: 0, gap: 18, fontScale: .98, imageRadius: 0 } },
      { id: 'summary-featured', name: 'Featured First', tokens: { radius: 18, gap: 26, fontScale: 1, imageRadius: 18 } }
    ],
    'auto-layout': [
      { id: 'team-editorial', name: 'Editorial Team', semantic: 'team', tokens: { radius: 0, gap: 28, fontScale: 1, imageRadius: 0 } },
      { id: 'team-hover', name: 'Hover Bio Team', semantic: 'team', tokens: { radius: 24, gap: 22, fontScale: 1, imageRadius: 24, shadow: '0 18px 45px rgba(0,0,0,.10)' } },
      { id: 'testimonial-luxe', name: 'Luxury Quote', semantic: 'testimonial', tokens: { radius: 22, gap: 24, fontScale: 1.05, cardPadding: 28, shadow: '0 16px 45px rgba(0,0,0,.07)' } },
      { id: 'testimonial-spotlight', name: 'Spotlight Testimonial', semantic: 'testimonial', tokens: { radius: 28, gap: 30, fontScale: 1.08, cardPadding: 34, shadow: '0 22px 60px rgba(0,0,0,.08)' } },
      { id: 'auto-glass', name: 'Glass Cards', semantic: 'generic', tokens: { radius: 24, gap: 24, fontScale: 1, cardPadding: 24, shadow: '0 18px 50px rgba(0,0,0,.10)' } }
    ]
  };
})(window);


(function (global) {
  'use strict';
  const NS = global.__SQSMORPH__;
  const U = NS.utils;

  function injectDesignerStyles(shadow) {
    const style = document.createElement('style');
    style.textContent = `
      :host{all:initial;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .panel{position:fixed;right:18px;bottom:18px;width:340px;max-height:78vh;overflow:auto;background:#101114;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:18px;box-shadow:0 28px 80px rgba(0,0,0,.35);z-index:2147483647;padding:16px}
      .top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.brand{font-weight:800;font-size:15px}.sub{font-size:11px;color:#9ea3ad}
      button,select,input{font:inherit}.close{background:transparent;color:#fff;border:0;font-size:20px;cursor:pointer}
      .status{font-size:12px;padding:9px 10px;border-radius:10px;background:#1b1d22;margin-bottom:12px;color:#c9cbd1}
      .row{margin:12px 0}.label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#8f95a1;margin-bottom:7px}
      select{width:100%;background:#181a1f;color:#fff;border:1px solid #343842;border-radius:10px;padding:10px}
      .presets{display:grid;grid-template-columns:1fr 1fr;gap:8px}.preset{background:#191b20;color:#fff;border:1px solid #343842;border-radius:12px;padding:10px;text-align:left;cursor:pointer;font-size:12px}.preset.active{border-color:#fff;background:#262933}
      .range{display:grid;grid-template-columns:1fr 52px;gap:10px;align-items:center}.range input[type=range]{width:100%}.value{font-size:11px;color:#b9bdc7;text-align:right}
      .actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}.btn{border:0;border-radius:11px;padding:10px 12px;cursor:pointer;font-weight:700}.primary{background:#fff;color:#111}.secondary{background:#23262d;color:#fff}.danger{background:#442329;color:#ffdbe1}.wide{grid-column:1/-1}
      .hint{font-size:11px;color:#8f95a1;line-height:1.45;margin-top:10px}.health{font-size:11px;color:#9ad7b5}.health.degraded{color:#ffce86}
      textarea{box-sizing:border-box;width:100%;min-height:190px;background:#0c0d10;color:#e9ebef;border:1px solid #353945;border-radius:10px;padding:10px;font:11px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;resize:vertical}
      .hidden{display:none}
    `;
    shadow.appendChild(style);
  }

  function setOutlines(enabled) {
    document.documentElement.classList.toggle('sqm-designer-active', !!enabled);
  }

  function selectComponent(id) {
    NS.state.selectedId = id;
    Array.from(document.querySelectorAll('[data-sqsmorph-selected]')).forEach(function (el) { el.removeAttribute('data-sqsmorph-selected'); });
    const c = NS.state.components.get(id);
    if (c) c.element.setAttribute('data-sqsmorph-selected', 'true');
    renderPanel();
  }

  function currentRuleFor(c) {
    if (!c) return null;
    return {
      locator: c.locator,
      type: c.type,
      preset: c.element.getAttribute('data-sqsmorph-preset') || '',
      semantic: c.element.getAttribute('data-sqsmorph-semantic') || '',
      tokens: {
        radius: parseFloat(c.element.style.getPropertyValue('--sqm-radius')) || undefined,
        gap: parseFloat(c.element.style.getPropertyValue('--sqm-gap')) || undefined,
        fontScale: parseFloat(c.element.style.getPropertyValue('--sqm-font-scale')) || undefined,
        cardPadding: parseFloat(c.element.style.getPropertyValue('--sqm-card-padding')) || undefined,
        imageRadius: parseFloat(c.element.style.getPropertyValue('--sqm-image-radius')) || undefined
      }
    };
  }

  function applyFromControls(panel, component) {
    if (!component) return;
    const preset = panel.querySelector('[data-active-preset]') ? panel.querySelector('[data-active-preset]').getAttribute('data-active-preset') : (component.element.getAttribute('data-sqsmorph-preset') || '');
    if (!preset) return;
    const semanticSelect = panel.querySelector('#sqm-semantic');
    const rule = {
      locator: component.locator,
      type: component.type,
      preset: preset,
      semantic: semanticSelect ? semanticSelect.value : undefined,
      tokens: {
        radius: Number(panel.querySelector('#sqm-radius').value),
        gap: Number(panel.querySelector('#sqm-gap').value),
        fontScale: Number(panel.querySelector('#sqm-font').value),
        cardPadding: Number(panel.querySelector('#sqm-padding').value),
        imageRadius: Number(panel.querySelector('#sqm-image-radius').value)
      }
    };
    NS.engine.applyRule(rule);
  }

  function saveCurrent() {
    const config = { version: 1, page: U.pageKey(), rules: NS.engine.collectCurrentRules() };
    U.setLocalConfig(config);
    U.pushRevision(config);
    return config;
  }

  function rollbackDraft() {
    const previous = U.popRevision();
    if (!previous || !previous.config) return false;
    document.querySelectorAll('.sqm-enabled').forEach(function (el) { NS.engine.disableByElement(el); });
    U.setLocalConfig(previous.config);
    NS.engine.applyConfig(previous.config);
    return true;
  }

  function nativePreview(enabled) {
    document.documentElement.classList.toggle('sqm-native-preview', !!enabled);
  }

  function exportConfigText() {
    const config = saveCurrent();
    return '<script>window.SQSMORPH_CONFIG=' + JSON.stringify(config, null, 2).replace(/<\/script/gi, '<\\/script') + ';</script>';
  }

  function renderPanel() {
    const d = NS.state.designer;
    if (!d) return;
    const panel = d.panel;
    const component = NS.state.components.get(NS.state.selectedId);
    const count = NS.state.components.size;
    const status = panel.querySelector('.status');
    const editor = panel.querySelector('.editor');
    if (!component) {
      status.textContent = 'Detected ' + count + ' supported component' + (count === 1 ? '' : 's') + '. Click any highlighted section.';
      editor.classList.add('hidden');
      return;
    }
    editor.classList.remove('hidden');
    status.textContent = component.label + ' • ' + (component.locator || 'unstable locator');
    const health = panel.querySelector('.health');
    health.textContent = 'Adapter: ' + component.health.status + (component.health.notes.length ? ' — ' + component.health.notes.join(', ') : '');
    health.className = 'health ' + (component.health.status === 'healthy' ? '' : 'degraded');

    const semanticWrap = panel.querySelector('.semantic-wrap');
    semanticWrap.classList.toggle('hidden', component.type !== 'auto-layout');
    const current = currentRuleFor(component);
    const semantic = current.semantic || 'generic';
    panel.querySelector('#sqm-semantic').value = semantic;

    const presets = (NS.presets[component.type] || []).filter(function (p) {
      if (component.type !== 'auto-layout') return true;
      return semantic === 'generic' || p.semantic === semantic || p.semantic === 'generic';
    });
    const holder = panel.querySelector('.presets');
    holder.innerHTML = '';
    presets.forEach(function (p) {
      const b = document.createElement('button');
      b.className = 'preset' + (current.preset === p.id ? ' active' : '');
      b.textContent = p.name;
      b.setAttribute('data-active-preset', p.id);
      b.addEventListener('click', function () {
        holder.querySelectorAll('.preset').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        holder.setAttribute('data-active-preset', p.id);
        const preset = NS.engine.getPreset(component.type, p.id);
        const t = preset.tokens || {};
        setControlValues(panel, t);
        applyFromControlsProxy(panel, component, p.id);
      });
      holder.appendChild(b);
    });
    const visibleCurrent = presets.find(function (p) { return p.id === current.preset; });
    const resolvedPresetId = (visibleCurrent && visibleCurrent.id) || (presets[0] && presets[0].id) || '';
    holder.setAttribute('data-active-preset', resolvedPresetId);

    const activePreset = (visibleCurrent || presets[0]) || { tokens: {} };
    setControlValues(panel, Object.assign({}, activePreset.tokens, current.tokens));
  }

  function setControlValues(panel, t) {
    const vals = {
      '#sqm-radius': numberValue(t.radius, 18),
      '#sqm-gap': numberValue(t.gap, 24),
      '#sqm-font': numberValue(t.fontScale, 1),
      '#sqm-padding': numberValue(t.cardPadding, 22),
      '#sqm-image-radius': numberValue(t.imageRadius, t.radius || 18)
    };
    Object.keys(vals).forEach(function (sel) {
      const el = panel.querySelector(sel);
      if (!el) return;
      el.value = vals[sel];
      const value = el.parentElement.querySelector('.value');
      if (value) value.textContent = String(vals[sel]);
    });
  }

  function numberValue(v, fallback) {
    if (typeof v === 'number') return v;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function applyFromControlsProxy(panel, component, presetId) {
    const holder = panel.querySelector('.presets');
    holder.setAttribute('data-active-preset', presetId);
    const semanticSelect = panel.querySelector('#sqm-semantic');
    const rule = {
      locator: component.locator,
      type: component.type,
      preset: presetId,
      semantic: semanticSelect ? semanticSelect.value : undefined,
      tokens: {
        radius: Number(panel.querySelector('#sqm-radius').value),
        gap: Number(panel.querySelector('#sqm-gap').value),
        fontScale: Number(panel.querySelector('#sqm-font').value),
        cardPadding: Number(panel.querySelector('#sqm-padding').value),
        imageRadius: Number(panel.querySelector('#sqm-image-radius').value)
      }
    };
    NS.engine.applyRule(rule);
  }

  function enable() {
    if (NS.state.designer) return;
    NS.registry.scan();
    setOutlines(true);
    const host = document.createElement('div');
    host.id = 'sqsmorph-designer-host';
    document.documentElement.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    injectDesignerStyles(shadow);

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `
      <div class="top"><div><div class="brand">SQS Morph Designer</div><div class="sub">v${NS.version}</div></div><button class="close" title="Close">×</button></div>
      <div class="status">Scanning…</div>
      <div class="editor hidden">
        <div class="health"></div>
        <div class="row semantic-wrap hidden"><label class="label">Auto Layout Type</label><select id="sqm-semantic"><option value="generic">Generic</option><option value="team">Team</option><option value="testimonial">Testimonial</option></select></div>
        <div class="row"><label class="label">Design Preset</label><div class="presets"></div></div>
        <div class="row"><label class="label">Corner Radius</label><div class="range"><input id="sqm-radius" type="range" min="0" max="40" step="1"><span class="value"></span></div></div>
        <div class="row"><label class="label">Gap</label><div class="range"><input id="sqm-gap" type="range" min="8" max="64" step="1"><span class="value"></span></div></div>
        <div class="row"><label class="label">Type Scale</label><div class="range"><input id="sqm-font" type="range" min="0.85" max="1.25" step="0.01"><span class="value"></span></div></div>
        <div class="row"><label class="label">Card Padding</label><div class="range"><input id="sqm-padding" type="range" min="0" max="48" step="1"><span class="value"></span></div></div>
        <div class="row"><label class="label">Image Radius</label><div class="range"><input id="sqm-image-radius" type="range" min="0" max="40" step="1"><span class="value"></span></div></div>
        <div class="actions"><button class="btn secondary" id="sqm-save">Save Draft</button><button class="btn secondary" id="sqm-rollback">Rollback Draft</button><button class="btn secondary wide" id="sqm-native">Preview Native</button><button class="btn danger wide" id="sqm-disable">Disable Selected Skin</button><button class="btn primary wide" id="sqm-export">Export Publish Config</button></div>
        <div class="row hidden" id="sqm-export-wrap"><label class="label">Paste this before sqsmorph.js in Code Injection</label><textarea id="sqm-export-text"></textarea></div>
        <div class="hint">This MVP stores drafts in this browser. Export the publish config to make the same design load for visitors.</div>
      </div>`;
    shadow.appendChild(panel);
    NS.state.designer = { host: host, shadow: shadow, panel: panel };

    panel.querySelector('.close').addEventListener('click', disable);
    panel.querySelector('#sqm-semantic').addEventListener('change', function () { renderPanel(); });
    ['#sqm-radius','#sqm-gap','#sqm-font','#sqm-padding','#sqm-image-radius'].forEach(function (sel) {
      panel.querySelector(sel).addEventListener('input', function (e) {
        const v = e.target.parentElement.querySelector('.value');
        if (v) v.textContent = e.target.value;
        const c = NS.state.components.get(NS.state.selectedId);
        const presetId = panel.querySelector('.presets').getAttribute('data-active-preset');
        if (c && presetId) applyFromControlsProxy(panel, c, presetId);
      });
    });
    panel.querySelector('#sqm-save').addEventListener('click', function () {
      saveCurrent();
      panel.querySelector('#sqm-save').textContent = 'Saved';
      setTimeout(function () { panel.querySelector('#sqm-save').textContent = 'Save Draft'; }, 1000);
    });
    panel.querySelector('#sqm-rollback').addEventListener('click', function () {
      const ok = rollbackDraft();
      panel.querySelector('#sqm-rollback').textContent = ok ? 'Restored' : 'No Revision';
      setTimeout(function () { panel.querySelector('#sqm-rollback').textContent = 'Rollback Draft'; }, 1200);
      renderPanel();
    });
    panel.querySelector('#sqm-native').addEventListener('click', function () {
      const active = document.documentElement.classList.toggle('sqm-native-preview');
      panel.querySelector('#sqm-native').textContent = active ? 'Show SQS Morph' : 'Preview Native';
    });
    panel.querySelector('#sqm-disable').addEventListener('click', function () {
      const c = NS.state.components.get(NS.state.selectedId);
      if (c) NS.engine.disableByElement(c.element);
      renderPanel();
    });
    panel.querySelector('#sqm-export').addEventListener('click', function () {
      const wrap = panel.querySelector('#sqm-export-wrap');
      const txt = panel.querySelector('#sqm-export-text');
      txt.value = exportConfigText();
      wrap.classList.remove('hidden');
      txt.focus(); txt.select();
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt.value).catch(function () {});
    });

    const clickHandler = function (e) {
      if (e.composedPath && e.composedPath().indexOf(host) >= 0) return;
      const target = e.target.closest && e.target.closest('[data-sqsmorph-component]');
      if (!target) return;
      e.preventDefault(); e.stopPropagation();
      selectComponent(target.getAttribute('data-sqsmorph-component'));
    };
    document.addEventListener('click', clickHandler, true);
    NS.state.designer.clickHandler = clickHandler;
    renderPanel();
  }

  function disable() {
    const d = NS.state.designer;
    if (!d) return;
    setOutlines(false);
    nativePreview(false);
    document.removeEventListener('click', d.clickHandler, true);
    Array.from(document.querySelectorAll('[data-sqsmorph-selected]')).forEach(function (el) { el.removeAttribute('data-sqsmorph-selected'); });
    d.host.remove();
    NS.state.designer = null;
  }

  NS.designer = { enable, disable, renderPanel, saveCurrent, rollbackDraft, nativePreview, exportConfigText };
})(window);


(function (global) {
  'use strict';
  const NS = global.__SQSMORPH__;
  const U = NS.utils;

  function activeConfig() {
    return global.SQSMORPH_CONFIG || U.getLocalConfig() || { version: 1, rules: [] };
  }

  function init(options) {
    if (NS.state.initialized) return global.SQSMorph;
    NS.state.initialized = true;
    const opts = options || {};

    function scanAndApply() {
      NS.registry.scan();
      NS.engine.applyConfig(activeConfig());
      if (NS.state.designer) NS.designer.renderPanel();
    }

    scanAndApply();
    const debounced = U.debounce(scanAndApply, 180);
    const observer = new MutationObserver(function (mutations) {
      const meaningful = mutations.some(function (m) {
        return m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length);
      });
      if (meaningful) debounced();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    NS.state.observer = observer;

    const designerRequested = opts.designer === true || /(?:\?|&)sqsmorph=design(?:&|$)/.test(location.search) || location.hash === '#sqsmorph-design';
    if (designerRequested) setTimeout(NS.designer.enable, 50);

    return global.SQSMorph;
  }

  function destroy() {
    if (NS.state.observer) NS.state.observer.disconnect();
    NS.designer.disable();
    NS.state.initialized = false;
  }

  global.SQSMorph = {
    version: NS.version,
    init: init,
    destroy: destroy,
    scan: NS.registry.scan,
    applyConfig: NS.engine.applyConfig,
    applyRule: NS.engine.applyRule,
    components: function () { return Array.from(NS.state.components.values()); },
    exportConfig: function () { return { version: 1, page: U.pageKey(), rules: NS.engine.collectCurrentRules() }; },
    designer: NS.designer,
    presets: NS.presets
  };

  function boot() {
    if (global.SQSMORPH_AUTO_INIT === false) return;
    global.SQSMorph.init();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})(window);
