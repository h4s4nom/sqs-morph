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
