/**
 * Graduate Utils Module
 * 공통 유틸리티, 애니메이션, 상호작용 효과 담당
 */

window.GraduateUtils = {
    initializeUtilities,
    getObserver,
    addHoverEffects,
    showTooltip,
    initializeScrollProgress,
    initializeImageLazyLoading,
    initializePerformanceMonitoring
};

// Global observer instance
let intersectionObserver;

function initializeUtilities() {
    initializeIntersectionObserver();
    initializeScrollProgress();
    initializeInteractiveEffects();
    initializeImageLazyLoading();
    initializePerformanceMonitoring();
    initializeSmoothScrolling();
    
    console.log('🛠️ Graduate Utils 모듈이 초기화되었습니다.');
}

function getObserver() {
    return intersectionObserver;
}

function initializeIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for unified animation timing (headings + cards)
    const animatedElements = document.querySelectorAll(`
        /* cards */
        .field-card, .trend-card, .industry-card, .venue-card,
        .platform-card, .sensor-card, .computing-card,
        .subject-card, .practical-card, .book-category, .course-item,
        /* section titles */
        .trend-section h3, .hardware-subsection h4, .venue-category h4,
        .publication-strategy h3, .publication-tips h4, .learning-section h3,
        .conference-section h3
    `);

    animatedElements.forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        // Use a consistent duration with no stagger to keep text/cards in sync
        el.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
        intersectionObserver.observe(el);
    });
}

function initializeInteractiveEffects() {
    // Tech tag click effects
    const interactiveTags = document.querySelectorAll('.tech-tag, .ai-venue, .lang, .course-tag');
    interactiveTags.forEach(tag => {
        tag.addEventListener('click', function() {
            // Add ripple effect
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);

            // Copy text to clipboard if supported
            if (navigator.clipboard) {
                const text = this.textContent.trim();
                navigator.clipboard.writeText(text).then(() => {
                    // Show tooltip
                    showTooltip(this, '복사됨!');
                });
            }
        });
    });

    // Hover effects for cards
    addHoverEffects();
}

function addHoverEffects(tabName) {
    let selector = `
        .field-card, .industry-card, .venue-card, 
        .platform-card, .sensor-card, .computing-card,
        .subject-card, .practical-card, .course-item
    `;
    
    if (tabName) {
        selector = `#${tabName} .field-card, #${tabName} .industry-card, #${tabName} .venue-card, 
                   #${tabName} .platform-card, #${tabName} .sensor-card, #${tabName} .computing-card,
                   #${tabName} .subject-card, #${tabName} .practical-card, #${tabName} .course-item`;
    }
    
    const hoverCards = document.querySelectorAll(selector);
    
    hoverCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

function showTooltip(element, text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
        position: absolute;
        top: -40px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--text);
        color: var(--bg);
        padding: 6px 12px;
        border-radius: var(--border-radius);
        font-size: var(--text-xs);
        white-space: nowrap;
        z-index: var(--z-tooltip);
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    element.style.position = 'relative';
    element.appendChild(tooltip);
    
    // Fade in
    setTimeout(() => tooltip.style.opacity = '1', 10);
    
    // Remove after delay
    setTimeout(() => {
        tooltip.style.opacity = '0';
        setTimeout(() => tooltip.remove(), 300);
    }, 2000);
}

function initializeScrollProgress() {
    const progressBar = document.querySelector('.scroll-progress-bar');
    if (!progressBar) return;
    
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    });
}

function initializeSmoothScrolling() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function initializeImageLazyLoading() {
    if (!('IntersectionObserver' in window)) return;
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            }
        });
    });

    // Observe images with data-src attribute
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

function initializePerformanceMonitoring() {
    if (!('performance' in window)) return;
    
    window.addEventListener('load', function() {
        const loadTime = performance.now();
        console.log(`🎓 AIR Labs 가이드 로드 완료: ${Math.round(loadTime)}ms`);
        
        // Track performance if analytics available
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_load_time', {
                'load_time': Math.round(loadTime)
            });
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeUtilities();
});