
import { state } from './state.js';
import { renderPreview, applyScale, updateExportLabel } from './export.js';
import { scheduleSave } from './storage.js';

/**
 * UI-related functions for Kbach.io
 */

export function onDimInput() {
  document.getElementById('preset-sel').value = '';
}

export function onDimChange() {
  state.currentW = parseInt(document.getElementById('inp-w').value) || 1200;
  if (!state.autoHeight) {
    state.currentH = parseInt(document.getElementById('inp-h').value) || 630;
  }
  updateDimLabels();
  renderPreview();
  scheduleSave();
}

export function loadPreset() {
  var val = document.getElementById('preset-sel').value;
  if (!val) return;
  var parts = val.split(',');
  state.currentW = parseInt(parts[0]); state.currentH = parseInt(parts[1]);
  document.getElementById('inp-w').value = state.currentW;
  document.getElementById('inp-h').value = state.currentH;
  setAutoH(false);
  updateDimLabels();
  renderPreview();
  scheduleSave();
}

export function onAutoHChange() {
  setAutoH(document.getElementById('auto-h').checked);
  renderPreview();
  scheduleSave();
}

export function setAutoH(on) {
  state.autoHeight = on;
  document.getElementById('auto-h').checked = on;
  var hInput = document.getElementById('inp-h');
  hInput.disabled = on;
  if (on) {
    hInput.placeholder = 'auto';
    hInput.value = '';
  } else {
    hInput.placeholder = '';
    hInput.value = state.currentH;
  }
}

export function updateDimLabels() {
  var label = state.currentW + ' \u00d7 ' + state.currentH + ' px';
  const frameLabel = document.getElementById('frame-label');
  if (frameLabel) frameLabel.textContent = label;
  
  const iframe = document.getElementById('preview-iframe');
  if (iframe) {
    iframe.width = state.currentW;
    iframe.height = state.currentH;
  }
  updateExportLabel();
}

// ─── Theme ────────────────────────────────────────────────────
export function toggleTheme() {
  document.documentElement.classList.toggle('light');
  localStorage.setItem('theme', document.documentElement.classList.contains('light') ? 'light' : 'dark');
  updateThemeIcon();
}

export function updateThemeIcon() {
  var isLight = localStorage.getItem('theme') === 'light';
  if (isLight) document.documentElement.classList.add('light');
  else document.documentElement.classList.remove('light');

  var btn = document.getElementById('theme-btn');
  if (btn) {
    btn.innerHTML = isLight ? '<i data-lucide="sun" class="w-4 h-4 text-studioMuted"></i>' : '<i data-lucide="moon" class="w-4 h-4 text-studioMuted"></i>';
    if (window.lucide) window.lucide.createIcons();
  }
}

// ─── UI Helpers ───────────────────────────────────────────────
export function showLoading(on) {
  var el = document.getElementById('preview-loading');
  if (!el) return;
  if (on) {
     el.classList.remove('opacity-0', 'pointer-events-none');
     el.classList.add('opacity-100');
  } else {
     el.classList.add('opacity-0', 'pointer-events-none');
     el.classList.remove('opacity-100');
  }
}

export function showMsg(msg, err) {
  var el = document.getElementById('status-msg');
  if (!el) return;
  el.innerHTML = msg;
  el.style.color = err ? 'var(--danger)' : 'var(--accent)';
  clearTimeout(el._t);
  el._t = setTimeout(function () { el.innerHTML = ''; }, 4000);
}

export function toggleOutput() {
  const overlay = document.getElementById('export-result-overlay');
  if (overlay) overlay.classList.toggle('hidden');
}

export function closeOutput() {
  const overlay = document.getElementById('export-result-overlay');
  if (overlay) overlay.classList.add('hidden');
}

// ─── Live Effects Panel ────────────────────────────────────────
export function toggleEffectsPanel() {
  const panel = document.getElementById('effects-panel');
  const wasHidden = panel.classList.contains('hidden');
  
  if (wasHidden) {
    closeFeaturesPanel();
    closeOutput();
  }
  
  panel.classList.toggle('hidden');
}

export function closeEffectsPanel() {
  document.getElementById('effects-panel').classList.add('hidden');
}

export function toggleFeaturesPanel() {
  const panel = document.getElementById('features-panel');
  const wasHidden = panel.classList.contains('hidden');
  
  // Close other panels if opening this one
  if (wasHidden) {
    closeEffectsPanel();
    closeOutput();
  }
  
  panel.classList.toggle('hidden');
}

export function closeFeaturesPanel() {
  document.getElementById('features-panel').classList.add('hidden');
}

export function resetEffects() {
  document.getElementById('rng-blur').value = 0;
  document.getElementById('rng-noise').value = 0;
  document.getElementById('rng-sat').value = 100;
  document.getElementById('rng-opac').value = 100;
  onEffectChange();
}

