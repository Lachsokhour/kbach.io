/**
 * AI Module - Handles Gemini API interaction
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_SYSTEM_PROMPT = `You are an Elite Instructional Designer & Senior UI/UX Engineer. Your objective is to architect premium, high-converting educational slide decks (1080x1080px) that look like high-end "Edutainment" thumbnails.

### 🛑 STRICT ZERO-SNIPPET PROTOCOL
- Deliver the **ENTIRE SOURCE CODE** for every single slide.
- Every block must be a standalone, production-ready \`<!DOCTYPE html>\` document.
- NO placeholders. NO partial CSS. The output must be visually perfect upon copy-paste.

### 💎 DESIGN PHILOSOPHY: "MODERN MINIMALIST GLASS"
- **Layered Depth**: Implement a high-end "Glassmorphism" aesthetic. Use \`backdrop-filter: blur(48px) saturate(220%)\`.
- **Premium Frost**: Cards must have a subtle gradient border (\`border: 1px solid rgba(255, 255, 255, 0.4)\`) and a semi-transparent background (\`rgba(255, 255, 255, 0.4)\`).
- **The Floating Anchor (Icon)**: Large, floating Lucide icon centered at the top (72px). Use theme accents and \`filter: drop-shadow(0 4px 12px var(--shadow-color))\`.
- **The Glow Spot**: Behind the icon, include a soft, low-opacity radial gradient "Glow Spot" (accent color).
- **Typography**: English text MUST be UPPERCASE (Nunito, 900 weight). Khmer text uses 'Kantumruy Pro'.
- **The Example Box**: Use a distinct secondary glass container with \`border-radius: 32px\` and \`padding: 40px\`.
- **Branding**: EVERY slide MUST include "@learnwith_momo" as a subtle watermark or footer.

### 📦 DECK STRUCTURAL SEQUENCE
1. **The Hero (Viral Hook)**: Problem/Solution headline.
2. **Content Module**: Consistent, bilingual templates.
3. **The Conversion (CTA)**: High-end closing card with social handles.

Always wrap the final code in triple backticks: \`\`\`html [code] \`\`\`. Explain design choices briefly before the code.`;

export class AIMediator {
  constructor() {
    this.apiKey = localStorage.getItem('kbach_gemini_api_key') || '';
    let savedModel = localStorage.getItem('kbach_ai_model');
    // Auto-migrate legacy models
    if (savedModel === 'gemini-1.5-flash' || savedModel === 'gemini-1.5-pro' || savedModel === 'gemini-3-flash') {
      savedModel = 'gemini-2.5-flash';
      localStorage.setItem('kbach_ai_model', savedModel);
    }
    this.modelName = savedModel || 'gemini-2.5-flash';
    this.genAI = null;
    this.chat = null;

    if (this.apiKey) {
      this.initSDK();
    }
  }

  initSDK() {
    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      const model = this.genAI.getGenerativeModel({ 
        model: this.modelName,
        systemInstruction: DEFAULT_SYSTEM_PROMPT
      });
      this.chat = model.startChat({
        history: [],
        generationConfig: {
          maxOutputTokens: 8192,
        },
      });
      return true;
    } catch (err) {
      console.error('Failed to init Gemini SDK:', err);
      return false;
    }
  }

  updateSettings(key, model) {
    this.apiKey = key;
    this.modelName = model;
    localStorage.setItem('kbach_gemini_api_key', key);
    localStorage.setItem('kbach_ai_model', model);
    return this.initSDK();
  }

  async sendMessage(prompt, onChunk, image = null) {
    if (!this.chat) {
      throw new Error('AI not initialized. Please check your API key in settings.');
    }

    try {
      let parts = [{ text: prompt }];
      if (image) {
        parts.push({
          inlineData: {
            data: image.data,
            mimeType: image.mimeType
          }
        });
      }

      const result = await this.chat.sendMessageStream(parts);
      let fullText = '';
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        if (onChunk) onChunk(fullText);
      }
      
      return fullText;
    } catch (err) {
      console.error('Gemini API Error:', err);
      // If it's a 404, the model might be wrong
      if (err.message.includes('404')) {
        throw new Error(`Model "${this.modelName}" not found. Try switching to Gemini 2.5 Flash in settings.`);
      }
      // If it's a 503, high demand
      if (err.message.includes('503')) {
        throw new Error('This model is currently overloaded. Please try again in 30 seconds or switch to "Gemini 2.5 Flash (Stable)" in settings.');
      }
      throw err;
    }
  }

  async listModels() {
    if (!this.apiKey) return [];
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${this.apiKey}`);
      const data = await response.json();
      console.log('Available Models:', data.models);
      return data.models || [];
    } catch (err) {
      console.error('Failed to list models:', err);
      return [];
    }
  }

  extractDecks(text) {
    if (!text) return [];
    const regex = /```html\n?([\s\S]*?)```/gi;
    const decks = [];
    let match;
    let index = 1;
    
    while ((match = regex.exec(text)) !== null) {
      // Try to find a title before the code block
      const prevText = text.substring(0, match.index).split('\n').pop() || '';
      const titleMatch = prevText.match(/Slide\s+(\d+(?:\/\d+)?)|#\s+(.*)/i);
      const title = titleMatch ? (titleMatch[2] || titleMatch[0]) : `Slide ${index}`;
      
      decks.push({
        title: title.trim(),
        html: match[1].trim()
      });
      index++;
    }
    return decks;
  }
  
  extractHTML(text) {
    const decks = this.extractDecks(text);
    return decks.length > 0 ? decks[0].html : null;
  }
}

export const aiMediator = new AIMediator();
