/**
 * Smart Chat UI Module - Collaborative "Command Bar" Interaction
 */
import { aiMediator } from './ai.js';
import { state } from './state.js';
import { pasteHTML } from './editor.js';
import { showMsg } from './ui.js';

let currentImageData = null; // Stores {data: base64, mimeType: string}

export function setupChatUI() {
  const aiInput = document.getElementById('ai-input');
  if (aiInput) {
    aiInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAIMessage();
      }
    });

    // Better auto-resize logic
    aiInput.addEventListener('input', function() {
      this.style.height = 'px'; // Reset for measurement
      const newH = Math.min(this.scrollHeight, 200);
      this.style.height = (newH > 56 ? newH : 56) + 'px';
      
      // Toggle a shadow class if it stretches too much
      const bar = this.parentElement;
      if (newH > 100) bar.classList.add('rounded-2xl');
      else bar.classList.remove('rounded-2xl');
    });
  }

  // Initial Settings Load
  const savedKey = localStorage.getItem('kbach_gemini_api_key');
  const savedModel = localStorage.getItem('kbach_ai_model');
  if (savedKey) document.getElementById('gemini-api-key').value = savedKey;
  if (savedModel) document.getElementById('ai-model').value = savedModel;
}

export function toggleAIChat() {
  const panel = document.getElementById('ai-panel-inner');
  const isHidden = panel.classList.contains('hidden');
  
  if (isHidden) {
     panel.classList.remove('hidden');
     document.getElementById('ai-input').focus();
  } else {
     panel.classList.add('hidden');
  }
}

export async function sendAIMessage() {
  const input = document.getElementById('ai-input');
  const promptText = input.value.trim();
  if (!promptText && !currentImageData) return;

  if (!aiMediator.apiKey) {
    showAISettings();
    showMsg('Deployment requires an API Key');
    return;
  }

  // Ensure panel is open
  document.getElementById('ai-panel-inner').classList.remove('hidden');

  // Add User Message
  const imageData = currentImageData; // Capture
  addMessage('user', promptText, imageData);
  
  input.value = '';
  input.style.height = 'auto';
  clearImageUpload(); // Reset preview

  // Smart Context: If there's already code in the editor, let Gemini know we want to edit it
  const currentCode = state.jar ? state.jar.toString().trim() : '';
  let finalPrompt = promptText;
  
  if (currentCode && currentCode.length > 10) {
     finalPrompt = `Current HTML/CSS context:\n\`\`\`html\n${currentCode}\n\`\`\`\n\nTask: ${promptText}\n\nApply the requested changes to the context provided above.`;
  }

  // Show Scanning Effect
  triggerScanner(true);
  
  // Show Typing Indicator
  const indicator = document.getElementById('ai-typing-indicator');
  indicator.classList.remove('hidden');

  const aiMessageDiv = addMessage('ai', '');
  const contentDiv = aiMessageDiv.querySelector('.ai-content');

  try {
    const fullResponse = await aiMediator.sendMessage(finalPrompt, (currentText) => {
      contentDiv.innerHTML = formatAIResponse(currentText);
      scrollToBottom();
    }, imageData);

    // Extract and apply
    const decks = aiMediator.extractDecks(fullResponse);
    if (decks.length > 1) {
       addDeckSelection(aiMessageDiv, decks);
       // Auto-apply the first slide
       pasteHTML(decks[0].html); 
       showMsg('Slide Deck Generated');
    } else if (decks.length === 1) {
       addApplyButton(aiMessageDiv, decks[0].html);
       pasteHTML(decks[0].html); 
       showMsg('Slide Synchronized');
    }
  } catch (err) {
    contentDiv.innerHTML = `<p class="text-red-400 font-bold">Error: ${err.message}</p>`;
  } finally {
    triggerScanner(false);
    indicator.classList.add('hidden');
    scrollToBottom();
    if (window.lucide) window.lucide.createIcons();
  }
}

window.handleImageUpload = (input) => {
   const file = input.files[0];
   if (!file) return;

   const reader = new FileReader();
   reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1];
      currentImageData = {
         data: base64,
         mimeType: file.type
      };
      
      const previewWrap = document.getElementById('ai-image-preview-wrap');
      const previewImg = document.getElementById('ai-image-preview');
      if (previewImg) previewImg.src = e.target.result;
      if (previewWrap) previewWrap.classList.remove('hidden');
   };
   reader.readAsDataURL(file);
};

