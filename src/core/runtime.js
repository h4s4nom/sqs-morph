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
