// Kbach.io Previewer - Gemini Provider

function injectButtons() {
  // Find all pre elements
  const pres = document.querySelectorAll('pre, message-content code-block');
  
  pres.forEach(block => {
    // Skip if already processed
    if (block.dataset.kbachInjected) return;
    
    // Find the actual code container
    let codeEl = block.querySelector('code');
    
    // Sometimes the block itself is what we want
    if (!codeEl && block.tagName === 'PRE') {
        codeEl = block;
    }
    
    if (!codeEl) return;
    if (codeEl.dataset.kbachInjected) return;
    
    // Try to determine if it's HTML
    // We check classes, or text content of headers
    const wrapperText = block.parentElement.textContent.toLowerCase();
    const isHTML = codeEl.className.toLowerCase().includes('language-html') || 
                   codeEl.className.toLowerCase().includes('xml') ||
                   wrapperText.includes('html');
                   
    // If we're not sure it's HTML, we might still want to allow it, but let's be safe for now
    // Actually, users might ask Gemini to generate "Tailwind code", which might just be HTML
    // Let's inject on all code blocks, the user will know when to click it.
    
    // Find where to put the button.
    // Gemini puts a header above the `pre` usually inside a common wrapper
    let header = null;
    
    // 1. Check parent for a header div (display flex usually)
    const parentChildren = Array.from(block.parentElement.children);
    for (const child of parentChildren) {
        if (child !== block && (child.tagName === 'DIV' || child.tagName === 'HEADER')) {
            // It might be the action bar
            if (child.querySelector('button') || child.textContent.toLowerCase().includes('copy')) {
                header = child;
                break;
            }
        }
    }
    
    // If no header found, look for button wrappers nearby
    if (!header) {
        let parent = block.parentElement;
        while(parent && parent.tagName !== 'MESSAGE-CONTENT' && parent.tagName !== 'BODY') {
            const btns = parent.querySelectorAll('button');
            if (btns.length > 0) {
                // Find nearest common ancestor of button and code block
                header = btns[0].parentElement;
                break;
            }
            parent = parent.parentElement;
        }
    }

    const btn = document.createElement('button');
    btn.className = 'kbach-preview-btn';
    btn.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.73 20.83L17.58 18l-2.85-2.83 1.42-1.41L19 16.59l2.85-2.83 1.41 1.41L20.41 18l2.85 2.83-1.41 1.41L19 19.41l-2.85 2.83-1.42-1.41zM21 9V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h8.17l-.84-2H5V5h14v4.17l2 2V9zM11 11h2v-2h-2v2zM7 11h2v-2H7v2zm8 0h2v-2h-2v2z" fill="currentColor"/>
        </svg>
    `;
    
    btn.title = "Preview HTML in Kbach.io";
    
    btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        let rawCode = "";
        if (codeEl.innerText) {
            rawCode = codeEl.innerText;
        } else {
            rawCode = codeEl.textContent;
        }
        
        // Remove typical copy text or markdown markers if any got caught
        rawCode = rawCode.replace(/^```html\n?/, '').replace(/\n?```$/, '');
        
        // Notify background script
        chrome.runtime.sendMessage({
            action: 'open_kbach',
            html: rawCode
        });
        
        // Visual feedback
        const originalHtml = btn.innerHTML;
        btn.innerHTML = 'Sent!';
        setTimeout(() => btn.innerHTML = originalHtml, 2000);
    };
    
    if (header) {
        // Find existing copy button and place it nearby
        const copyBtn = Array.from(header.querySelectorAll('button')).pop();
        if (copyBtn && copyBtn.parentNode) {
            // Append after copy button
            copyBtn.parentNode.insertBefore(btn, copyBtn.nextSibling);
        } else {
            header.appendChild(btn);
        }
    } else {
        // Fallback: create our own small header above the block
        const fallbackHeader = document.createElement('div');
        fallbackHeader.style.display = 'flex';
        fallbackHeader.style.justifyContent = 'flex-end';
        fallbackHeader.style.padding = '4px 8px';
        block.parentNode.insertBefore(fallbackHeader, block);
        fallbackHeader.appendChild(btn);
    }
    
    codeEl.dataset.kbachInjected = "true";
    block.dataset.kbachInjected = "true";
  });
}

// Run immediately
injectButtons();

// And observe mutations for dynamically loaded chats
const observer = new MutationObserver((mutations) => {
  let shouldInject = false;
  for (let m of mutations) {
      if (m.addedNodes.length > 0) {
          shouldInject = true;
          break;
      }
  }
  if (shouldInject) {
      // Debounce injection slightly
      clearTimeout(window._kbachInjectTimer);
      window._kbachInjectTimer = setTimeout(injectButtons, 500);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('[Kbach.io] Gemini provider running.');