window.clearImageUpload = () => {
   currentImageData = null;
   const previewWrap = document.getElementById('ai-image-preview-wrap');
   const input = document.getElementById('ai-image-input');
   if (previewWrap) previewWrap.classList.add('hidden');
   if (input) input.value = '';
};

export function sendAISuggestion(text) {
  document.getElementById('ai-input').value = text;
  sendAIMessage();
}

function addMessage(role, text, image) {
  const messagesContainer = document.getElementById('ai-messages');
  const messageDiv = document.createElement('div');
  
  if (role === 'user') {
    messageDiv.className = 'self-end bg-accent/20 border border-accent/30 p-3 rounded-2xl max-w-[80%] text-sm chat-animate';
    let html = '';
    if (image) {
       html += `<img src="data:${image.mimeType};base64,${image.data}" class="w-full rounded-lg mb-2 shadow-sm border border-white/10">`;
    }
    html += `<p>${text || ''}</p>`;
    messageDiv.innerHTML = html;
  } else {
    messageDiv.className = 'ai-message self-start w-full';
    messageDiv.innerHTML = `<div class="ai-content text-sm space-y-4 text-gray-300"></div>`;
  }
  
  messagesContainer.appendChild(messageDiv);
  scrollToBottom();
  return messageDiv;
}

