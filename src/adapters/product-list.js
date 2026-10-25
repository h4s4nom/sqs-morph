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
