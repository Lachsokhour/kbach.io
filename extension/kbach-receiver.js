// This script runs on kbach.io (and localhost equivalents)
console.log('[Kbach.io Previewer] Receiver active.');

// Check for pending HTML when page loads
chrome.storage.local.get(['kbachPendingHTML'], (result) => {
  if (result.kbachPendingHTML) {
    const htmlSnippet = result.kbachPendingHTML;
    
    console.log('[Kbach.io Previewer] Found pending HTML snippet. Sending to app...');
    
    // Send it to the open window context
    // setTimeout ensures the page event listeners are fully registered
    setTimeout(() => {
      window.postMessage({
        type: 'KBACH_LOAD_HTML',
        html: htmlSnippet
      }, '*');
      
      // Clear the storage so reloading doesn't insert it again
      chrome.storage.local.remove('kbachPendingHTML');
    }, 500);
  }
});
