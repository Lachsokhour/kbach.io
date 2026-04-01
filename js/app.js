import { CodeJar } from 'https://unpkg.com/codejar@latest/dist/codejar.js';

// ─── State ───────────────────────────────────────────────────
var updateTimer = null;
var currentW = 1200, currentH = 630;
var autoHeight = false;
var jar = null;
var lastCode = '';

// ─── Init ────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', function () {
  updateThemeIcon();

  const editorEl = document.getElementById('html-editor');
  if (editorEl && CodeJar) {
    const highlight = (editor) => {
      const code = editor.textContent;
      editor.innerHTML = Prism.highlight(code, Prism.languages.markup, 'markup');
    };
    jar = CodeJar(editorEl, highlight);
    jar.onUpdate(onEditorChange);
    editorEl.addEventListener('scroll', syncScroll);
  }

  loadTemplate('og');
  document.getElementById('inp-w').addEventListener('change', onDimChange);
  document.getElementById('inp-h').addEventListener('change', onDimChange);
});

// Expose globals for inline onclick
window.loadTemplate = loadTemplate;
window.onEditorChange = onEditorChange;
window.onDimInput = onDimInput;
window.onDimChange = onDimChange;
window.loadPreset = loadPreset;
window.onAutoHChange = onAutoHChange;
window.formatHTML = formatHTML;
window.clearEditor = clearEditor;
window.copyHTML = copyHTML;
window.reloadPreview = reloadPreview;
window.toggleTheme = toggleTheme;
window.exportPNG = exportPNG;
window.copyImage = copyImage;
window.toggleOutput = toggleOutput;
window.undoClear = undoClear;
window.syncScroll = syncScroll;

function loadTemplate(name) {
  var t = TEMPLATES[name];
  if (!t) return;
  if (jar) {
    jar.updateCode(t.html);
  } else {
    document.getElementById('html-editor').textContent = t.html;
  }
  document.getElementById('inp-w').value = t.w;
  currentW = t.w; currentH = t.h;
  setAutoH(false);
  document.getElementById('inp-h').value = t.h;
  var presetSel = document.getElementById('preset-sel');
  var matchVal = t.w + ',' + t.h;
  var matched = false;
  for (var i = 0; i < presetSel.options.length; i++) {
    if (presetSel.options[i].value === matchVal) { matched = true; break; }
  }
  presetSel.value = matched ? matchVal : '';
  updateDimLabels();
  updateLineNums();
  updateStats();
  renderPreview();
}

// ─── Editor ──────────────────────────────────────────────────
function onEditorChange() {
  updateLineNums();
  updateStats();
  clearTimeout(updateTimer);
  updateTimer = setTimeout(renderPreview, 300);
}

function syncScroll() {
  var ed = document.getElementById('html-editor');
  var lines = document.getElementById('line-nums');
  if (lines && ed) lines.scrollTop = ed.scrollTop;
}

function updateLineNums() {
  var val = jar ? jar.toString() : document.getElementById('html-editor').textContent;
  var lines = val.split('\n').length;
  var html = '';
  for (var i = 1; i <= lines; i++) html += i + '\n';
  var el = document.getElementById('line-nums');
  if (el) el.textContent = html;
}

function updateStats() {
  var val = jar ? jar.toString() : document.getElementById('html-editor').textContent;
  document.getElementById('status-chars').textContent = val.length.toLocaleString() + ' chars';
  document.getElementById('status-lines').textContent = val.split('\n').length + ' lines';
}

function onDimInput() {
  document.getElementById('preset-sel').value = '';
}

function onDimChange() {
  currentW = parseInt(document.getElementById('inp-w').value) || 1200;
  if (!autoHeight) {
    currentH = parseInt(document.getElementById('inp-h').value) || 630;
  }
  updateDimLabels();
  renderPreview();
}

function loadPreset() {
  var val = document.getElementById('preset-sel').value;
  if (!val) return;
  var parts = val.split(',');
  currentW = parseInt(parts[0]); currentH = parseInt(parts[1]);
  document.getElementById('inp-w').value = currentW;
  document.getElementById('inp-h').value = currentH;
  setAutoH(false);
  updateDimLabels();
  renderPreview();
}

function onAutoHChange() {
  setAutoH(document.getElementById('auto-h').checked);
  renderPreview();
}

function setAutoH(on) {
  autoHeight = on;
  document.getElementById('auto-h').checked = on;
  var hInput = document.getElementById('inp-h');
  hInput.disabled = on;
  if (on) {
    hInput.placeholder = 'auto';
    hInput.value = '';
  } else {
    hInput.placeholder = '';
    hInput.value = currentH;
  }
}

