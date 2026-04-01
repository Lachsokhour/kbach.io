
import { state } from './state.js';
import { renderPreview } from './export.js';
import { scheduleSave } from './storage.js';

/**
 * Editor-related functions for Kbach.io
 */

export function onEditorChange() {
  updateLineNums();
  updateStats();
  clearTimeout(state.updateTimer);
  state.updateTimer = setTimeout(function() {
    renderPreview();
    scheduleSave();
  }, 300);
}

export function syncScroll() {
  var ed = document.getElementById('html-editor');
  var lines = document.getElementById('line-nums');
  if (lines && ed) lines.scrollTop = ed.scrollTop;
}

export function updateLineNums() {
  var val = state.jar ? state.jar.toString() : document.getElementById('html-editor').textContent;
  var lines = val.split('\n').length;
  var html = '';
  for (var i = 1; i <= lines; i++) html += i + '\n';
  var el = document.getElementById('line-nums');
  if (el) el.textContent = html;
}

export function updateStats() {
  var val = state.jar ? state.jar.toString() : document.getElementById('html-editor').textContent;
  document.getElementById('status-chars').textContent = val.length.toLocaleString() + ' chars';
  document.getElementById('status-lines').textContent = val.split('\n').length + ' lines';
}

export function formatHTML() {
  const val = state.jar ? state.jar.toString() : document.getElementById('html-editor').textContent;
  let formatted = '';
  let indent = 0;
  const tab = '  ';

  // Basic robust formatter
  val.split(/>\s*</).forEach((char, index) => {
    let line = char.trim();
    if (index > 0) line = '<' + line;
    if (index < val.split(/>\s*</).length - 1) line = line + '>';

    if (line.match(/^<\/\w/)) indent--;
    formatted += tab.repeat(Math.max(0, indent)) + line + '\n';
    if (line.match(/^<\w[^>]*[^\/]>$/) && !line.match(/^<(br|hr|img|input|meta|link|area|base|col|embed|keygen|param|source|track|wbr)/i)) {
      indent++;
    }
  });

  formatted = formatted.trim();
  if (state.jar) {
    state.jar.updateCode(formatted);
  } else {
    document.getElementById('html-editor').textContent = formatted;
  }
  updateLineNums();
  updateStats();
}

export function clearEditor() {
  const btns = document.querySelectorAll('.btn-clear-action');
  
  if (btns.length > 0 && btns[0].classList.contains('undo-mode')) {
    undoClear();
    return;
  }

  state.lastCode = state.jar ? state.jar.toString() : document.getElementById('html-editor').textContent;
  if (state.jar) state.jar.updateCode('');
  else document.getElementById('html-editor').textContent = '';
  updateLineNums();
  updateStats();
  
  btns.forEach(btn => {
    btn.classList.add('undo-mode');
    btn.innerHTML = '<i data-lucide="rotate-ccw"></i> Undo';
    if (window.lucide) window.lucide.createIcons();
    clearTimeout(btn._undoTimer);
    btn._undoTimer = setTimeout(() => {
      btn.classList.remove('undo-mode');
      btn.innerHTML = '<i data-lucide="trash-2"></i> <span class="btn-text">Clear</span>';
      if (window.lucide) window.lucide.createIcons();
    }, 6000);
  });
}

export function undoClear(e) {
  if (e) e.preventDefault();
  const btns = document.querySelectorAll('.btn-clear-action');
  btns.forEach(btn => {
    clearTimeout(btn._undoTimer);
    btn.classList.remove('undo-mode');
    btn.innerHTML = '<i data-lucide="trash-2"></i> <span class="btn-text">Clear</span>';
    if (window.lucide) window.lucide.createIcons();
  });

  if (!state.lastCode) return;
  if (state.jar) state.jar.updateCode(state.lastCode);
  else document.getElementById('html-editor').textContent = state.lastCode;
  state.lastCode = '';
  updateLineNums();
  updateStats();
  import('./ui.js').then(ui => ui.showMsg('Restored'));
}

export function copyHTML() {
  var val = state.jar ? state.jar.toString() : document.getElementById('html-editor').textContent;
  navigator.clipboard.writeText(val);
  import('./ui.js').then(ui => ui.showMsg('Copied!'));
}
