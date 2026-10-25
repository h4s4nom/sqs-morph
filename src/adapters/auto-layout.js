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
