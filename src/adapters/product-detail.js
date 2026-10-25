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