function formatAIResponse(text) {
  if (!text) return '';
  
  const segments = [];
  let lastIdx = 0;
  const regex = /```html\n?([\s\S]*?)```/gi;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // Process text before the code block
    segments.push(parseMarkdown(text.substring(lastIdx, match.index)));
    
    // Add the code block as a pre-formatted box (escaped internal code)
    const code = match[1].trim();
    const codeId = `ai-code-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    segments.push(`<div class="my-4 bg-black/40 rounded-xl overflow-hidden border border-white/5 group/code">
      <div class="px-4 py-2 bg-white/5 flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-gray-500">
        <span>Structural Logic</span>
        <button onclick="copyById('${codeId}', this)" class="hover:text-accent transition-colors flex items-center gap-1.5 active:scale-95">
          <i data-lucide="copy" class="w-3 h-3"></i> Copy
        </button>
      </div>
      <pre class="p-4 overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar"><code id="${codeId}" class="text-xs text-gray-400 font-mono leading-relaxed">${escapeHTML(code)}</code></pre>
    </div>`);
    
    lastIdx = regex.lastIndex;
  }
  
  // Process remaining text
  segments.push(parseMarkdown(text.substring(lastIdx)));
  
  return segments.join('');
}

function parseMarkdown(text) {
  if (!text) return '';
  
  if (window.marked) {
    const renderer = new marked.Renderer();
    
    // Marked v11+ Renderer with inline token support
    renderer.heading = function(token) {
      const text = this.parser.parseInline(token.tokens);
      const depth = token.depth;
      if (depth === 3) return `<h3 class="text-sm font-black uppercase tracking-widest text-accent mt-4 mb-2">${text}</h3>`;
      if (depth === 2) return `<h2 class="text-base font-black text-white mt-5 mb-3 border-b border-white/5 pb-1">${text}</h2>`;
      return `<h${depth} class="text-white font-bold mt-4 mb-2">${text}</h${depth}>`;
    };
    
    renderer.list = function(token) {
      const { items, ordered } = token;
      const tag = ordered ? 'ol' : 'ul';
      const cls = ordered ? 'list-decimal' : 'list-disc';
      const body = items.map(item => this.listitem(item)).join('');
      return `<${tag} class="${cls} ml-5 my-3 space-y-1 text-gray-400">${body}</${tag}>`;
    };

    renderer.listitem = function(token) {
      const text = this.parser.parseInline(token.tokens);
      return `<li class="text-[13px] leading-relaxed">${text}</li>`;
    };

    renderer.paragraph = function(token) {
      const text = this.parser.parseInline(token.tokens);
      return `<p class="mb-3 leading-relaxed text-[13px] text-gray-300">${text}</p>`;
    };

    renderer.strong = (token) => `<strong class="text-white font-bold">${token.text}</strong>`;
    renderer.hr = () => `<hr class="my-6 border-white/5">`;
    renderer.codespan = (token) => `<code class="bg-white/10 px-1.5 py-0.5 rounded text-accent font-mono text-[11px]">${token.text}</code>`;

    return marked.parse(text, { renderer });
  }

  return text.split('\n\n').map(p => `<p class="mb-2">${escapeHTML(p)}</p>`).join('');
}

function addApplyButton(messageDiv, code) {
  const container = messageDiv.querySelector('.ai-content');
  if (!container) return;

  const btnWrap = document.createElement('div');
  btnWrap.className = 'mt-4 flex gap-2';
  
  const btn = document.createElement('button');
  btn.className = 'bg-accent text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg';
  btn.innerHTML = '<i data-lucide="play" class="w-3 h-3"></i> Sync Canvas';
  btn.onclick = () => {
    pasteHTML(code);
    showMsg('Workspace Synchronized');
  };
  
  btnWrap.appendChild(btn);
  container.appendChild(btnWrap);
  if (window.lucide) window.lucide.createIcons();
}

function addDeckSelection(messageDiv, decks) {
  const container = messageDiv.querySelector('.ai-content');
  if (!container) return;

  const deckWrap = document.createElement('div');
  deckWrap.className = 'mt-6 grid grid-cols-2 gap-3';
  
  decks.forEach((deck, idx) => {
     const card = document.createElement('button');
     card.className = 'flex flex-col gap-2 p-3 bg-white/5 border border-white/5 rounded-xl text-left hover:border-accent/40 transition-all group';
     card.innerHTML = `
        <div class="text-[9px] font-black uppercase tracking-widest text-studioMuted group-hover:text-accent transition-colors">${deck.title}</div>
        <div class="h-12 w-full bg-black/40 rounded-lg border border-white/5 overflow-hidden p-1 opacity-60">
           <div class="w-full h-full bg-white/5 rounded-sm"></div>
        </div>
     `;
     card.onclick = () => {
        pasteHTML(deck.html);
        showMsg(`Loaded ${deck.title}`);
     };
     deckWrap.appendChild(card);
  });
  
  container.appendChild(deckWrap);
  if (window.lucide) window.lucide.createIcons();
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

function scrollToBottom() {
  const container = document.getElementById('ai-messages');
  container.scrollTop = container.scrollHeight;
}

export function showAISettings() {
  document.getElementById('ai-settings-modal').classList.remove('hidden');
}

export function hideAISettings() {
  document.getElementById('ai-settings-modal').classList.add('hidden');
}

export function saveAISettings() {
  const key = document.getElementById('gemini-api-key').value.trim();
  const model = document.getElementById('ai-model').value;
  
  if (aiMediator.updateSettings(key, model)) {
    showMsg('Context Saved');
    hideAISettings();
  } else {
    showMsg('Key Synchronization Failed');
  }
}

// Window Exports
window.toggleAIChat = toggleAIChat;
window.sendAIMessage = sendAIMessage;
window.sendAISuggestion = sendAISuggestion;
window.showAISettings = showAISettings;
window.hideAISettings = hideAISettings;
window.saveAISettings = saveAISettings;
window.debugModels = async () => {
  const models = await aiMediator.listModels();
  console.table(models.map(m => ({ name: m.name, display: m.displayName })));
};

window.quickPrompt = (text) => {
   const input = document.getElementById('ai-input');
   if (input) {
      input.value = text;
      // Trigger auto-resize
      input.dispatchEvent(new Event('input'));
      sendAIMessage();
   }
};

window.copyById = (id, btn) => {
   const el = document.getElementById(id);
   if (el) {
      const code = el.textContent;
      navigator.clipboard.writeText(code).then(() => {
         const original = btn.innerHTML;
         btn.innerHTML = '<i data-lucide="check" class="w-3 h-3"></i> Copied';
         btn.classList.add('text-accent');
         if (window.lucide) window.lucide.createIcons();
         setTimeout(() => {
            btn.innerHTML = original;
            btn.classList.remove('text-accent');
            if (window.lucide) window.lucide.createIcons();
         }, 2000);
      });
   }
};

function triggerScanner(show) {
   const scanner = document.getElementById('ai-scanner');
   if (scanner) {
      if (show) scanner.classList.remove('hidden');
      else scanner.classList.add('hidden');
   }
}
