# Installation — SQS Morph MVP

## 1. Host the files

Recommended: upload the single self-contained file `dist/sqsmorph.bundle.js` to a stable HTTPS URL you control.

Example:

```text
https://cdn.example.com/sqsmorph/sqsmorph.bundle.js
```

The separate `sqsmorph.js` + `sqsmorph.css` files are also included if you prefer separate assets.

## 2. Add to Squarespace Code Injection

Add this in site-wide Header Code Injection:

```html
<script>
window.SQSMORPH_CONFIG = {
  version: 1,
  rules: []
};
</script>
<script src="https://cdn.example.com/sqsmorph/sqsmorph.bundle.js" defer></script>
```

Squarespace 7.1 currently exposes stable custom-code identification attributes such as `data-sqsp-section` and `data-sqsp-block`; SQS Morph uses those as its primary detection layer.

## 3. Open Designer Mode

Visit a page with:

```text
https://yourdomain.com/shop?sqsmorph=design
```

or add this hash:

```text
#sqsmorph-design
```

Supported components will receive a blue dashed outline.

## 4. Apply a skin

Click a highlighted component and choose a preset.

For Auto Layout, first classify it as:

- Team
- Testimonial
- Generic

Then choose the corresponding design skin.

## 5. Publish the configuration

Click **Export Publish Config**. The MVP copies/opens a script containing `window.SQSMORPH_CONFIG`.

Replace the previous config script in Code Injection with that output and keep it **before** `sqsmorph.js`.

## Recommended stable targeting

For production, assign a Squarespace section anchor/ID where possible and use that as the component locator. Automatically generated IDs may change, so persistent manually assigned section IDs are preferred.

## Disable a skin

In Designer Mode, select the component and click **Disable Skin**. Native Squarespace appearance returns because SQS Morph does not rewrite the CMS content.

## Uninstall

Remove the stylesheet, config script, and runtime script from Code Injection. No content migration is required.
