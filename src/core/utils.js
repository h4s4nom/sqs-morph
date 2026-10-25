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
