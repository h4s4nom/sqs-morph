(function (global) {
  'use strict';
  const NS = global.__SQSMORPH__;
  const U = NS.utils;

  function injectDesignerStyles(shadow) {
    const style = document.createElement('style');
    style.textContent = `
      :host{all:initial;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .panel{position:fixed;right:18px;bottom:18px;width:340px;max-height:78vh;overflow:auto;background:#101114;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:18px;box-shadow:0 28px 80px rgba(0,0,0,.35);z-index:2147483647;padding:16px}
      .top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.brand{font-weight:800;font-size:15px}.sub{font-size:11px;color:#9ea3ad}
      button,select,input{font:inherit}.close{background:transparent;color:#fff;border:0;font-size:20px;cursor:pointer}
      .status{font-size:12px;padding:9px 10px;border-radius:10px;background:#1b1d22;margin-bottom:12px;color:#c9cbd1}
      .row{margin:12px 0}.label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#8f95a1;margin-bottom:7px}
      select{width:100%;background:#181a1f;color:#fff;border:1px solid #343842;border-radius:10px;padding:10px}
      .presets{display:grid;grid-template-columns:1fr 1fr;gap:8px}.preset{background:#191b20;color:#fff;border:1px solid #343842;border-radius:12px;padding:10px;text-align:left;cursor:pointer;font-size:12px}.preset.active{border-color:#fff;background:#262933}
      .range{display:grid;grid-template-columns:1fr 52px;gap:10px;align-items:center}.range input[type=range]{width:100%}.value{font-size:11px;color:#b9bdc7;text-align:right}
      .actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}.btn{border:0;border-radius:11px;padding:10px 12px;cursor:pointer;font-weight:700}.primary{background:#fff;color:#111}.secondary{background:#23262d;color:#fff}.danger{background:#442329;color:#ffdbe1}.wide{grid-column:1/-1}
      .hint{font-size:11px;color:#8f95a1;line-height:1.45;margin-top:10px}.health{font-size:11px;color:#9ad7b5}.health.degraded{color:#ffce86}
      textarea{box-sizing:border-box;width:100%;min-height:190px;background:#0c0d10;color:#e9ebef;border:1px solid #353945;border-radius:10px;padding:10px;font:11px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;resize:vertical}
      .hidden{display:none}
    `;
    shadow.appendChild(style);
  }

  function setOutlines(enabled) {
    document.documentElement.classList.toggle('sqm-designer-active', !!enabled);
  }

  function selectComponent(id) {
    NS.state.selectedId = id;
    Array.from(document.querySelectorAll('[data-sqsmorph-selected]')).forEach(function (el) { el.removeAttribute('data-sqsmorph-selected'); });
    const c = NS.state.components.get(id);
    if (c) c.element.setAttribute('data-sqsmorph-selected', 'true');
    renderPanel();
  }

  function currentRuleFor(c) {
    if (!c) return null;
    return {
      locator: c.locator,
      type: c.type,
      preset: c.element.getAttribute('data-sqsmorph-preset') || '',
      semantic: c.element.getAttribute('data-sqsmorph-semantic') || '',
      tokens: {
        radius: parseFloat(c.element.style.getPropertyValue('--sqm-radius')) || undefined,
        gap: parseFloat(c.element.style.getPropertyValue('--sqm-gap')) || undefined,
        fontScale: parseFloat(c.element.style.getPropertyValue('--sqm-font-scale')) || undefined,
        cardPadding: parseFloat(c.element.style.getPropertyValue('--sqm-card-padding')) || undefined,
        imageRadius: parseFloat(c.element.style.getPropertyValue('--sqm-image-radius')) || undefined
      }
    };
  }

  function applyFromControls(panel, component) {
    if (!component) return;
    const preset = panel.querySelector('[data-active-preset]') ? panel.querySelector('[data-active-preset]').getAttribute('data-active-preset') : (component.element.getAttribute('data-sqsmorph-preset') || '');
    if (!preset) return;
    const semanticSelect = panel.querySelector('#sqm-semantic');
    const rule = {
      locator: component.locator,
      type: component.type,
      preset: preset,
      semantic: semanticSelect ? semanticSelect.value : undefined,
      tokens: {
        radius: Number(panel.querySelector('#sqm-radius').value),
        gap: Number(panel.querySelector('#sqm-gap').value),
        fontScale: Number(panel.querySelector('#sqm-font').value),
        cardPadding: Number(panel.querySelector('#sqm-padding').value),
        imageRadius: Number(panel.querySelector('#sqm-image-radius').value)
      }
    };
    NS.engine.applyRule(rule);
  }

  function saveCurrent() {
    const config = { version: 1, page: U.pageKey(), rules: NS.engine.collectCurrentRules() };
    U.setLocalConfig(config);
    U.pushRevision(config);
    return config;
  }

  function rollbackDraft() {
    const previous = U.popRevision();
    if (!previous || !previous.config) return false;
    document.querySelectorAll('.sqm-enabled').forEach(function (el) { NS.engine.disableByElement(el); });
    U.setLocalConfig(previous.config);
    NS.engine.applyConfig(previous.config);
    return true;
  }

  function nativePreview(enabled) {
    document.documentElement.classList.toggle('sqm-native-preview', !!enabled);
  }

  function exportConfigText() {
    const config = saveCurrent();
    return '<script>window.SQSMORPH_CONFIG=' + JSON.stringify(config, null, 2).replace(/<\/script/gi, '<\\/script') + ';</script>';
  }

  function renderPanel() {
    const d = NS.state.designer;
    if (!d) return;
    const panel = d.panel;
    const component = NS.state.components.get(NS.state.selectedId);
    const count = NS.state.components.size;
    const status = panel.querySelector('.status');
    const editor = panel.querySelector('.editor');
    if (!component) {
      status.textContent = 'Detected ' + count + ' supported component' + (count === 1 ? '' : 's') + '. Click any highlighted section.';
      editor.classList.add('hidden');
      return;
    }
    editor.classList.remove('hidden');
    status.textContent = component.label + ' • ' + (component.locator || 'unstable locator');
    const health = panel.querySelector('.health');
    health.textContent = 'Adapter: ' + component.health.status + (component.health.notes.length ? ' — ' + component.health.notes.join(', ') : '');
    health.className = 'health ' + (component.health.status === 'healthy' ? '' : 'degraded');

    const semanticWrap = panel.querySelector('.semantic-wrap');
    semanticWrap.classList.toggle('hidden', component.type !== 'auto-layout');
    const current = currentRuleFor(component);
    const semantic = current.semantic || 'generic';
    panel.querySelector('#sqm-semantic').value = semantic;

    const presets = (NS.presets[component.type] || []).filter(function (p) {
      if (component.type !== 'auto-layout') return true;
      return semantic === 'generic' || p.semantic === semantic || p.semantic === 'generic';
    });
    const holder = panel.querySelector('.presets');
    holder.innerHTML = '';
    presets.forEach(function (p) {
      const b = document.createElement('button');
      b.className = 'preset' + (current.preset === p.id ? ' active' : '');
      b.textContent = p.name;
      b.setAttribute('data-active-preset', p.id);
      b.addEventListener('click', function () {
        holder.querySelectorAll('.preset').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        holder.setAttribute('data-active-preset', p.id);
        const preset = NS.engine.getPreset(component.type, p.id);
        const t = preset.tokens || {};
        setControlValues(panel, t);
        applyFromControlsProxy(panel, component, p.id);
      });
      holder.appendChild(b);
    });
    const visibleCurrent = presets.find(function (p) { return p.id === current.preset; });
    const resolvedPresetId = (visibleCurrent && visibleCurrent.id) || (presets[0] && presets[0].id) || '';
    holder.setAttribute('data-active-preset', resolvedPresetId);

    const activePreset = (visibleCurrent || presets[0]) || { tokens: {} };
    setControlValues(panel, Object.assign({}, activePreset.tokens, current.tokens));
  }

  function setControlValues(panel, t) {
    const vals = {
      '#sqm-radius': numberValue(t.radius, 18),
      '#sqm-gap': numberValue(t.gap, 24),
      '#sqm-font': numberValue(t.fontScale, 1),
      '#sqm-padding': numberValue(t.cardPadding, 22),
      '#sqm-image-radius': numberValue(t.imageRadius, t.radius || 18)
    };
    Object.keys(vals).forEach(function (sel) {
      const el = panel.querySelector(sel);
      if (!el) return;
      el.value = vals[sel];
      const value = el.parentElement.querySelector('.value');
      if (value) value.textContent = String(vals[sel]);
    });
  }

  function numberValue(v, fallback) {
    if (typeof v === 'number') return v;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function applyFromControlsProxy(panel, component, presetId) {
    const holder = panel.querySelector('.presets');
    holder.setAttribute('data-active-preset', presetId);
    const semanticSelect = panel.querySelector('#sqm-semantic');
    const rule = {
      locator: component.locator,
      type: component.type,
      preset: presetId,
      semantic: semanticSelect ? semanticSelect.value : undefined,
      tokens: {
        radius: Number(panel.querySelector('#sqm-radius').value),
        gap: Number(panel.querySelector('#sqm-gap').value),
        fontScale: Number(panel.querySelector('#sqm-font').value),
        cardPadding: Number(panel.querySelector('#sqm-padding').value),
        imageRadius: Number(panel.querySelector('#sqm-image-radius').value)
      }
    };
    NS.engine.applyRule(rule);
  }

  function enable() {
    if (NS.state.designer) return;
    NS.registry.scan();
    setOutlines(true);
    const host = document.createElement('div');
    host.id = 'sqsmorph-designer-host';
    document.documentElement.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    injectDesignerStyles(shadow);

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `
      <div class="top"><div><div class="brand">SQS Morph Designer</div><div class="sub">v${NS.version}</div></div><button class="close" title="Close">×</button></div>
      <div class="status">Scanning…</div>
      <div class="editor hidden">
        <div class="health"></div>
        <div class="row semantic-wrap hidden"><label class="label">Auto Layout Type</label><select id="sqm-semantic"><option value="generic">Generic</option><option value="team">Team</option><option value="testimonial">Testimonial</option></select></div>
        <div class="row"><label class="label">Design Preset</label><div class="presets"></div></div>
        <div class="row"><label class="label">Corner Radius</label><div class="range"><input id="sqm-radius" type="range" min="0" max="40" step="1"><span class="value"></span></div></div>
        <div class="row"><label class="label">Gap</label><div class="range"><input id="sqm-gap" type="range" min="8" max="64" step="1"><span class="value"></span></div></div>
        <div class="row"><label class="label">Type Scale</label><div class="range"><input id="sqm-font" type="range" min="0.85" max="1.25" step="0.01"><span class="value"></span></div></div>
        <div class="row"><label class="label">Card Padding</label><div class="range"><input id="sqm-padding" type="range" min="0" max="48" step="1"><span class="value"></span></div></div>
        <div class="row"><label class="label">Image Radius</label><div class="range"><input id="sqm-image-radius" type="range" min="0" max="40" step="1"><span class="value"></span></div></div>
        <div class="actions"><button class="btn secondary" id="sqm-save">Save Draft</button><button class="btn secondary" id="sqm-rollback">Rollback Draft</button><button class="btn secondary wide" id="sqm-native">Preview Native</button><button class="btn danger wide" id="sqm-disable">Disable Selected Skin</button><button class="btn primary wide" id="sqm-export">Export Publish Config</button></div>
        <div class="row hidden" id="sqm-export-wrap"><label class="label">Paste this before sqsmorph.js in Code Injection</label><textarea id="sqm-export-text"></textarea></div>
        <div class="hint">This MVP stores drafts in this browser. Export the publish config to make the same design load for visitors.</div>
      </div>`;
    shadow.appendChild(panel);
    NS.state.designer = { host: host, shadow: shadow, panel: panel };

    panel.querySelector('.close').addEventListener('click', disable);
    panel.querySelector('#sqm-semantic').addEventListener('change', function () { renderPanel(); });
    ['#sqm-radius','#sqm-gap','#sqm-font','#sqm-padding','#sqm-image-radius'].forEach(function (sel) {
      panel.querySelector(sel).addEventListener('input', function (e) {
        const v = e.target.parentElement.querySelector('.value');
        if (v) v.textContent = e.target.value;
        const c = NS.state.components.get(NS.state.selectedId);
        const presetId = panel.querySelector('.presets').getAttribute('data-active-preset');
        if (c && presetId) applyFromControlsProxy(panel, c, presetId);
      });
    });
    panel.querySelector('#sqm-save').addEventListener('click', function () {
      saveCurrent();
      panel.querySelector('#sqm-save').textContent = 'Saved';
      setTimeout(function () { panel.querySelector('#sqm-save').textContent = 'Save Draft'; }, 1000);
    });
    panel.querySelector('#sqm-rollback').addEventListener('click', function () {
      const ok = rollbackDraft();
      panel.querySelector('#sqm-rollback').textContent = ok ? 'Restored' : 'No Revision';
      setTimeout(function () { panel.querySelector('#sqm-rollback').textContent = 'Rollback Draft'; }, 1200);
      renderPanel();
    });
    panel.querySelector('#sqm-native').addEventListener('click', function () {
      const active = document.documentElement.classList.toggle('sqm-native-preview');
      panel.querySelector('#sqm-native').textContent = active ? 'Show SQS Morph' : 'Preview Native';
    });
    panel.querySelector('#sqm-disable').addEventListener('click', function () {
      const c = NS.state.components.get(NS.state.selectedId);
      if (c) NS.engine.disableByElement(c.element);
      renderPanel();
    });
    panel.querySelector('#sqm-export').addEventListener('click', function () {
      const wrap = panel.querySelector('#sqm-export-wrap');
      const txt = panel.querySelector('#sqm-export-text');
      txt.value = exportConfigText();
      wrap.classList.remove('hidden');
      txt.focus(); txt.select();
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt.value).catch(function () {});
    });

    const clickHandler = function (e) {
      if (e.composedPath && e.composedPath().indexOf(host) >= 0) return;
      const target = e.target.closest && e.target.closest('[data-sqsmorph-component]');
      if (!target) return;
      e.preventDefault(); e.stopPropagation();
      selectComponent(target.getAttribute('data-sqsmorph-component'));
    };
    document.addEventListener('click', clickHandler, true);
    NS.state.designer.clickHandler = clickHandler;
    renderPanel();
  }

  function disable() {
    const d = NS.state.designer;
    if (!d) return;
    setOutlines(false);
    nativePreview(false);
    document.removeEventListener('click', d.clickHandler, true);
    Array.from(document.querySelectorAll('[data-sqsmorph-selected]')).forEach(function (el) { el.removeAttribute('data-sqsmorph-selected'); });
    d.host.remove();
    NS.state.designer = null;
  }

  NS.designer = { enable, disable, renderPanel, saveCurrent, rollbackDraft, nativePreview, exportConfigText };
})(window);
