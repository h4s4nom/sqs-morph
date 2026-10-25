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
