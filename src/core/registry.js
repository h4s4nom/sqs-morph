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
