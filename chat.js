// ==========================================
// CHAT FUNCTIONALITY
// ==========================================

class ChatManager {
    constructor() {
        this.messagesContainer = document.getElementById('chat-messages');
        this.messageInput = document.getElementById('message-input');
        this.chatForm = document.getElementById('chat-form');
        this.sendButton = document.getElementById('send-button');

        this.currentMode = 'assistant';
        this.chatHistory = this.loadChatHistory();

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Form submission
        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSendMessage();
        });

        // Input validation
        this.messageInput.addEventListener('input', () => {
            this.validateInput();
        });

        // Enter key handling
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
    }

    validateInput() {
        const hasContent = this.messageInput.value.trim().length > 0;
        this.sendButton.disabled = !hasContent;
    }

    handleSendMessage() {
        const message = this.messageInput.value.trim();

        if (!message) return;

        // Clear input
        this.messageInput.value = '';
        this.validateInput();

        // Remove welcome message if present
        const welcomeMessage = this.messagesContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            fadeOut(welcomeMessage, 200, () => welcomeMessage.remove());
        }

        // Add user message
        this.addMessage(message, 'user');

        // Show typing indicator
        this.showTypingIndicator();

        // Get bot response
        this.getBotResponse(message);
    }

    addMessage(text, sender = 'bot', animated = true) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}`;

        const avatar = this.createAvatar(sender);
        const content = this.createMessageContent(text);

        if (sender === 'user') {
            messageElement.appendChild(content);
            messageElement.appendChild(avatar);
        } else {
            messageElement.appendChild(avatar);
            messageElement.appendChild(content);
        }

        // Add to container
        this.messagesContainer.appendChild(messageElement);

        // Animate if needed
        if (animated && !prefersReducedMotion()) {
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateY(20px)';

            requestAnimationFrame(() => {
                messageElement.style.transition = 'opacity 400ms ease-out, transform 400ms ease-out';
                messageElement.style.opacity = '1';
                messageElement.style.transform = 'translateY(0)';
            });
        }

        // Scroll to bottom
        setTimeout(() => {
            smoothScrollToBottom(this.messagesContainer.parentElement);
        }, 100);

        // Render Math (Latex)
        if (window.renderMathInElement) {
            renderMathInElement(messageElement, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true }
                ],
                throwOnError: false
            });
        }

        // Save to history
        this.chatHistory.push({ text, sender, mode: this.currentMode, timestamp: Date.now() });
        this.saveChatHistory();
    }

    createAvatar(sender) {
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';

        if (sender === 'user') {
            avatar.textContent = '👤';
        } else {
            const mode = MODES[this.currentMode];
            avatar.textContent = mode ? mode.icon : '🤖';
        }

        return avatar;
    }

    createMessageContent(text) {
        const content = document.createElement('div');
        content.className = 'message-content';

        // Simple markdown-like formatting
        const formattedText = this.formatMessage(text);
        content.innerHTML = formattedText;

        return content;
    }

    formatMessage(text) {
        // Handle code blocks with syntax highlighting
        text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            let highlightedCode = code;
            if (lang && window.hljs) {
                try {
                    highlightedCode = window.hljs.highlight(code, { language: lang }).value;
                } catch (e) {
                    try {
                        highlightedCode = window.hljs.highlightAuto(code).value;
                    } catch (err) { }
                }
            } else if (window.hljs) {
                try {
                    highlightedCode = window.hljs.highlightAuto(code).value;
                } catch (e) { }
            }
            return `<pre><code class="hljs ${lang || ''}">${highlightedCode}</code></pre>`;
        });

        // Handle inline code
        text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

        // Handle bold
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Handle italic
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Handle newlines
        text = text.replace(/\n/g, '<br>');

        return text;
    }

    showTypingIndicator() {
        // Remove existing typing indicator if present
        this.hideTypingIndicator();

        const typingElement = document.createElement('div');
        typingElement.className = 'typing-message';
        typingElement.id = 'typing-indicator';

        const avatar = this.createAvatar('bot');
        const typingContent = document.createElement('div');
        typingContent.className = 'message-content';

        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;

        typingContent.appendChild(typingIndicator);
        typingElement.appendChild(avatar);
        typingElement.appendChild(typingContent);

        this.messagesContainer.appendChild(typingElement);
        smoothScrollToBottom(this.messagesContainer.parentElement);
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async getBotResponse(userMessage) {
        this.hideTypingIndicator();
        this.showTypingIndicator();

        const mode = MODES[this.currentMode];
        if (!mode) {
            this.hideTypingIndicator();
            return;
        }

        try {
            const response = await mode.getResponse(userMessage);

            this.hideTypingIndicator();

            // Add bot message
            this.addMessage(response.text, 'bot');

            // Show canvas if response includes canvas content
            if (response.canvas && window.canvasManager) {
                setTimeout(() => {
                    window.canvasManager.showCanvas(response.canvas.type, response.canvas.content);
                }, 500);
            }
        } catch (error) {
            console.error('Error getting response:', error);
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error regarding the API. Please check the console for details.', 'bot');
        }
    }

    setMode(mode) {
        this.currentMode = mode;
    }

    clearChat() {
        this.messagesContainer.innerHTML = `
      <div class="welcome-message animate-fade-in">
        <div class="welcome-icon breathe">👋</div>
        <h1 class="welcome-title">Welcome to Multi-Mode Chat</h1>
        <p class="welcome-subtitle">Choose a mode and start chatting!</p>
      </div>
    `;
        this.chatHistory = [];
        this.saveChatHistory();
    }

    loadChatHistory() {
        try {
            const history = sessionStorage.getItem('chatHistory');
            return history ? JSON.parse(history) : [];
        } catch (e) {
            console.error('Error loading chat history:', e);
            return [];
        }
    }

    saveChatHistory() {
        try {
            sessionStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
        } catch (e) {
            console.error('Error saving chat history:', e);
        }
    }
}

// Initialize chat manager when DOM is ready
let chatManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        chatManager = new ChatManager();
    });
} else {
    chatManager = new ChatManager();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatManager;
}
