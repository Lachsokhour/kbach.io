
import { state } from './state.js';
import { setAutoH, updateDimLabels, updateThemeIcon } from './ui.js';
import { updateLineNums, updateStats } from './editor.js';
import { applyScale, renderPreview } from './export.js';

/**
 * LocalStorage management for Kbach.io
 */

export function scheduleSave() {
  clearTimeout(state.saveTimerID);
  state.saveTimerID = setTimeout(saveSettings, 1000);
}

export function saveSettings() {
  const settings = {
    w: state.currentW,
    h: state.currentH,
    autoH: state.autoHeight,
    presetSel: document.getElementById('preset-sel')?.value || '',
    previewScale: document.getElementById('preview-scale')?.value || '0.5',
    exportScale: document.getElementById('export-scale')?.value || '2',
    watermark: document.getElementById('show-watermark')?.checked || false,
    code: state.jar ? state.jar.toString() : document.getElementById('html-editor').textContent,
    effects: {
      blur: document.getElementById('rng-blur')?.value || 0,
      noise: document.getElementById('rng-noise')?.value || 0,
      sat: document.getElementById('rng-sat')?.value || 100,
      opac: document.getElementById('rng-opac')?.value || 100
    }
  };
  try {
    localStorage.setItem('kbach_settings', JSON.stringify(settings));
  } catch(e) { console.warn('Kbach: LocalStorage save failed', e); }
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem('kbach_settings');
    if (!raw) return false;
    const settings = JSON.parse(raw);
    
    state.currentW = settings.w || 1200;
    state.currentH = settings.h || 630;
    state.autoHeight = !!settings.autoH;
    
    if (document.getElementById('inp-w')) document.getElementById('inp-w').value = state.currentW;
    if (document.getElementById('inp-h')) document.getElementById('inp-h').value = state.autoHeight ? '' : state.currentH;
    setAutoH(state.autoHeight);
    
    if (settings.presetSel !== undefined && document.getElementById('preset-sel')) 
      document.getElementById('preset-sel').value = settings.presetSel;
    if (settings.previewScale !== undefined && document.getElementById('preview-scale')) 
      document.getElementById('preview-scale').value = settings.previewScale;
    if (settings.exportScale !== undefined && document.getElementById('export-scale')) 
      document.getElementById('export-scale').value = settings.exportScale;
    if (settings.watermark !== undefined && document.getElementById('show-watermark')) 
      document.getElementById('show-watermark').checked = settings.watermark;
    
    if (settings.effects) {
      if (document.getElementById('rng-blur')) document.getElementById('rng-blur').value = settings.effects.blur || 0;
      if (document.getElementById('rng-noise')) document.getElementById('rng-noise').value = settings.effects.noise || 0;
      if (document.getElementById('rng-sat')) document.getElementById('rng-sat').value = settings.effects.sat || 100;
      if (document.getElementById('rng-opac')) document.getElementById('rng-opac').value = settings.effects.opac || 100;
      
      state.effectBlur = settings.effects.blur || 0;
      state.effectNoise = settings.effects.noise || 0;
      state.effectSat = settings.effects.sat || 100;
      state.effectOpac = settings.effects.opac || 100;

      if (document.getElementById('val-blur')) document.getElementById('val-blur').textContent = state.effectBlur + 'px';
      if (document.getElementById('val-noise')) document.getElementById('val-noise').textContent = state.effectNoise + '%';
      if (document.getElementById('val-sat')) document.getElementById('val-sat').textContent = state.effectSat + '%';
      if (document.getElementById('val-opac')) document.getElementById('val-opac').textContent = state.effectOpac + '%';
    }
    
    if (settings.code !== undefined) {
      if (state.jar) state.jar.updateCode(settings.code);
      else document.getElementById('html-editor').textContent = settings.code;
    }
    
    updateDimLabels();
    updateLineNums();
    updateStats();
    applyScale();
    renderPreview();
    
    return true;
  } catch (err) {
    console.error('Kbach: Failed to load settings', err);
    return false;
  }
}
