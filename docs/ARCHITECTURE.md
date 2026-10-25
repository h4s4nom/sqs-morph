# Runtime Architecture

```text
Squarespace Rendered DOM
        ↓
Component Registry
        ↓
Adapters
  - Product List
  - Product Detail
  - Summary
  - Auto Layout
        ↓
Stable Locator + Health Check
        ↓
Preset Engine
        ↓
Scoped class + CSS variables
        ↓
Optional Designer Mode UI
```

## Why DOM adapters

Squarespace 7.1 does not provide an official extension API that lets third-party code replace native editor/block internals. This MVP therefore operates only on the rendered site and preserves Squarespace as the content/CMS source of truth.

## Adapter contract

Each adapter implements:

```js
{
  type: 'product-list',
  label: 'Product List',
  find(root) => Element[],
  health(element) => { status, notes }
}
```

## Config schema

```json
{
  "version": 1,
  "page": "/shop",
  "rules": [
    {
      "locator": "#shop-products",
      "type": "product-list",
      "preset": "product-editorial",
      "tokens": {
        "radius": "24px",
        "gap": "28px",
        "fontScale": "1.04"
      }
    }
  ]
}
```

## Production SaaS upgrade

Replace `window.SQSMORPH_CONFIG` / localStorage with a signed/public manifest flow:

```text
runtime → GET /v1/runtime/:publicSiteKey/manifest
```

The runtime should receive presentation-only configuration, never account/billing secrets.
