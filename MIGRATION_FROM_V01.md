# Upgrade from SQS Morph v0.1 to Product Runtime v0.2

This version intentionally replaces the old generic skin engine.

## 1. Remove the old Squarespace loader

Remove any old code that loads:

```html
<script src="https://sqs-morph.vercel.app/sqsmorph.bundle.js" defer></script>
```

and remove the old `SQSMORPH_CONFIG` block.

## 2. Deploy this project to the same GitHub/Vercel project

After replacing the repository contents:

```bash
npm run check
npm test
npm run build
git add .
git commit -m "Rebuild SQS Morph product runtime v0.2"
git push
```

Vercel should redeploy automatically.

## 3. Verify these URLs

- `https://sqs-morph.vercel.app/app.js`
- `https://sqs-morph.vercel.app/modules/product-grid.js`
- `https://sqs-morph.vercel.app/styles/product-grid.css`
- `https://sqs-morph.vercel.app/config/sm_live_78a8c6eb67d1b715e8b8e51d.json`

All four must load publicly.

## 4. Install the new loader in Squarespace Code Injection

```html
<script
  id="sqs-morph"
  src="https://sqs-morph.vercel.app/app.js"
  data-token="sm_live_78a8c6eb67d1b715e8b8e51d"
  async>
</script>
```

## 5. Test a real Squarespace Store / Product List page

Default configured preset: `bento-featured`.

Temporary preview overrides:

- `?sqm-product=bento-featured`
- `?sqm-product=editorial-overlay`
- `?sqm-product=split-catalog`

Debug:

- append `?sqm-debug=1`
- open DevTools console
- run `SQSMorph.debug()`
- run `SQSMorph.state()`

If the current Squarespace product markup does not pass the health check, the section is left native instead of being force-modified.
