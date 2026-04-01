
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

  if (state.autoHeight) {
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
    ui.showMsg('Rendering\u2026');
  });

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

  var readyPromise = fontLoads.length > 0 
    ? Promise.all(fontLoads).then(function() { return new Promise(function(r) { setTimeout(r, 100); }); })
    : Promise.resolve();

  readyPromise.then(function() {
    var offscreen = document.createElement('iframe');
    offscreen.style.cssText = 'position:fixed;left:-99999px;top:0;border:none;opacity:0;pointer-events:none;';
    offscreen.width = state.currentW;
    offscreen.height = state.currentH;
    document.body.appendChild(offscreen);
  
    var resolved = false;
    function doCapture() {
      if (resolved) return;
      resolved = true;
      
      setTimeout(function () {
        try {
          html2canvas(offscreen.contentDocument.documentElement, {
            width: state.currentW,
            height: state.currentH,
            scale: exportScale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false,
            windowWidth: state.currentW,
            windowHeight: state.currentH,
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

              import('./ui.js').then(ui => {
                ui.showMsg('Exported \u2713');
                ui.showLoading(false);
              });
            }

            if (state.effectBlur == 0 && state.effectSat == 100 && state.effectOpac == 100 && state.effectNoise == 0) {
              finalizeExport(canvas);
              return;
            }

            var finalCanvas = document.createElement('canvas');
            finalCanvas.width = canvas.width;
            finalCanvas.height = canvas.height;
            var ctx = finalCanvas.getContext('2d');

            var blurFilter = state.effectBlur > 0 ? 'blur(' + (state.effectBlur * exportScale) + 'px) ' : '';
            var satFilter = state.effectSat != 100 ? 'saturate(' + state.effectSat + '%) ' : '';
            ctx.filter = (blurFilter + satFilter).trim() || 'none';
            ctx.globalAlpha = state.effectOpac / 100;
            
            ctx.drawImage(canvas, 0, 0);

            ctx.filter = 'none';
            ctx.globalAlpha = 1.0;

            if (state.effectNoise > 0) {
              var noiseSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + finalCanvas.width + '" height="' + finalCanvas.height + '">' +
                '<filter id="noiseFilter">' +
                  '<feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>' +
                '</filter>' +
                '<rect width="100%" height="100%" filter="url(#noiseFilter)" opacity="' + (state.effectNoise / 100) + '" />' +
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
            import('./ui.js').then(ui => {
              ui.showMsg('Export failed', true);
              ui.showLoading(false);
            });
          });
        } catch (err) {
          console.error(err);
          import('./ui.js').then(ui => {
            ui.showMsg('Export failed', true);
            ui.showLoading(false);
          });
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

export function getWatermarkHTML() {
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
