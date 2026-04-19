
import { CodeJar } from 'https://unpkg.com/codejar@latest/dist/codejar.js';
import { state } from './modules/state.js';
import { TEMPLATES } from './templates.js';
import { 
  onEditorChange, 
  syncScroll, 
  updateLineNums, 
  updateStats, 
  formatHTML, 
  clearEditor, 
  undoClear, 
  copyHTML,
  pasteHTML 
} from './modules/editor.js';
import { 
  onDimInput, 
  onDimChange, 
  loadPreset, 
  onAutoHChange, 
  setAutoH, 
  updateDimLabels, 
  toggleTheme, 
  updateThemeIcon, 
  showMsg, 
  toggleOutput, 
  toggleEffectsPanel, 
  closeEffectsPanel, 
  toggleFeaturesPanel,
  closeFeaturesPanel,
  resetEffects, 
  onEffectChange,
  onFeatureChange
} from './modules/ui.js';
import { 
  renderPreview, 
  reloadPreview, 
  applyScale, 
  exportPNG, 
  copyImage, 
  updateExportLabel 
} from './modules/export.js';
import { 
  scheduleSave, 
  loadSettings 
} from './modules/storage.js';

// ─── Init ────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', function () {
  updateThemeIcon();

  const editorEl = document.getElementById('html-editor');
  if (editorEl && CodeJar) {
    const highlight = (editor) => {
      const code = editor.textContent;
      editor.innerHTML = Prism.highlight(code, Prism.languages.markup, 'markup');
    };
    state.jar = CodeJar(editorEl, highlight);
    state.jar.onUpdate(onEditorChange);
    editorEl.addEventListener('scroll', syncScroll);
  }

  if (!loadSettings()) {
    loadTemplate('og');
  }
  
  document.getElementById('inp-w').addEventListener('change', onDimChange);
  document.getElementById('inp-h').addEventListener('change', onDimChange);

  // Resize Observer for preview
  var _resizeTimer = null;
  var viewport = document.getElementById('preview-viewport');
  if (window.ResizeObserver && viewport) {
    new ResizeObserver(function () {
      if (_resizeTimer) return;
      _resizeTimer = requestAnimationFrame(function () { _resizeTimer = null; applyScale(); });
    }).observe(viewport);
  }

  // Receive auto-height updates from the preview iframe.
  window.addEventListener('message', function (evt) {
    if (!state.autoHeight || !evt || !evt.data || evt.data.type !== 'autoH') return;

    var iframe = document.getElementById('preview-iframe');
    if (!iframe || evt.source !== iframe.contentWindow) return;

    var nextH = parseInt(evt.data.h, 10);
    if (!Number.isFinite(nextH)) return;

    // Clamp to keep UI stable with malformed content.
    nextH = Math.max(1, Math.min(20000, nextH));
    if (nextH === state.currentH) return;

    state.currentH = nextH;
    updateDimLabels();
    applyScale();
    scheduleSave();
  });
});

// ─── Global Orchestration ────────────────────────────────────

export function loadTemplate(name) {
  var t = TEMPLATES[name];
  if (!t) return;
  
  if (state.jar) {
    state.jar.updateCode(t.html);
  } else {
    document.getElementById('html-editor').textContent = t.html;
  }
  
  document.getElementById('inp-w').value = t.w;
  state.currentW = t.w; 
  state.currentH = t.h;
  
  setAutoH(false);
  document.getElementById('inp-h').value = t.h;
  
  var presetSel = document.getElementById('preset-sel');
  var matchVal = t.w + ',' + t.h;
  var matched = false;
  for (var i = 0; i < presetSel.options.length; i++) {
    if (presetSel.options[i].value === matchVal) { matched = true; break; }
  }
  presetSel.value = matched ? matchVal : '';

  // Auto-detect features
  const htmlLower = t.html.toLowerCase();
  
  // Tailwind
  if (htmlLower.includes('tailwindcss.com') || name === 'tailwind' || name === 'mastery' || t.html.includes('class="') || t.html.includes("class='")) {
    // If it has classes and it's one of our modern templates, or mentions tailwind
    if (name === 'tailwind' || name === 'mastery') {
       state.useTailwind = true;
       document.getElementById('feat-tailwind').checked = true;
    }
  }

  // Lucide
  if (t.html.includes('data-lucide') || htmlLower.includes('lucide')) {
    state.useLucide = true;
    document.getElementById('feat-lucide').checked = true;
  }

  // Google Fonts
  if (htmlLower.includes('fonts.googleapis.com')) {
    // Already has fonts in it, but we can sync the feature if it's empty
    if (!state.googleFonts) {
       // We could extract them but maybe just leave it
    }
  }
  
  updateDimLabels();
  updateLineNums();
  updateStats();
  renderPreview();
}

// ─── Expose to Window for Inline Event Handlers ───────────────
window.loadTemplate = loadTemplate;
window.onEditorChange = onEditorChange;
window.onDimInput = onDimInput;
window.onDimChange = onDimChange;
window.loadPreset = loadPreset;
window.onAutoHChange = onAutoHChange;
window.formatHTML = formatHTML;
window.clearEditor = clearEditor;
window.copyHTML = copyHTML;
window.pasteHTML = pasteHTML;
window.reloadPreview = reloadPreview;
window.toggleTheme = toggleTheme;
window.exportPNG = exportPNG;
window.copyImage = copyImage;
window.toggleOutput = toggleOutput;
window.undoClear = undoClear;
window.syncScroll = syncScroll;
window.toggleEffectsPanel = toggleEffectsPanel;
window.closeEffectsPanel = closeEffectsPanel;
window.toggleFeaturesPanel = toggleFeaturesPanel;
window.closeFeaturesPanel = closeFeaturesPanel;
window.resetEffects = resetEffects;
window.onEffectChange = onEffectChange;
window.onFeatureChange = onFeatureChange;
window.updatePreviewSize = function() { applyScale(); scheduleSave(); };
window.updateExportLabel = function() { updateExportLabel(); scheduleSave(); };
window.scheduleSave = scheduleSave;

// ─── Extension Integration ───────────────────────────────────
window.addEventListener('message', function (evt) {
  if (evt.data && evt.data.type === 'KBACH_LOAD_HTML' && evt.data.html) {
    if (typeof pasteHTML === 'function') {
      pasteHTML(evt.data.html);
      // Let the receiver know we got it so it stops retrying
      window.postMessage({ type: 'KBACH_LOADED' }, '*');
    }
  }
});
