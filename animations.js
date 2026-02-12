// ==========================================
// ANIMATION UTILITIES
// ==========================================

/**
 * Smooth scroll to bottom of element
 */
function smoothScrollToBottom(element) {
    if (!element) return;

    element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth'
    });
}

/**
 * Sequential animation with delay
 */
function sequentialAnimate(elements, animationClass, delayMs = 100) {
    elements.forEach((element, index) => {
        setTimeout(() => {
            element.classList.add(animationClass);
        }, index * delayMs);
    });
}

/**
 * Intersection Observer for scroll reveal animations
 */
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.scroll-reveal');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(element => observer.observe(element));
    } else {
        // Fallback for older browsers
        revealElements.forEach(element => {
            element.classList.add('revealed');
        });
    }
}

/**
 * Spring animation helper
 */
function applySpringAnimation(element, scale = 1.05) {
    if (!element) return;

    element.style.transform = `scale(${scale})`;

    setTimeout(() => {
        element.style.transform = 'scale(1)';
    }, 150);
}

/**
 * Stagger animation for list items
 */
function staggerAnimation(container, itemSelector) {
    const items = container.querySelectorAll(itemSelector);

    items.forEach((item, index) => {
        item.style.animationDelay = `${index * 100}ms`;
        item.classList.add('stagger-item');
    });
}

/**
 * Check if user prefers reduced motion
 */
function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Safe animation wrapper that respects user preferences
 */
function safeAnimate(callback) {
    if (prefersReducedMotion()) {
        // Skip animation, run immediately
        callback();
    } else {
        // Run with animation
        requestAnimationFrame(callback);
    }
}

/**
 * Fade in element
 */
function fadeIn(element, duration = 300) {
    if (!element) return;

    element.style.opacity = '0';
    element.style.display = 'block';

    safeAnimate(() => {
        element.style.transition = `opacity ${duration}ms ease-in-out`;
        element.style.opacity = '1';
    });
}

/**
 * Fade out element
 */
function fadeOut(element, duration = 300, callback) {
    if (!element) return;

    safeAnimate(() => {
        element.style.transition = `opacity ${duration}ms ease-in-out`;
        element.style.opacity = '0';

        setTimeout(() => {
            element.style.display = 'none';
            if (callback) callback();
        }, duration);
    });
}

/**
 * Slide in element
 */
function slideIn(element, direction = 'up', duration = 400) {
    if (!element) return;

    const directions = {
        up: 'translateY(20px)',
        down: 'translateY(-20px)',
        left: 'translateX(20px)',
        right: 'translateX(-20px)'
    };

    element.style.opacity = '0';
    element.style.transform = directions[direction];
    element.style.display = 'block';

    safeAnimate(() => {
        element.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;
        element.style.opacity = '1';
        element.style.transform = 'translate(0, 0)';
    });
}

/**
 * Create ripple effect on click
 */
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add('ripple');

    button.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
}

/**
 * Debounce function for performance
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function for performance
 */
function throttle(func, limit = 100) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        smoothScrollToBottom,
        sequentialAnimate,
        initScrollReveal,
        applySpringAnimation,
        staggerAnimation,
        prefersReducedMotion,
        safeAnimate,
        fadeIn,
        fadeOut,
        slideIn,
        createRipple,
        debounce,
        throttle
    };
}
