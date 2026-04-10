
import { state } from './state.js';
import { scheduleSave } from './storage.js';

/**
 * Export and Preview logic for Kbach.io
 */

export function renderPreview() {
  var val = state.jar ? state.jar.toString() : document.getElementById('html-editor').textContent;
  var html = val.trim();
  var iframe = document.getElementById('preview-iframe');
  if (!iframe) return;
  iframe.width = state.currentW;
  iframe.height = state.autoHeight ? 1 : state.currentH;

  var doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();

  var injections = getInjectedHTML();
  let fullHtml = '';
  
  if (html.toLowerCase().includes('<html')) {
    fullHtml = html;
    // Attempt to inject into existing head/body
    if (fullHtml.includes('</head>')) {
      fullHtml = fullHtml.replace('</head>', injections.match(/<link|<style|<script/g) ? injections.replace(/<div.*<\/div>/gs, '') + '</head>' : '</head>');
    }
    if (fullHtml.includes('</body>')) {
      fullHtml = fullHtml.replace('</body>', injections.match(/<div/g) ? injections.match(/<div.*<\/div>/gs)[0] + '</body>' : '</body>');
    }
  } else {
    fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8">${injections}</head><body>${html}</body></html>`;
  }

  // Ensure all remote links and scripts have crossorigin="anonymous" to prevent SecurityError
  fullHtml = fullHtml.replace(/<link([^>]+)href=["'](http[^"']+)["']([^>]*)/gi, function(match, p1, p2, p3) {
    if (p1.includes('crossorigin') || p3.includes('crossorigin')) return match;
    return '<link' + p1 + 'href="' + p2 + '" crossorigin="anonymous"' + p3;
  });
  fullHtml = fullHtml.replace(/<script([^>]+)src=["'](http[^"']+)["']([^>]*)/gi, function(match, p1, p2, p3) {
    if (p1.includes('crossorigin') || p3.includes('crossorigin')) return match;
    return '<script' + p1 + 'src="' + p2 + '" crossorigin="anonymous"' + p3;
  });

  if (state.autoHeight) {
    var closeTag = '</' + 'script>';
    var probe = '<script>'
      + 'window.addEventListener("load", function() {'
      + '  var updateH = function() {'
      + '    var h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);'
      + '    window.parent.postMessage({type:"autoH", h:h}, "*");'
      + '  };'
      + '  if (window.ResizeObserver) {'
      + '    new ResizeObserver(updateH).observe(document.body);'
      + '  }'
      + '  updateH();'
      + '});'
      + closeTag;
    
    fullHtml = fullHtml.replace('</body>', probe + '</body>');
  }

  doc.write(fullHtml);
  doc.close();

  import('./ui.js').then(ui => ui.applyLiveEffects());

  if (!state.autoHeight) {
    iframe.onload = null;
    applyScale();
  }
  scheduleSave();
}

export function reloadPreview() { renderPreview(); }

export function applyScale() {
  var scaleInp = document.getElementById('preview-scale');
  if (!scaleInp) return;
  var scale = parseFloat(scaleInp.value);
  var wrap = document.getElementById('preview-wrap');
  var viewport = document.getElementById('preview-viewport');
  if (!viewport || !wrap) return;
  var vpW = viewport.clientWidth - 80;
  var autoScale = Math.min(scale, vpW / state.currentW);
  wrap.style.transform = 'scale(' + autoScale + ')';
  var scaledH = state.currentH * autoScale;
  var scaledW = state.currentW * autoScale;
  wrap.style.marginBottom = (-(state.currentH - scaledH)) + 'px';
  wrap.style.marginRight = (-(state.currentW - scaledW) / 2) + 'px';
  wrap.style.marginLeft = (-(state.currentW - scaledW) / 2) + 'px';
  wrap.style.marginTop = '0';
}

