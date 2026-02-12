// ==========================================
// DYNAMIC CANVAS MANAGEMENT
// ==========================================

class CanvasManager {
    constructor() {
        this.activeCanvas = null;
        this.canvasContainer = document.getElementById('dynamic-canvas');
        this.codeCanvas = document.getElementById('code-canvas');
        this.writingCanvas = document.getElementById('writing-canvas');
        this.imageCanvas = document.getElementById('image-canvas');

        this.codeContent = document.getElementById('code-content');
        this.writingContent = document.getElementById('writing-content');
        this.imageContent = document.getElementById('image-content');

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Close buttons
        const closeButtons = document.querySelectorAll('.canvas-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => this.hideCanvas());
        });
    }

    showCanvas(type, content) {
        // Hide all canvases first
        this.hideAllCanvasPanels();

        // Show container
        this.canvasContainer.style.display = 'block';
        this.canvasContainer.classList.add('active');

        // Show appropriate canvas
        switch (type) {
            case 'code':
                this.showCodeCanvas(content);
                break;
            case 'writing':
                this.showWritingCanvas(content);
                break;
            case 'image':
                this.showImageCanvas(content);
                break;
        }

        this.activeCanvas = type;
    }

    hideCanvas() {
        this.hideAllCanvasPanels();
        this.canvasContainer.classList.remove('active');

        setTimeout(() => {
            this.canvasContainer.style.display = 'none';
        }, 350);

        this.activeCanvas = null;
    }

    hideAllCanvasPanels() {
        [this.codeCanvas, this.writingCanvas, this.imageCanvas].forEach(canvas => {
            canvas.classList.remove('active');
            setTimeout(() => {
                canvas.style.display = 'none';
            }, 350);
        });
    }

    showCodeCanvas(content) {
        this.codeCanvas.style.display = 'flex';

        // Update title
        const title = this.codeCanvas.querySelector('.canvas-title');
        if (content.language === 'math') {
            title.textContent = 'Math Solution';
        } else {
            title.textContent = 'Code Preview';
        }

        // Render code content
        this.codeContent.innerHTML = this.renderCodeContent(content);

        // Trigger animation
        requestAnimationFrame(() => {
            this.codeCanvas.classList.add('active');
        });
    }

    renderCodeContent(content) {
        let { language, code, description } = content;

        let highlightedCode = code;
        if (window.hljs) {
            try {
                if (language && window.hljs.getLanguage(language)) {
                    highlightedCode = window.hljs.highlight(code, { language }).value;
                } else {
                    highlightedCode = window.hljs.highlightAuto(code).value;
                }
            } catch (e) {
                console.warn('HighlightJS error:', e);
            }
        }

        return `
      ${description ? `<div class="code-label">${description}</div>` : ''}
      <div class="code-block">
        <pre><code class="hljs ${language}">${highlightedCode}</code></pre>
      </div>
    `;
    }

    showWritingCanvas(content) {
        this.writingCanvas.style.display = 'flex';

        // Update title
        const title = this.writingCanvas.querySelector('.canvas-title');
        title.textContent = content.title || 'Document';

        // Render writing content
        this.writingContent.innerHTML = this.renderWritingContent(content);

        // Trigger animation
        requestAnimationFrame(() => {
            this.writingCanvas.classList.add('active');
        });

        // Animate sections
        const sections = this.writingContent.querySelectorAll('.content-section');
        sections.forEach((section, index) => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';

            setTimeout(() => {
                section.style.transition = 'opacity 400ms ease-out, transform 400ms ease-out';
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';

                // Render Math in this section
                if (window.renderMathInElement) {
                    renderMathInElement(section, {
                        delimiters: [
                            { left: '$$', right: '$$', display: true },
                            { left: '$', right: '$', display: false },
                            { left: '\\(', right: '\\)', display: false },
                            { left: '\\[', right: '\\]', display: true }
                        ],
                        throwOnError: false
                    });
                }
            }, index * 100);
        });
    }

    renderWritingContent(content) {
        const { sections } = content;

        return sections.map(section => {
            if (section.type === 'thinking') {
                return `<div class="content-section thinking-step animate-fade-in">${this.markdownToHtml(section.content)}</div>`;
            } else {
                return `<div class="content-section">${this.markdownToHtml(section.content)}</div>`;
            }
        }).join('');
    }

    showImageCanvas(content) {
        this.imageCanvas.style.display = 'flex';

        // Render images
        this.imageContent.innerHTML = this.renderImageContent(content);

        // Trigger animation
        requestAnimationFrame(() => {
            this.imageCanvas.classList.add('active');
        });

        // Animate image cards
        const cards = this.imageContent.querySelectorAll('.image-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';

            setTimeout(() => {
                card.style.transition = 'opacity 400ms ease-out, transform 400ms ease-out';
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
            }, index * 150);
        });
    }

    renderImageContent(content) {
        const { images, prompt } = content;

        return images.map(image => {
            return `
        <div class="image-card hover-scale">
          <div class="image-placeholder">${image.placeholder}</div>
        </div>
      `;
        }).join('');
    }

    // Helper: Convert markdown-like syntax to HTML
    markdownToHtml(text) {
        return text
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^- (.*$)/gim, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
            .replace(/\n/g, '<br>');
    }

    // Helper: Escape HTML
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Initialize canvas manager when DOM is ready
let canvasManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        canvasManager = new CanvasManager();
    });
} else {
    canvasManager = new CanvasManager();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasManager;
}
