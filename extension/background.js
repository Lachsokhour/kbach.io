chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'open_kbach' && request.html) {
    // Save to local storage before opening the tab
    chrome.storage.local.set({ kbachPendingHTML: request.html }, () => {
      // Open Kbach.io in a new tab. Change this for local development if needed.
      const kbachUrl = 'https://kbach-io.vercel.app/';
      
      chrome.tabs.create({ url: kbachUrl }, (tab) => {
        // Tab opened successfully. The `kbach-receiver.js` content script 
        // will handle loading the HTML into the editor.
      });
      
      sendResponse({ status: 'success' });
    });
    
    return true; // Keep message channel open for async response
  }
});