function updateDimLabels() {
  var label = currentW + ' \u00d7 ' + currentH;
  document.getElementById('status-dim').textContent = label;
  document.getElementById('preview-size-badge').textContent = label;
  document.getElementById('frame-label').textContent = currentW + ' \u00d7 ' + currentH + 'px';
  document.getElementById('preview-iframe').width = currentW;
  document.getElementById('preview-iframe').height = currentH;
  updateExportLabel();
}

function updateExportLabel() {
  var scale = parseInt(document.getElementById('export-scale').value) || 2;
  var outW = currentW * scale;
  var outH = currentH * scale;
  document.getElementById('export-px-label').textContent = outW + ' \u00d7 ' + outH + 'px';
}

function formatHTML() {
  const val = jar ? jar.toString() : document.getElementById('html-editor').textContent;
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
  if (jar) {
    jar.updateCode(formatted);
  } else {
    document.getElementById('html-editor').textContent = formatted;
  }
  updateLineNums();
  updateStats();
}

function clearEditor(e) {
  const btns = document.querySelectorAll('.btn-clear-action');
  
  if (btns.length > 0 && btns[0].classList.contains('undo-mode')) {
    undoClear();
    return;
  }

  lastCode = jar ? jar.toString() : document.getElementById('html-editor').textContent;
  if (jar) jar.updateCode('');
  else document.getElementById('html-editor').textContent = '';
  updateLineNums();
  updateStats();
  
  btns.forEach(btn => {
    btn.classList.add('undo-mode');
    btn.innerHTML = '<i data-lucide="rotate-ccw"></i> Undo';
    if (window.lucide) lucide.createIcons();
    clearTimeout(btn._undoTimer);
    btn._undoTimer = setTimeout(() => {
      btn.classList.remove('undo-mode');
      // If it's a mobile icon-only button, maybe just revert to trash icon if we had specific logic,
      // but let's just make sure they both share the text on standard reset, 
      // or we can remove the label contextually via CSS.
      btn.innerHTML = '<i data-lucide="trash-2"></i> <span class="btn-text">Clear</span>';
      if (window.lucide) lucide.createIcons();
    }, 6000);
  });
}

function undoClear(e) {
  if (e) e.preventDefault();
  const btns = document.querySelectorAll('.btn-clear-action');
  btns.forEach(btn => {
    clearTimeout(btn._undoTimer);
    btn.classList.remove('undo-mode');
    btn.innerHTML = '<i data-lucide="trash-2"></i> <span class="btn-text">Clear</span>';
    if (window.lucide) lucide.createIcons();
  });

  if (!lastCode) return;
  if (jar) jar.updateCode(lastCode);
  else document.getElementById('html-editor').textContent = lastCode;
  lastCode = '';
  updateLineNums();
  updateStats();
  showMsg('Restored');
}

function copyHTML() {
  var val = jar ? jar.toString() : document.getElementById('html-editor').textContent;
  navigator.clipboard.writeText(val);
  showMsg('Copied!');
}

// ─── Preview ─────────────────────────────────────────────────
function renderPreview() {
  var val = jar ? jar.toString() : document.getElementById('html-editor').textContent;
  var html = val.trim();
  var iframe = document.getElementById('preview-iframe');
  iframe.width = currentW;
  iframe.height = autoHeight ? 1 : currentH;

  var doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();

  if (autoHeight) {
    var closeTag = '</' + 'script>';
    var probe = '<script>'
      + '(function poll(attempts){'
      + 'var h=Math.max('
      + 'document.body?document.body.scrollHeight:0,'
      + 'document.documentElement?document.documentElement.scrollHeight:0'
      + ');'
      + 'if(h>0){parent.postMessage({type:"autoH",h:h},"*");}'
      + 'if(attempts>0)setTimeout(function(){poll(attempts-1);},150);'
      + '})(6);'
      + closeTag;
    
    var watermark = getWatermarkHTML();
    var injected = html.indexOf('</body>') !== -1 
      ? html.replace('</body>', watermark + probe + '</body>') 
      : html + watermark + probe;
    doc.write(injected);
  } else {
    var watermark = getWatermarkHTML();
    var injected = html.indexOf('</body>') !== -1 
      ? html.replace('</body>', watermark + '</body>') 
      : html + watermark;
    doc.write(injected);
  }
  doc.close();

  // Apply Live Effects on render
  applyLiveEffects();

  if (!autoHeight) {
    iframe.onload = null;
    applyScale();
  }
}