export function exportPNG() {
  var val = state.jar ? state.jar.toString() : document.getElementById('html-editor').textContent;
  var html = val.trim();
  if (!html) {
    import('./ui.js').then(ui => ui.showMsg('Editor is empty', true));
    return;
  }

  var exportScale = parseInt(document.getElementById('export-scale').value) || 2;
  import('./ui.js').then(ui => {
    ui.showLoading(true);
    ui.showMsg('Rendering with High-Fidelity\u2026');
  });

  // Prepare full document for rendering
  const injections = getInjectedHTML();
  let fullHtml = '';
  if (html.toLowerCase().includes('<html')) {
    // If user provided a full document, inject features into head and body
    fullHtml = html;
    if (fullHtml.includes('</head>')) {
      fullHtml = fullHtml.replace('</head>', injections.match(/<link|<style|<script/g) ? injections + '</head>' : '</head>');
    }
    if (fullHtml.includes('</body>')) {
      fullHtml = fullHtml.replace('</body>', injections.match(/<div/g) ? injections + '</body>' : '</body>');
    }
  } else {
    fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8">${injections}</head><body>${html}</body></html>`;
  }

  // Ensure all remote links and scripts have crossorigin="anonymous" to prevent SecurityError
  fullHtml = fullHtml.replace(/<link([^>]+)href=["'](http[^"']+)["']([^>]*)/gi, function(match, p1, p2, p3) {
    if (p1.includes('crossorigin') || p3.includes('crossorigin')) return match;
    return '<link' + p1 + 'href="' + p2 + '" crossorigin="anonymous"' + p3;
  });
  fullHtml = fullHtml.replace(/<script([^>]+)src=["'](http[^"']+)["']([^>]*)/gi, function(match, p1, p2, p3) {
    if (p1.includes('crossorigin') || p3.includes('crossorigin')) return match;
    return '<script' + p1 + 'src="' + p2 + '" crossorigin="anonymous"' + p3;
  });

  // Use a temporary hidden iframe for clean rendering environment
  var offscreen = document.createElement('iframe');
  offscreen.style.cssText = 'position:fixed;left:-9999px;top:0;width:' + state.currentW + 'px;height:' + state.currentH + 'px;border:none;pointer-events:none;';
  document.body.appendChild(offscreen);

  var doc = offscreen.contentDocument || offscreen.contentWindow.document;
  doc.open();
  doc.write(fullHtml);
  doc.close();

  // Wait for all assets (Tailwind, Fonts, Images) to load
  const startRender = () => {
    const target = doc.documentElement;
    
    htmlToImage.toPng(target, {
      width: state.currentW,
      height: state.currentH,
      pixelRatio: exportScale,
      backgroundColor: null,
      cacheBust: true, // Prevent cached images from failing to render
      style: {
        transform: 'none',
        left: '0',
        top: '0'
      }
    })
    .then(function(dataUrl) {
      document.body.removeChild(offscreen);
      
      const finalize = (finalUrl) => {
        var thumb = document.getElementById('output-thumb');
        if (thumb) {
          thumb.src = finalUrl;
          thumb.style.display = 'block';
        }

        var outInfo = document.getElementById('output-info');
        if (outInfo) {
          outInfo.innerHTML =
            '<div class="output-info-row">Dimensions: <span>' + (state.currentW * exportScale) + ' \u00d7 ' + (state.currentH * exportScale) + 'px</span></div>' +
            '<div class="output-info-row">Scale: <span>' + exportScale + '\u00d7</span></div>' +
            '<div class="output-info-row">Engine: <span style="color:var(--accent)">High-Fidelity</span></div>';
        }

        var outBody = document.getElementById('output-body');
        if (outBody) outBody.classList.add('open');
        var outIcon = document.getElementById('out-icon');
        if (outIcon) outIcon.classList.add('open');
        var outBadge = document.getElementById('out-badge');
        if (outBadge) outBadge.style.display = 'inline';

        var ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
        var a = document.createElement('a');
        a.href = finalUrl;
        a.download = 'kbach-' + ts + '.png';
        a.click();

        import('./ui.js').then(ui => {
          ui.showMsg('Exported \u2713');
          ui.showLoading(false);
        });
      };

      // Re-apply effects (blur, saturation, noise) on the final canvas if needed
      if (state.effectBlur == 0 && state.effectSat == 100 && state.effectOpac == 100 && state.effectNoise == 0) {
        finalize(dataUrl);
        return;
      }

      // If effects are present, we draw the PNG data URL to a canvas and apply them
      const img = new Image();
      img.onload = function() {
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = state.currentW * exportScale;
        finalCanvas.height = state.currentH * exportScale;
        const ctx = finalCanvas.getContext('2d');
        
        // High Quality Smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const blurFilter = state.effectBlur > 0 ? 'blur(' + (state.effectBlur * exportScale) + 'px) ' : '';
        const satFilter = state.effectSat != 100 ? 'saturate(' + state.effectSat + '%) ' : '';
        ctx.filter = (blurFilter + satFilter).trim() || 'none';
        ctx.globalAlpha = state.effectOpac / 100;
        ctx.drawImage(img, 0, 0, finalCanvas.width, finalCanvas.height);

        ctx.filter = 'none';
        ctx.globalAlpha = 1.0;

        if (state.effectNoise > 0) {
          applyNoiseToCanvas(finalCanvas, state.effectNoise, () => {
            finalize(finalCanvas.toDataURL('image/png'));
          });
        } else {
          finalize(finalCanvas.toDataURL('image/png'));
        }
      };
      img.src = dataUrl;
    })
    .catch(function(err) {
      console.error('Export failed:', err);
      if (offscreen.parentNode) document.body.removeChild(offscreen);
      import('./ui.js').then(ui => {
        ui.showMsg('Export failed', true);
        ui.showLoading(false);
      });
    });
  };

  // Wait for fonts to be ready or timeout after 3s
  if (offscreen.contentWindow.document.fonts) {
    Promise.race([
      offscreen.contentWindow.document.fonts.ready,
      new Promise(resolve => setTimeout(resolve, 3000))
    ]).then(startRender);
  } else {
    setTimeout(startRender, 2000);
  }
}

