# SQS Morph MVP v0.1.0

**Keep native Squarespace content. Change the design.**

SQS Morph is a front-end design extension for Squarespace 7.1 structured/native components. It does not replace the Squarespace CMS or rebuild sections in custom HTML. It detects supported rendered components and applies scoped design skins using CSS variables and lightweight JavaScript.

## Supported in this MVP

- Product List / Store collection section (`data-sqsp-section="product-list"`)
- Product Detail section (`data-sqsp-section="product-detail"`)
- Summary Block (`data-sqsp-block="summary"`)
- Auto Layout (`data-sqsp-section="auto-layout"`) for Team / Testimonials / generic lists

## Included presets

- Product List: Minimal Commerce, Luxury Editorial, Hover Reveal, Compact Catalog
- Product Detail: Sticky Product Sheet, Editorial Split, Minimal Luxe
- Summary: Magazine Grid, Floating Cards, Borderless Editorial, Featured First
- Auto Layout: Editorial Team, Hover Bio Team, Luxury Quote, Spotlight Testimonial, Glass Cards

## What this package is

This is a **working standalone MVP runtime**. It stores Designer Mode drafts in localStorage and exports a publish configuration. It intentionally does **not** include the SaaS account/API/database layer from the A-to-Z specification yet.

The runtime/API boundary is already separated so a hosted manifest service can replace the local configuration later.

## Quick test

Open `examples/test-fixture.html?sqsmorph=design` in a browser.

## Production installation concept

1. Host `dist/sqsmorph.bundle.js` on your own CDN/static host (recommended single-file install).
2. In Squarespace, add the config + bundle script through Code Injection.
3. Open a page with `?sqsmorph=design` while testing to enable Designer Mode.
4. Click a highlighted supported component.
5. Choose a preset and adjust safe controls.
6. Click **Export Publish Config**.
7. Put the exported `window.SQSMORPH_CONFIG` script before the runtime script in Code Injection.

See `docs/INSTALLATION.md` for exact examples.

## Safety / architecture rules

- Native content remains the source of truth.
- The runtime only adds classes, data attributes, CSS variables, and scoped presentation rules.
- It does not modify cart totals, checkout, inventory, payments, orders, or Squarespace editor internals.
- MutationObserver re-scans when Squarespace dynamically changes page content.
- Reduced-motion preferences are respected.
- Every skin can be disabled to return to the native presentation.

## Important Squarespace limitation

Custom code is outside normal Squarespace support and can be affected by Squarespace markup/platform changes. Treat adapters as versioned compatibility code and regression-test them on controlled Squarespace 7.1 sites before client production rollout.

## Folder structure

```text
sqsmorph-mvp/
├─ dist/                 # Ready-to-host single bundle + separate runtime/CSS
├─ src/
│  ├─ adapters/          # Component detectors / health checks
│  ├─ core/              # Registry, engine, designer, runtime
│  ├─ presets/           # Preset definitions
│  └─ styles/            # Scoped skin CSS
├─ examples/             # Local demo fixture
├─ docs/                 # Installation + architecture notes
├─ scripts/build.mjs     # Dependency-free build/concat script
└─ package.json
```

## Public JS API

```js
SQSMorph.scan();
SQSMorph.components();
SQSMorph.designer.enable();
SQSMorph.designer.disable();
SQSMorph.applyRule({
  locator: '#my-shop',
  type: 'product-list',
  preset: 'product-editorial',
  tokens: { radius: 24, gap: 28 }
});
SQSMorph.exportConfig();
```

## Next production phase

To match the full A-to-Z specification, the next layer should add:

- authentication + accounts/sites
- signed Designer Mode sessions
- persisted component instances and locator bundles
- preset/version database
- draft/publish/revision/rollback API
- CDN manifest endpoint
- compatibility telemetry + remote feature flags
- Playwright screenshot regression against real Squarespace fixtures