// Listen for height reports from iframe
window.addEventListener('message', function (e) {
  if (!autoHeight || !e.data || e.data.type !== 'autoH') return;
  var h = Math.round(e.data.h);
  if (h > 0 && h < 30000) {
    currentH = h;
    var iframe = document.getElementById('preview-iframe');
    iframe.height = h;
    document.getElementById('inp-h').placeholder = h + 'px';
    updateDimLabels();
    applyScale();
  }
});

function reloadPreview() { renderPreview(); }

function applyScale() {
  var scale = parseFloat(document.getElementById('preview-scale').value);
  var wrap = document.getElementById('preview-wrap');
  var viewport = document.getElementById('preview-viewport');
  if (!viewport) return;
  var vpW = viewport.clientWidth - 80;
  var autoScale = Math.min(scale, vpW / currentW);
  wrap.style.transform = 'scale(' + autoScale + ')';
  var scaledH = currentH * autoScale;
  var scaledW = currentW * autoScale;
  wrap.style.marginBottom = (-(currentH - scaledH)) + 'px';
  wrap.style.marginRight = (-(currentW - scaledW) / 2) + 'px';
  wrap.style.marginLeft = (-(currentW - scaledW) / 2) + 'px';
  wrap.style.marginTop = '0';
}

// ─── Theme ────────────────────────────────────────────────────
function toggleTheme() {
  document.documentElement.classList.toggle('light');
  localStorage.setItem('theme', document.documentElement.classList.contains('light') ? 'light' : 'dark');
  updateThemeIcon();
}

function updateThemeIcon() {
  var isLight = localStorage.getItem('theme') === 'light';
  if (isLight) document.documentElement.classList.add('light');
  else document.documentElement.classList.remove('light');

  var btn = document.getElementById('theme-btn');
  if (btn) {
    btn.innerHTML = isLight ? '<i data-lucide="moon"></i>' : '<i data-lucide="sun"></i>';
    if (window.lucide) lucide.createIcons();
  }
}