export function onEffectChange() {
  state.effectBlur = document.getElementById('rng-blur').value;
  state.effectNoise = document.getElementById('rng-noise').value;
  state.effectSat = document.getElementById('rng-sat').value;
  state.effectOpac = document.getElementById('rng-opac').value;

  localStorage.setItem('kbach_effect_blur', state.effectBlur);
  localStorage.setItem('kbach_effect_noise', state.effectNoise);
  localStorage.setItem('kbach_effect_sat', state.effectSat);
  localStorage.setItem('kbach_effect_opac', state.effectOpac);

  document.getElementById('val-blur').textContent = state.effectBlur + 'px';
  document.getElementById('val-noise').textContent = state.effectNoise + '%';
  document.getElementById('val-sat').textContent = state.effectSat + '%';
  document.getElementById('val-opac').textContent = state.effectOpac + '%';

  applyLiveEffects();
  scheduleSave();
}

export function onFeatureChange() {
  state.useTailwind = document.getElementById('feat-tailwind').checked;
  state.useReset = document.getElementById('feat-reset').checked;
  state.useLucide = document.getElementById('feat-lucide').checked;
  state.googleFonts = document.getElementById('feat-fonts').value;

  localStorage.setItem('kbach_use_tailwind', state.useTailwind);
  localStorage.setItem('kbach_use_reset', state.useReset);
  localStorage.setItem('kbach_use_lucide', state.useLucide);
  localStorage.setItem('kbach_google_fonts', state.googleFonts);

  renderPreview();
  scheduleSave();
}

export function onScaleChange() {
  const sel = document.getElementById('export-scale-sel');
  if (sel) {
    state.exportScale = parseInt(sel.value) || 2;
    localStorage.setItem('kbach_export_scale', state.exportScale);
    updateExportLabel();
    scheduleSave();
  }
}

export function applyLiveEffects(targetIframe) {
  var iframe = targetIframe || document.getElementById('preview-iframe');
  if (!iframe) return;
  var doc = iframe.contentDocument || iframe.contentWindow.document;
  if (!doc || !doc.body) return;

  var styleEl = doc.getElementById('kbach-dynamic-effects');
  if (!styleEl) {
    styleEl = doc.createElement('style');
    styleEl.id = 'kbach-dynamic-effects';
    if(doc.head) doc.head.appendChild(styleEl);
  }

  var blurFilter = state.effectBlur > 0 ? 'blur(' + state.effectBlur + 'px) ' : '';
  var satFilter = state.effectSat != 100 ? 'saturate(' + state.effectSat + '%) ' : '';
  var filterValue = (blurFilter + satFilter).trim() || 'none';
  var opacValue = state.effectOpac / 100;

  styleEl.textContent = `
    html {
      filter: ${filterValue};
      opacity: ${opacValue};
      transition: filter 0.1s ease, opacity 0.1s ease;
    }
  `;

  var noiseEl = doc.getElementById('kbach-noise-overlay');
  if (state.effectNoise > 0) {
    if (!noiseEl) {
      noiseEl = doc.createElement('div');
      noiseEl.id = 'kbach-noise-overlay';
      noiseEl.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; pointer-events:none; z-index:2147483647;';
      noiseEl.innerHTML = `
        <svg preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%; opacity:1;">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>`;
      doc.documentElement.appendChild(noiseEl);
    }
    noiseEl.style.opacity = state.effectNoise / 100;
  } else if (noiseEl) {
    noiseEl.remove();
  }
}

/**
 * Synchronize all UI elements (inputs, checkboxes, selects) 
 * with the global state (usually after loading from localStorage)
 */
export function syncUIWithState() {
  // 1. Sync Export Scale
  const scaleSel = document.getElementById('export-scale-sel');
  if (scaleSel) {
    scaleSel.value = state.exportScale;
    updateExportLabel();
  }

  // 2. Sync Feature Panel
  const featTailwind = document.getElementById('feat-tailwind');
  const featReset = document.getElementById('feat-reset');
  const featLucide = document.getElementById('feat-lucide');
  const featFonts = document.getElementById('feat-fonts');

  if (featTailwind) featTailwind.checked = state.useTailwind;
  if (featReset) featReset.checked = state.useReset;
  if (featLucide) featLucide.checked = state.useLucide;
  if (featFonts) featFonts.value = state.googleFonts;

  // 3. Sync Effects Sliders
  const rngBlur = document.getElementById('rng-blur');
  const rngNoise = document.getElementById('rng-noise');
  const rngSat = document.getElementById('rng-sat');
  const rngOpac = document.getElementById('rng-opac');

  if (rngBlur) rngBlur.value = state.effectBlur;
  if (rngNoise) rngNoise.value = state.effectNoise;
  if (rngSat) rngSat.value = state.effectSat;
  if (rngOpac) rngOpac.value = state.effectOpac;

  // 4. Update Visual Labels
  if (document.getElementById('val-blur')) document.getElementById('val-blur').textContent = state.effectBlur + 'px';
  if (document.getElementById('val-noise')) document.getElementById('val-noise').textContent = state.effectNoise + '%';
  if (document.getElementById('val-sat')) document.getElementById('val-sat').textContent = state.effectSat + '%';
  if (document.getElementById('val-opac')) document.getElementById('val-opac').textContent = state.effectOpac + '%';

  // Apply visual changes to preview
  applyLiveEffects();
}
