
import { state } from './state.js';
import { scheduleSave } from './storage.js';

/**
 * Export and Preview logic for Kbach.io
 */

export function renderPreview() {
  var val = state.jar ? state.jar.toString() : document.getElementById('html-editor').textContent;
  var html = val.trim();
  var tailwindNeeded = shouldEnableTailwind(html);
  var iframe = document.getElementById('preview-iframe');
  if (!iframe) return;
  iframe.width = state.currentW;
  iframe.height = state.autoHeight ? 1 : state.currentH;

  var doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();

  var injections = getInjectedHTML(tailwindNeeded);
  let fullHtml = '';
  
  if (html.toLowerCase().includes('<html')) {
    fullHtml = html;
    // Inject head stuff
    if (injections.head.trim()) {
      const headCloseMatch = fullHtml.match(/<\/head>/i);
      if (headCloseMatch) {
         fullHtml = fullHtml.replace(headCloseMatch[0], injections.head + headCloseMatch[0]);
      } else {
         // If no </head>, try to inject before <body> or at start
         const bodyOpenMatch = fullHtml.match(/<body/i);
         if (bodyOpenMatch) {
           fullHtml = fullHtml.replace(bodyOpenMatch[0], '<head>' + injections.head + '</head>' + bodyOpenMatch[0]);
         }
      }
    }
    // Inject body stuff
    if (injections.body.trim()) {
      const bodyCloseMatch = fullHtml.match(/<\/body>/i);
      if (bodyCloseMatch) {
        fullHtml = fullHtml.replace(bodyCloseMatch[0], injections.body + bodyCloseMatch[0]);
      }
    }
  } else {
    fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8">${injections.head}</head><body>${html}${injections.body}</body></html>`;
  }

  // Ensure remote stylesheet links have crossorigin="anonymous" to reduce taint issues
  fullHtml = fullHtml.replace(/<link([^>]+)href=["'](http[^"']+)["']([^>]*)/gi, function(match, p1, p2, p3) {
    if (p1.includes('crossorigin') || p3.includes('crossorigin')) return match;
    return '<link' + p1 + 'href="' + p2 + '" crossorigin="anonymous"' + p3;
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
    
    fullHtml = fullHtml.replace(/<\/body>/i, probe + '</body>');
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

  // Responsive padding: 80px on desktop, 32px on mobile
  var isMobile = window.innerWidth < 1024;
  var padding = isMobile ? 32 : 80;
  
  var vpW = viewport.clientWidth - padding;
  var vpH = viewport.clientHeight - padding;
  
  var maxScale = isMobile ? 1.5 : scale;
  var autoScale = Math.min(maxScale, vpW / state.currentW, vpH / state.currentH);
  wrap.style.transformOrigin = 'top center';
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
  var tailwindNeeded = shouldEnableTailwind(html);
  if (!html) {
    import('./ui.js').then(ui => ui.showMsg('Editor is empty', true));
    return;
  }

  var exportScale = state.exportScale || 2;
  import('./ui.js').then(ui => {
    ui.showLoading(true);
    ui.showMsg('Rendering with High-Fidelity\u2026');
  });

  // Prepare full document for rendering
  const injections = getInjectedHTML(tailwindNeeded);
  let fullHtml = '';
  if (html.toLowerCase().includes('<html')) {
    // If user provided a full document, inject features into head and body
    fullHtml = html;
    if (injections.head.trim()) {
      const headCloseMatch = fullHtml.match(/<\/head>/i);
      if (headCloseMatch) {
         fullHtml = fullHtml.replace(headCloseMatch[0], injections.head + headCloseMatch[0]);
      }
    }
    if (injections.body.trim()) {
      const bodyCloseMatch = fullHtml.match(/<\/body>/i);
      if (bodyCloseMatch) {
        fullHtml = fullHtml.replace(bodyCloseMatch[0], injections.body + bodyCloseMatch[0]);
      }
    }
  } else {
    fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8">${injections.head}</head><body>${html}${injections.body}</body></html>`;
  }

  // Ensure remote stylesheet links have crossorigin="anonymous" to reduce taint issues
  fullHtml = fullHtml.replace(/<link([^>]+)href=["'](http[^"']+)["']([^>]*)/gi, function(match, p1, p2, p3) {
    if (p1.includes('crossorigin') || p3.includes('crossorigin')) return match;
    return '<link' + p1 + 'href="' + p2 + '" crossorigin="anonymous"' + p3;
  });
  // Use a temporary hidden iframe for clean rendering environment
  var offscreen = document.createElement('iframe');
  offscreen.style.cssText = 'position:fixed;left:-9999px;top:0;width:' + state.currentW + 'px;height:' + state.currentH + 'px;border:none;pointer-events:none;';
  document.body.appendChild(offscreen);

  var doc = offscreen.contentDocument || offscreen.contentWindow.document;
  doc.open();
  doc.write(fullHtml);
  doc.close();

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
            '<div class="flex justify-between text-[10px] font-black uppercase text-gray-500">Dimensions <span class="text-white">' + (state.currentW * exportScale) + ' × ' + (state.currentH * exportScale) + 'px</span></div>' +
            '<div class="flex justify-between text-[10px] font-black uppercase text-gray-500">Render Scale <span class="text-accent">' + exportScale + 'x</span></div>' +
            '<div class="flex justify-between text-[10px] font-black uppercase text-gray-500">Pixel Engine <span class="text-white">Studio 2.0 High-Fidelity</span></div>';
        }

        var overlay = document.getElementById('export-result-overlay');
        if (overlay) overlay.classList.remove('hidden');

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

  waitForExportReady(offscreen, tailwindNeeded).then(startRender);
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
  var scale = state.exportScale || 2;
  var outW = state.currentW * scale;
  var outH = state.currentH * scale;
  var label = document.getElementById('export-px-label');
  if (label) label.textContent = outW + ' \u00d7 ' + outH + 'px';
  scheduleSave();
}

export function getInjectedHTML(forceTailwind) {
  let head = '';
  let body = '';
  
  // 1. Watermark
  const showWatermark = document.getElementById('show-watermark')?.checked;
  if (showWatermark) {
    head += `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;600&display=swap" rel="stylesheet" crossorigin="anonymous">`;
    head += '<style>'
      + '.kb-watermark {'
      + '  position: absolute; bottom: 0; right: 0; padding: 8px 14px;'
      + '  font-family: "Kantumruy Pro", -apple-system, sans-serif;'
      + '  font-size: 11px; font-weight: 600; color: rgba(0,0,0,0.4);'
      + '  background: rgba(255,255,255,0.7); backdrop-filter: blur(8px);'
      + '  -webkit-backdrop-filter: blur(8px); border-top-left-radius: 10px;'
      + '  z-index: 999999; pointer-events: none; letter-spacing: 0.01em;'
      + '  box-shadow: 0 0 0 1px rgba(0,0,0,0.05);'
      + '}'
      + '</style>';
    body += '<div class="kb-watermark">Made with Kbach.io \u2014 \u1780\u17d2\u1794\u17b6\u1785\u17cb</div>';
  }

  // 2. Modern Reset
  if (state.useReset) {
    head += '<style>'
      + '*,::before,::after{box-sizing:border-box;margin:0;padding:0;}'
      + 'html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;}'
      + 'body{line-height:inherit;min-height:100vh;}'
      + 'img,svg,video,canvas,audio,iframe,embed,object{display:block;vertical-align:middle;max-width:100%;height:auto;}'
      + 'h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit;}'
      + 'ol,ul{list-style:none;}'
      + '</style>';
  } else {
    // Basic body reset always
    head += '<style>body { margin: 0; min-height: 100vh; position: relative; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; }</style>';
  }

  // 3. Tailwind CDN
  if (forceTailwind || state.useTailwind) {
    head += '<script>'
      + '(function(){'
      + '  function markReady(){ window.__kbachTailwindReady = true; }'
      + '  function addScript(src, onDone, onFail){'
      + '    var s = document.createElement("script");'
      + '    s.src = src;'
      + '    s.onload = onDone;'
      + '    s.onerror = onFail || onDone;'
      + '    document.head.appendChild(s);'
      + '  }'
      + '  addScript("https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4",'
      + '    function(){ setTimeout(markReady, 180); },'
      + '    function(){'
      + '      addScript("https://cdn.tailwindcss.com", function(){ setTimeout(markReady, 180); });'
      + '    }'
      + '  );'
      + '  if (document.readyState === "complete" || document.readyState === "interactive") {'
      + '    setTimeout(markReady, 2400);'
      + '  } else {'
      + '    window.addEventListener("DOMContentLoaded", function(){ setTimeout(markReady, 2400); });'
      + '  }'
      + '  setTimeout(markReady, 3600);'
      + '})();'
      + '</script>';
  }

  // 4. Lucide Icons
  if (state.useLucide) {
    head += '<script src="https://unpkg.com/lucide@latest"></script>';
    // More reliable initialization for iframes
    head += '<script>function initLucide(){ if(window.lucide) lucide.createIcons(); } window.addEventListener("load", initLucide); setTimeout(initLucide, 500);</script>';
  }

  // 5. Google Fonts
  if (state.googleFonts && state.googleFonts.trim()) {
    const families = state.googleFonts.split(',').map(f => f.trim().replace(/\s+/g, '+')).join('&family=');
    head += `<link rel="preconnect" href="https://fonts.googleapis.com">`;
    head += `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`;
    head += `<link href="https://fonts.googleapis.com/css2?family=${families}&display=swap" rel="stylesheet" crossorigin="anonymous">`;
  }

  return { head, body };
}

function shouldEnableTailwind(html) {
  if (state.useTailwind) return true;
  if (!html) return false;
  var low = html.toLowerCase();

  if (low.includes('cdn.tailwindcss.com') || low.includes('text/tailwindcss') || low.includes('@tailwind')) {
    return true;
  }

  // Heuristic for utility-heavy class attributes in pasted snippets.
  var classAttr = html.match(/class\s*=\s*["']([^"']+)["']/g) || [];
  var hitCount = 0;
  for (var i = 0; i < classAttr.length; i++) {
    if (/(^|\s)(sm:|md:|lg:|xl:|2xl:|bg-|text-|font-|p[trblxy]?-\d|m[trblxy]?-\d|rounded|shadow|flex|grid|items-|justify-|gap-\d|w-\[|h-\[|from-|to-|via-)/.test(classAttr[i])) {
      hitCount++;
      if (hitCount >= 2) return true;
    }
  }
  return false;
}

function waitForExportReady(iframeEl, tailwindExpected) {
  var doc = iframeEl.contentDocument || iframeEl.contentWindow.document;
  var win = iframeEl.contentWindow;
  if (!doc || !win) return Promise.resolve();

  var timeout = function(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
  };

  var waitForLoad = new Promise(function(resolve) {
    if (doc.readyState === 'complete') return resolve();
    iframeEl.addEventListener('load', function() { resolve(); }, { once: true });
    setTimeout(resolve, 4000);
  });

  var waitForFonts = function() {
    if (!doc.fonts || !doc.fonts.ready) return Promise.resolve();
    return Promise.race([doc.fonts.ready, timeout(3000)]);
  };

  var waitForImages = function() {
    var imgs = Array.prototype.slice.call(doc.images || []);
    if (!imgs.length) return Promise.resolve();
    return Promise.race([
      Promise.all(imgs.map(function(img) {
        if (img.complete) return Promise.resolve();
        return new Promise(function(resolve) {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
          setTimeout(resolve, 2500);
        });
      })),
      timeout(3500)
    ]);
  };

  var waitForTailwind = function() {
    if (!tailwindExpected) return Promise.resolve();
    if (!doc.getElementById('kbach-tailwind-probe')) {
      var probe = doc.createElement('div');
      probe.id = 'kbach-tailwind-probe';
      probe.className = 'hidden';
      probe.style.position = 'fixed';
      probe.style.left = '-99999px';
      probe.style.top = '-99999px';
      probe.style.pointerEvents = 'none';
      (doc.body || doc.documentElement).appendChild(probe);
    }
    return Promise.race([
      new Promise(function(resolve) {
        var tries = 0;
        var t = setInterval(function() {
          tries++;
          var hasTwGlobal = !!win.tailwind;
          var hasTwStyle = !!doc.querySelector('style[data-tailwind], style[id*="tailwind"]');
          var hasReadyFlag = !!win.__kbachTailwindReady;
          var probeEl = doc.getElementById('kbach-tailwind-probe');
          var probeHidden = false;
          if (probeEl) {
            probeHidden = win.getComputedStyle(probeEl).display === 'none';
          }
          if (hasTwGlobal || hasTwStyle || hasReadyFlag || probeHidden || tries > 70) {
            clearInterval(t);
            resolve();
          }
        }, 80);
      }),
      timeout(6000)
    ]);
  };

  var raf2 = function() {
    return new Promise(function(resolve) {
      win.requestAnimationFrame(function() {
        win.requestAnimationFrame(resolve);
      });
    });
  };

  return waitForLoad
    .then(waitForFonts)
    .then(waitForImages)
    .then(waitForTailwind)
    .then(raf2)
    .catch(function() { return null; });
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