// ─── Export ───────────────────────────────────────────────────
function exportPNG() {
  var val = jar ? jar.toString() : document.getElementById('html-editor').textContent;
  var html = val.trim();
  if (!html) {
    showMsg('Editor is empty', true);
    return;
  }

  var exportScale = parseInt(document.getElementById('export-scale').value) || 2;
  showLoading(true);
  showMsg('Rendering\u2026');

  // Pre-load web fonts from the generated HTML into the main document to ensure html2canvas can access them
  var parser = new DOMParser();
  var parsedHtml = parser.parseFromString(html, 'text/html');
  var links = parsedHtml.querySelectorAll('link[rel="stylesheet"]');
  var fontLoads = [];
  
  links.forEach(function(link) {
    var href = link.getAttribute('href');
    if (href && !document.querySelector('link[href="' + href + '"]')) {
      var newLink = document.createElement('link');
      newLink.rel = 'stylesheet';
      newLink.href = href;
      document.head.appendChild(newLink);
      
      fontLoads.push(new Promise(function(resolve) {
        newLink.onload = resolve;
        newLink.onerror = resolve;
      }));
    }
  });

  // Give the browser a tiny delay if no new links are added to ensure fonts cache is ready
  var readyPromise = fontLoads.length > 0 
    ? Promise.all(fontLoads).then(function() { return new Promise(function(r) { setTimeout(r, 100); }); })
    : Promise.resolve();

  readyPromise.then(function() {
    var offscreen = document.createElement('iframe');
    offscreen.style.cssText = 'position:fixed;left:-99999px;top:0;border:none;opacity:0;pointer-events:none;';
    offscreen.width = currentW;
    offscreen.height = currentH;
    document.body.appendChild(offscreen);
  
    var resolved = false;
    function doCapture() {
      if (resolved) return;
      resolved = true;
      
      setTimeout(function () {
        try {
          html2canvas(offscreen.contentDocument.documentElement, {
            width: currentW,
            height: currentH,
            scale: exportScale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false,
            windowWidth: currentW,
            windowHeight: currentH,
            scrollX: 0,
            scrollY: 0
          }).then(function (canvas) {
            document.body.removeChild(offscreen);
          
          function finalizeExport(exportCanvas) {
            var url = exportCanvas.toDataURL('image/png');
            var actualW = exportCanvas.width;
            var actualH = exportCanvas.height;

            var thumb = document.getElementById('output-thumb');
            if (thumb) {
              thumb.src = url;
              thumb.style.display = 'block';
            }

            var outInfo = document.getElementById('output-info');
            if (outInfo) {
              outInfo.innerHTML =
                '<div class="output-info-row">Dimensions: <span>' + actualW + ' \u00d7 ' + actualH + 'px</span></div>' +
                '<div class="output-info-row">Scale: <span>' + exportScale + '\u00d7</span></div>' +
                '<div class="output-info-row">Format: <span>PNG</span></div>';
            }

            var outBody = document.getElementById('output-body');
            if (outBody) outBody.classList.add('open');
            var outIcon = document.getElementById('out-icon');
            if (outIcon) outIcon.classList.add('open');
            var outBadge = document.getElementById('out-badge');
            if (outBadge) outBadge.style.display = 'inline';

            var now = new Date();
            var ts = now.getFullYear() +
              ('0' + (now.getMonth() + 1)).slice(-2) +
              ('0' + now.getDate()).slice(-2) + '-' +
              ('0' + now.getHours()).slice(-2) +
              ('0' + now.getMinutes()).slice(-2) +
              ('0' + now.getSeconds()).slice(-2);

            var a = document.createElement('a');
            a.href = url;
            a.download = 'kbach-io-' + ts + '.png';
            a.click();

            showMsg('Exported \u2713');
            showLoading(false);
          }

          if (effectBlur == 0 && effectSat == 100 && effectOpac == 100 && effectNoise == 0) {
            finalizeExport(canvas);
            return;
          }

          var finalCanvas = document.createElement('canvas');
          finalCanvas.width = canvas.width;
          finalCanvas.height = canvas.height;
          var ctx = finalCanvas.getContext('2d');

          var blurFilter = effectBlur > 0 ? 'blur(' + (effectBlur * exportScale) + 'px) ' : '';
          var satFilter = effectSat != 100 ? 'saturate(' + effectSat + '%) ' : '';
          ctx.filter = (blurFilter + satFilter).trim() || 'none';
          ctx.globalAlpha = effectOpac / 100;
          
          // Draw the html2canvas snapshot with blur/saturation/opacity filters applied 
          ctx.drawImage(canvas, 0, 0);

          // Reset filter before drawing noise
          ctx.filter = 'none';
          ctx.globalAlpha = 1.0;

          if (effectNoise > 0) {
            var noiseSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + finalCanvas.width + '" height="' + finalCanvas.height + '">' +
              '<filter id="noiseFilter">' +
                '<feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>' +
              '</filter>' +
              '<rect width="100%" height="100%" filter="url(#noiseFilter)" opacity="' + (effectNoise / 100) + '" />' +
            '</svg>';
            
            var svgBlob = new Blob([noiseSvg], {type: 'image/svg+xml;charset=utf-8'});
            var URLObj = window.URL || window.webkitURL || window;
            var svgUrl = URLObj.createObjectURL(svgBlob);
            var img = new Image();
            img.onload = function() {
              ctx.drawImage(img, 0, 0);
              URLObj.revokeObjectURL(svgUrl);
              finalizeExport(finalCanvas);
            };
            img.onerror = function() {
              URLObj.revokeObjectURL(svgUrl);
              finalizeExport(finalCanvas); 
            };
            img.src = svgUrl;
          } else {
            finalizeExport(finalCanvas);
          }

        }).catch(function (err) {
          console.error(err);
          showMsg('Export failed', true);
          showLoading(false);
        });
      } catch (err) {
        console.error(err);
        showMsg('Export failed', true);
        showLoading(false);
      }
    }, 500);
  }

  offscreen.onload = doCapture;
  var doc = offscreen.contentDocument || offscreen.contentWindow.document;
  doc.open();
  
  var watermark = getWatermarkHTML();
  var injected = html.indexOf('</body>') !== -1 
    ? html.replace('</body>', watermark + '</body>') 
    : html + watermark;
  
  doc.write(injected);
  doc.close();
  
  setTimeout(doCapture, 1200);
  });
}

async function copyImage() {
  const thumb = document.getElementById('output-thumb');
  if (!thumb || !thumb.src || thumb.style.display === 'none') {
    showMsg('Generate image first', true);
    return;
  }

  try {
    const response = await fetch(thumb.src);
    const blob = await response.blob();
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob
      })
    ]);
    showMsg('Image copied!');
  } catch (err) {
    console.error(err);
    showMsg('Copy failed', true);
  }
}

// ─── UI helpers ───────────────────────────────────────────────
function showLoading(on) {
  var el = document.getElementById('preview-loading');
  if (!el) return;
  if (on) el.classList.add('show');
  else el.classList.remove('show');
}

