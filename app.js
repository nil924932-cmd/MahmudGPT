// ==========================================
// MAIN APPLICATION CONTROLLER
// ==========================================

class App {
    constructor() {
        this.currentMode = 'assistant';
        this.currentTheme = this.loadTheme();

        this.modeButtons = document.querySelectorAll('.mode-btn');
        this.themeToggle = document.getElementById('theme-toggle');

        this.initialize();
    }

    initialize() {
        // Apply saved theme
        this.applyTheme(this.currentTheme);

        // Initialize mode selector
        this.initializeModeSelector();

        // Initialize theme toggle
        this.initializeThemeToggle();

        // Set initial accent color
        this.updateAccentColor(MODES[this.currentMode].color);

        // Initialize scroll reveal
        initScrollReveal();

        console.log('🚀 Multi-Mode Chatbot initialized!');
    }

    initializeModeSelector() {
        this.modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const mode = button.dataset.mode;
                const color = button.dataset.color;
                this.switchMode(mode, color);
            });

            // Add hover effect
            button.addEventListener('mouseenter', () => {
                if (!prefersReducedMotion()) {
                    applySpringAnimation(button, 1.02);
                }
            });
        });
    }

    switchMode(mode, color) {
        // Update current mode
        this.currentMode = mode;

        // Update active state
        this.modeButtons.forEach(btn => {
            btn.classList.remove('active');
        });

        const activeButton = document.querySelector(`[data-mode="${mode}"]`);
        if (activeButton) {
            activeButton.classList.add('active');

            // Spring animation on mode switch
            if (!prefersReducedMotion()) {
                applySpringAnimation(activeButton);
            }
        }

        // Update accent color
        this.updateAccentColor(color);

        // Update chat manager mode
        if (window.chatManager) {
            window.chatManager.setMode(mode);
        }

        // Close any open canvas
        if (window.canvasManager && window.canvasManager.activeCanvas) {
            window.canvasManager.hideCanvas();
        }

        console.log(`🎯 Switched to ${mode} mode`);
    }

    updateAccentColor(color) {
        document.documentElement.style.setProperty('--color-accent', color);

        // Calculate hover color (slightly lighter)
        const hoverColor = this.adjustColor(color, 20);
        document.documentElement.style.setProperty('--color-accent-hover', hoverColor);

        // Calculate glow color (with opacity)
        const glowColor = this.hexToRgba(color, 0.25);
        document.documentElement.style.setProperty('--color-accent-glow', glowColor);
    }

    adjustColor(color, amount) {
        // Simple color adjustment (lighter)
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.min(255, ((num >> 16) & 0xff) + amount);
        const g = Math.min(255, ((num >> 8) & 0xff) + amount);
        const b = Math.min(255, (num & 0xff) + amount);
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    hexToRgba(hex, alpha) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = (num >> 16) & 0xff;
        const g = (num >> 8) & 0xff;
        const b = num & 0xff;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    initializeThemeToggle() {
        this.themeToggle.addEventListener('click', () => {
            const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            this.applyTheme(newTheme);
            this.saveTheme(newTheme);

            // Animate button
            applySpringAnimation(this.themeToggle);
        });
    }

    applyTheme(theme) {
        this.currentTheme = theme;
        document.body.dataset.theme = theme;

        // Update icon visibility
        const darkIcon = document.getElementById('theme-icon-dark');
        const lightIcon = document.getElementById('theme-icon-light');

        if (theme === 'dark') {
            darkIcon.style.display = 'block';
            lightIcon.style.display = 'none';
        } else {
            darkIcon.style.display = 'none';
            lightIcon.style.display = 'block';
        }

        console.log(`🎨 Applied ${theme} theme`);
    }

    loadTheme() {
        try {
            const savedTheme = localStorage.getItem('theme');
            return savedTheme || 'dark';
        } catch (e) {
            return 'dark';
        }
    }

    saveTheme(theme) {
        try {
            localStorage.setItem('theme', theme);
        } catch (e) {
            console.error('Error saving theme:', e);
        }
    }
}

// ==========================================
// GLOBAL INITIALIZATION
// ==========================================

// Wait for DOM to be ready
function initializeApp() {
    // Initialize main app
    window.app = new App();

    // Make managers globally accessible
    window.canvasManager = canvasManager;
    window.chatManager = chatManager;

    console.log('✅ All systems ready!');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export app class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
// Helper for suggestion chips
window.setInput = (text) => {
    const input = document.getElementById('message-input');
    if (input) {
        input.value = text;
        input.focus();
        // Trigger input event to enable button
        input.dispatchEvent(new Event('input'));
    }
};

// Also Initialize Font Awesome for icons if not present (assuming CDN link in head)
// If not, we should probably add SVG icons directly or include the library.
// Since User asked for "like this" with icons, we'll assume we can use FontAwesome or SVGs.
// For now, let's inject a CDN link if missing, purely for the icons to show up if the user hasn't added it.
const faLink = document.createElement('link');
faLink.rel = 'stylesheet';
faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
document.head.appendChild(faLink);
