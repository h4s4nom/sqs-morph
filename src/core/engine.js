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