function applyNoiseToCanvas(canvas, noiseAmount, callback) {
  const noiseSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + canvas.width + '" height="' + canvas.height + '">' +
    '<filter id="noiseFilter">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>' +
    '</filter>' +
    '<rect width="100%" height="100%" filter="url(#noiseFilter)" opacity="' + (noiseAmount / 100) + '" />' +
  '</svg>';
  
  const svgBlob = new Blob([noiseSvg], {type: 'image/svg+xml;charset=utf-8'});
  const URLObj = window.URL || window.webkitURL || window;
  const svgUrl = URLObj.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = function() {
    canvas.getContext('2d').drawImage(img, 0, 0);
    URLObj.revokeObjectURL(svgUrl);
    callback();
  };
  img.onerror = function() {
    URLObj.revokeObjectURL(svgUrl);
    callback();
  };
  img.src = svgUrl;
}

export function updateExportLabel() {
  var scaleInp = document.getElementById('export-scale');
  if (!scaleInp) return;
  var scale = parseInt(scaleInp.value) || 2;
  var outW = state.currentW * scale;
  var outH = state.currentH * scale;
  var label = document.getElementById('export-px-label');
  if (label) label.textContent = outW + ' \u00d7 ' + outH + 'px';
  scheduleSave();
}

export function getInjectedHTML() {
  let html = '';
  
  // 1. Watermark
  const showWatermark = document.getElementById('show-watermark')?.checked;
  if (showWatermark) {
    html += `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;600&display=swap" rel="stylesheet" crossorigin="anonymous">`;
    html += '<style>'
      + '.kb-watermark {'
      + '  position: absolute; bottom: 0; right: 0; padding: 8px 14px;'
      + '  font-family: "Kantumruy Pro", -apple-system, sans-serif;'
      + '  font-size: 11px; font-weight: 600; color: rgba(0,0,0,0.4);'
      + '  background: rgba(255,255,255,0.7); backdrop-filter: blur(8px);'
      + '  -webkit-backdrop-filter: blur(8px); border-top-left-radius: 10px;'
      + '  z-index: 999999; pointer-events: none; letter-spacing: 0.01em;'
      + '  box-shadow: 0 0 0 1px rgba(0,0,0,0.05);'
      + '}'
      + '</style>'
      + '<div class="kb-watermark">Made with Kbach.io \u2014 \u1780\u17d2\u1794\u17b6\u1785\u17cb</div>';
  }

  // 2. Modern Reset
  if (state.useReset) {
    html += '<style>'
      + '*,::before,::after{box-sizing:border-box;margin:0;padding:0;}'
      + 'html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;}'
      + 'body{line-height:inherit;min-height:100vh;}'
      + 'img,svg,video,canvas,audio,iframe,embed,object{display:block;vertical-align:middle;max-width:100%;height:auto;}'
      + 'h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit;}'
      + 'ol,ul{list-style:none;}'
      + '</style>';
  } else {
    // Basic body reset always
    html += '<style>body { margin: 0; min-height: 100vh; position: relative; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; }</style>';
  }

  // 3. Tailwind CDN
  if (state.useTailwind) {
    html += '<script src="https://cdn.tailwindcss.com" crossorigin="anonymous"></script>';
  }

  // 4. Lucide Icons
  if (state.useLucide) {
    html += '<script src="https://unpkg.com/lucide@latest" crossorigin="anonymous"></script>';
    html += '<script>window.addEventListener("load", function(){ if(window.lucide) lucide.createIcons(); });</script>';
  }

  // 5. Google Fonts
  if (state.googleFonts && state.googleFonts.trim()) {
    const families = state.googleFonts.split(',').map(f => f.trim().replace(/\s+/g, '+')).join('&family=');
    html += `<link rel="preconnect" href="https://fonts.googleapis.com">`;
    html += `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`;
    html += `<link href="https://fonts.googleapis.com/css2?family=${families}&display=swap" rel="stylesheet" crossorigin="anonymous">`;
  }

  return html;
}

export async function copyImage() {
  const thumb = document.getElementById('output-thumb');
  if (!thumb || !thumb.src || thumb.style.display === 'none') {
    import('./ui.js').then(ui => ui.showMsg('Generate image first', true));
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
    import('./ui.js').then(ui => ui.showMsg('Image copied!'));
  } catch (err) {
    console.error(err);
    import('./ui.js').then(ui => ui.showMsg('Copy failed', true));
  }
}
