# SQS Morph Product Runtime v0.2.0

A deliberately narrow, production-minded rewrite focused on **Squarespace 7.1 Product List sections**.

## Why this version is different

- Uses Squarespace's documented `data-sqsp-section="product-list"` only for top-level detection.
- Treats inner product classes as an adapter contract and runs a health check before applying anything.
- Does **not** replace product links, price markup, quick-add markup, variants, or native commerce logic.
- Gives three genuinely different layouts: Bento Featured, Editorial Overlay, Split Catalog.
- Uses a Spark-style loader: one `<script>` + `data-token`.
- Uses feature modules rather than one giant bundle.
- Fails closed: if markup is unexpected, it skips the section instead of guessing.

## Install

```html
<script
  id="sqs-morph"
  src="https://YOUR-VERCEL-DOMAIN/app.js"
  data-token="sm_demo_product_v02"
  async>
</script>
```

Put this in Squarespace Code Injection. Replace the demo token after creating your own config file.

## Config

`config/<TOKEN>.json`

```json
{
  "version": 1,
  "features": [
    {
      "type": "product-grid",
      "enabled": true,
      "preset": "bento-featured",
      "match": {"paths": ["/shop*"]},
      "target": {"mode": "all"},
      "options": {"gap": 22, "radius": 20, "imageRatio": "4/5"}
    }
  ]
}
```

Presets: `bento-featured`, `editorial-overlay`, `split-catalog`.

## Preview without editing config

Append one of these to a page URL:

- `?sqm-product=bento-featured`
- `?sqm-product=editorial-overlay`
- `?sqm-product=split-catalog`

## Debug

Use `?sqm-debug=1` then run in DevTools:

```js
SQSMorph.debug()
SQSMorph.state()
```

## Important

This is still custom code. Squarespace 7.1 does not expose a supported API for modifying native editing tools or block internals. Inner product DOM can change, so compatibility must be regression-tested. The runtime therefore skips unknown markup instead of forcing a layout.
