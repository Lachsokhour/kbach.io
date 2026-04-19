// Check for pending HTML when page loads
chrome.storage.local.get(['kbachPendingHTML'], (result) => {
  if (result.kbachPendingHTML) {
    const htmlSnippet = result.kbachPendingHTML;
    console.log('[Kbach.io Previewer] Found pending HTML snippet. Attempting to send...');

    let attempts = 0;
    const maxAttempts = 20; 
    let retryTimer = null;

    // Listen for acknowledgement from the app
    window.addEventListener('message', (evt) => {
      if (evt.data && evt.data.type === 'KBACH_LOADED') {
        console.log('[Kbach.io Previewer] App confirmed receipt. Clearing...');
        clearInterval(retryTimer);
        chrome.storage.local.remove('kbachPendingHTML');
      }
    });
    
    const trySend = () => {
      attempts++;
      window.postMessage({
        type: 'KBACH_LOAD_HTML',
        html: htmlSnippet
      }, '*');

      if (attempts >= maxAttempts) {
        clearInterval(retryTimer);
        chrome.storage.local.remove('kbachPendingHTML');
      }
    };

    retryTimer = setInterval(trySend, 500);
    trySend(); // Send immediately
  }
});