function showMsg(msg, err) {
  var el = document.getElementById('status-msg');
  if (!el) return;
  el.innerHTML = msg;
  el.style.color = err ? 'var(--danger)' : 'var(--accent)';
  clearTimeout(el._t);
  el._t = setTimeout(function () { el.innerHTML = ''; }, 4000);
}

function toggleOutput() {
  var body = document.getElementById('output-body');
  var icon = document.getElementById('out-icon');
  if (body) body.classList.toggle('open');
  if (icon) icon.classList.toggle('open');
}

// ─── Utility ───────────────────────────────────────────

// Global Event Listeners
document.addEventListener('DOMContentLoaded', function() {

  document.addEventListener('keydown', function (e) {
    if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      // CodeJar handles native undo
    }
  });

  // ─── Resize observer for auto-scale ──────────────────────────
  var _resizeTimer = null;
  var viewport = document.getElementById('preview-viewport');
  if (window.ResizeObserver && viewport) {
    new ResizeObserver(function () {
      if (_resizeTimer) return;
      _resizeTimer = requestAnimationFrame(function () { _resizeTimer = null; applyScale(); });
    }).observe(viewport);
  }
});

function getWatermarkHTML() {
  const show = document.getElementById('show-watermark')?.checked;
  if (!show) return '';
  
  return '<style>'
    + '@import url("https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;600&display=swap");'
    + 'body { position: relative; min-height: 100vh; margin: 0; }'
    + '.kb-watermark {'
    + '  position: absolute;'
    + '  bottom: 0;'
    + '  right: 0;'
    + '  padding: 8px 14px;'
    + '  font-family: "Kantumruy Pro", -apple-system, sans-serif;'
    + '  font-size: 12px;'
    + '  font-weight: 600;'
    + '  color: rgba(0,0,0,0.45);'
    + '  background: rgba(255,255,255,0.6);'
    + '  backdrop-filter: blur(8px);'
    + '  -webkit-backdrop-filter: blur(8px);'
    + '  border-top-left-radius: 10px;'
    + '  z-index: 999999;'
    + '  pointer-events: none;'
    + '  letter-spacing: 0.01em;'
    + '  line-height: 1;'
    + '  box-shadow: 0 0 0 1px rgba(0,0,0,0.05);'
    + '}'
    + '</style>'
    + '<div class="kb-watermark">Made with Kbach.io \u2014 \u1780\u17d2\u1794\u17b6\u1785\u17cb</div>';
}

// ─── Live Effects Panel ────────────────────────────────────────

var effectBlur = 0;
var effectNoise = 0;
var effectSat = 100;
var effectOpac = 100;

function toggleEffectsPanel() {
  document.getElementById('effects-panel').classList.toggle('hidden');
}

function resetEffects() {
  document.getElementById('rng-blur').value = 0;
  document.getElementById('rng-noise').value = 0;
  document.getElementById('rng-sat').value = 100;
  document.getElementById('rng-opac').value = 100;
  onEffectChange();
}

function onEffectChange() {
  effectBlur = document.getElementById('rng-blur').value;
  effectNoise = document.getElementById('rng-noise').value;
  effectSat = document.getElementById('rng-sat').value;
  effectOpac = document.getElementById('rng-opac').value;

  document.getElementById('val-blur').textContent = effectBlur + 'px';
  document.getElementById('val-noise').textContent = effectNoise + '%';
  document.getElementById('val-sat').textContent = effectSat + '%';
  document.getElementById('val-opac').textContent = effectOpac + '%';

  applyLiveEffects();
}

function applyLiveEffects(targetIframe) {
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

  var blurFilter = effectBlur > 0 ? 'blur(' + effectBlur + 'px) ' : '';
  var satFilter = effectSat != 100 ? 'saturate(' + effectSat + '%) ' : '';
  var filterValue = (blurFilter + satFilter).trim() || 'none';
  var opacValue = effectOpac / 100;

  styleEl.textContent = `
    /* Effects Panel Styling */
    html {
      filter: ${filterValue};
      opacity: ${opacValue};
      transition: filter 0.1s ease, opacity 0.1s ease;
    }
  `;

  var noiseEl = doc.getElementById('kbach-noise-overlay');
  if (effectNoise > 0) {
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
    noiseEl.style.opacity = effectNoise / 100;
  } else if (noiseEl) {
    noiseEl.remove();
  }
}

// Ensure effects functions are globally available since this is a module
window.toggleEffectsPanel = toggleEffectsPanel;
window.closeEffectsPanel = function() {
  document.getElementById('effects-panel').classList.add('hidden');
};
window.resetEffects = resetEffects;
window.onEffectChange = onEffectChange;

