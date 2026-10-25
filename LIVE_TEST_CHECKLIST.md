# Real Squarespace QA Checklist

Test on a Squarespace 7.1 Store/Product List page before adding another module.

## Detection

- [ ] `SQSMorph.debug()` shows at least one `product-list` section.
- [ ] Product count matches the visible native grid.
- [ ] Runtime status reports the product-grid feature as mounted.
- [ ] No repeated runtime errors in console.

## Native commerce preservation

- [ ] Product image/title links still open the correct product.
- [ ] Price and sale price remain correct.
- [ ] Sold-out state remains visible.
- [ ] Native Quick Add / Add to Cart still works if enabled.
- [ ] Category navigation/pagination still works.

## Layouts

### Bento Featured
- [ ] First product receives featured visual weight.
- [ ] Grid has no overlap at desktop widths.
- [ ] Two-column mobile presentation remains readable.

### Editorial Overlay
- [ ] Title and price remain readable over images.
- [ ] Product link remains clickable.
- [ ] Quick Add remains clickable and is not trapped under the overlay.

### Split Catalog
- [ ] Image and product meta sit side-by-side on desktop.
- [ ] Cards collapse cleanly on tablet/mobile.

## Responsive

- [ ] 1440px desktop
- [ ] 1024px laptop/tablet landscape
- [ ] 768px tablet
- [ ] 390px mobile
- [ ] 320px narrow mobile

## Failure safety

- [ ] Removing the loader returns the exact native Squarespace design.
- [ ] Unsupported markup is skipped instead of restructured.
- [ ] No content is copied into a second DOM tree.
