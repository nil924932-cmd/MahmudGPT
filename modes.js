// ==========================================
// MODE DEFINITIONS & CONFIGURATIONS
// ==========================================

// Initialize API Service
const apiService = new ApiService();

const MODES = {
  assistant: {
    name: 'Assistant',
    icon: '💬',
    color: '#6366f1',
    canvasType: 'chat',
    description: 'General purpose AI assistant',
    getResponse: async (message) => {
      const response = await apiService.generateText(message, 'You are a helpful, witty, and knowledgeable AI assistant. Keep responses concise and engaging.');
      return {
        text: response,
        type: 'chat'
      };
    }
  },

  codex: {
    name: 'Codex',
    icon: '💻',
    color: '#10b981',
    canvasType: 'code',
    description: 'Code generation and debugging',
    getResponse: async (message) => {
      const prompt = `Generate code for the following request: "${message}". 
      Return ONLY the code logic wrapped in markdown code blocks. 
      Also provide a brief explanation. 
      Format: JSON with fields "code", "language", "explanation".`;

      const rawResponse = await apiService.generateText(prompt, 'You are an expert coding assistant. Respond with JSON only.');

      // Parse JSON from response
      let parsed = { code: '// Error parsing code', language: 'javascript', explanation: rawResponse };
      try {
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Failed to parse Codex JSON', e);
      }

      return {
        text: parsed.explanation || 'Here is the code you requested.',
        type: 'chat',
        canvas: {
          type: 'code',
          content: {
            language: parsed.language || 'javascript',
            code: parsed.code || rawResponse,
            description: 'Generated Code'
          }
        }
      };
    }
  },

  thinking: {
    name: 'Thinking',
    icon: '🧠',
    color: '#8b5cf6',
    canvasType: 'writing',
    description: 'Deep reasoning with visible thought process',
    getResponse: async (message) => {
      const systemPrompt = `Analyze the user's request using a "Thinking Process". 
      Break it down into: 1. Initial Analysis 2. Step-by-step reasoning 3. Alternative viewpoints 4. Final Conclusion.
      Format the output as a structured markdown document for a "Thought Process" canvas.`;

      const response = await apiService.generateText(message, systemPrompt);

      return {
        text: 'I have analyzed your request. See my reasoning process in the canvas.',
        type: 'chat',
        canvas: {
          type: 'writing',
          content: {
            title: 'Thought Process',
            sections: [{ type: 'thinking', content: response }]
          }
        }
      };
    }
  },

  research: {
    name: 'Research',
    icon: '🔍',
    color: '#0ea5e9',
    canvasType: 'writing',
    description: 'Information gathering and synthesis',
    getResponse: async (message) => {
      const response = await apiService.generateText(message, 'You are a research assistant. Provide a structured research summary with headings.');

      return {
        text: 'I\'ve compiled the research findings. View the full report in the canvas.',
        type: 'chat',
        canvas: {
          type: 'writing',
          content: { title: `Research: ${message}`, sections: [{ type: 'paragraph', content: response }] }
        }
      };
    }
  },

  'deep-research': {
    name: 'Deep Research',
    icon: '🔬',
    color: '#3b82f6',
    canvasType: 'writing',
    description: 'Comprehensive academic-level research',
    getResponse: async (message) => {
      const response = await apiService.generateText(message, 'You are a PhD-level researcher. Conduct a "Deep Research" analysis.');

      return {
        text: 'Deep research analysis complete. Please review the comprehensive document in the canvas.',
        type: 'chat',
        canvas: {
          type: 'writing',
          content: { title: `Deep Analysis: ${message}`, sections: [{ type: 'paragraph', content: response }] }
        }
      };
    }
  },

  math: {
    name: 'Math',
    icon: '📐',
    color: '#f59e0b',
    canvasType: 'code',
    description: 'Mathematical problem solving',
    getResponse: async (message) => {
      const response = await apiService.generateText(message, 'You are a math tutor. Solve the problem step-by-step.');

      return {
        text: 'I have solved the problem. Check the solution in the canvas.',
        type: 'chat',
        canvas: {
          type: 'code',
          content: { language: 'math', code: response, description: 'Step-by-Step Solution' }
        }
      };
    }
  },

  analyst: {
    name: 'Analyst',
    icon: '📊',
    color: '#06b6d4',
    canvasType: 'writing',
    description: 'Data analysis and insights',
    getResponse: async (message) => {
      const response = await apiService.generateText(message, 'You are a data analyst. Provide data analysis with summary and metrics.');
      return {
        text: 'Analysis generated. View the insights in the canvas.',
        type: 'chat',
        canvas: {
          type: 'writing',
          content: { title: `Data Analysis: ${message}`, sections: [{ type: 'paragraph', content: response }] }
        }
      };
    }
  },

  creative: {
    name: 'Creative',
    icon: '✨',
    color: '#ec4899',
    canvasType: 'writing',
    description: 'Creative ideation and storytelling',
    getResponse: async (message) => {
      const response = await apiService.generateText(message, 'You are a creative writer. Write a creative piece.');
      return {
        text: 'I\'ve crafted something for you. Read it in the canvas.',
        type: 'chat',
        canvas: {
          type: 'writing',
          content: { title: 'Creative Piece', sections: [{ type: 'paragraph', content: response }] }
        }
      };
    }
  },

  writer: {
    name: 'Writer',
    icon: '✍️',
    color: '#f97316',
    canvasType: 'writing',
    description: 'Long-form writing assistance',
    getResponse: async (message) => {
      const response = await apiService.generateText(message, 'You are a professional editor. Write a long-form article.');
      return {
        text: 'Article draft created. You can read the full text in the writing canvas.',
        type: 'chat',
        canvas: {
          type: 'writing',
          content: { title: `Draft: ${message}`, sections: [{ type: 'paragraph', content: response }] }
        }
      };
    }
  },

  image: {
    name: 'Image',
    icon: '🎨',
    color: '#a855f7',
    canvasType: 'image',
    description: 'AI image generation',
    getResponse: async (message) => {
      // Images array contains width/height info now
      const images = await apiService.generateImage(message);

      // Calculate aspect ratio style
      const img = images[0];
      const ratio = img.width / img.height;
      const isPortrait = ratio < 1;
      const aspectStyle = isPortrait ? 'max-width: 300px;' : 'width: 100%;';

      // Create HTML for chat - Optimized for variable aspect ratio
      const imageHtml = `
        <div class="chat-image-container" style="margin-top: 10px; ${aspectStyle} border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.2);">
          <div style="position: relative; width: 100%; aspect-ratio: ${img.width}/${img.height};">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #f3f4f6; display: flex; align-items: center; justify-content: center;">
               <div class="typing-dot" style="animation: pulse 1s infinite"></div>
            </div>
            <img src="${img.url}" alt="${message}" loading="lazy" style="position: relative; z-index: 1; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.5s ease;" onload="this.style.opacity='1'" onclick="window.open('${img.url}', '_blank')">
          </div>
        </div>
        <p style="margin-top: 8px; font-size: 0.85em; opacity: 0.7;">Generated with Runware (${img.width}x${img.height})</p>
      `;

      return {
        text: imageHtml,
        type: 'chat'
        // Canvas trigger removed
      };
    }
  },

  guided: {
    name: 'Guided Learning',
    icon: '🎓',
    color: '#14b8a6',
    canvasType: 'writing',
    description: 'Step-by-step educational guidance',
    getResponse: async (message) => {
      const response = await apiService.generateText(message, 'You are a teacher. Create a Learning Guide.');
      return {
        text: 'Learning guide prepared. Follow the steps in the canvas.',
        type: 'chat',
        canvas: {
          type: 'writing',
          content: { title: `Guide: ${message}`, sections: [{ type: 'paragraph', content: response }] }
        }
      };
    }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MODES;
}
