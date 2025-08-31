/**
 * AIR Labs Graduate Program JavaScript
 * 탭 기능과 인터랙션을 관리
 */

document.addEventListener('DOMContentLoaded', function() {
    // ===== TAB FUNCTIONALITY =====
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const tabs = document.querySelector('.tabs');
    
    // ===== STICKY SIDEBAR =====
    const stickySidebar = document.getElementById('stickySidebar');
    const sidebarNavItems = document.querySelectorAll('.sidebar-nav-item');

    // ===== URL PARAMETER HANDLING =====
    function getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
    
    function updateUrl(tab) {
        const url = new URL(window.location);
        url.searchParams.set('tab', tab);
        window.history.replaceState(null, '', url);
    }
    
    function activateTab(targetTab) {
        // Remove active class from all tabs and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        sidebarNavItems.forEach(item => item.classList.remove('active'));
        
        // Add active class to target tab and content
        const targetButton = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`);
        const targetContent = document.getElementById(targetTab);
        const matchingSidebarItem = document.querySelector(`.sidebar-nav-item[data-tab="${targetTab}"]`);
        
        if (targetButton) targetButton.classList.add('active');
        if (targetContent) targetContent.classList.add('active');
        if (matchingSidebarItem) matchingSidebarItem.classList.add('active');
    }

    // Initialize tab based on URL parameter
    const urlTab = getUrlParameter('tab');
    const validTabs = ['fields', 'trends', 'conferences', 'learning'];
    const initialTab = (urlTab && validTabs.includes(urlTab)) ? urlTab : 'fields';
    
    activateTab(initialTab);

    // Tab switching logic
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Activate tab
            activateTab(targetTab);
            
            // Update URL
            updateUrl(targetTab);
            
            // Close mobile menu if open
            if (window.innerWidth <= 768) {
                tabs.classList.remove('active');
            }
            
            // Scroll to top of page to show tab navigation
            window.scrollTo({ 
                top: 0,
                behavior: 'smooth'
            });

            // Track analytics if available
            if (typeof gtag !== 'undefined') {
                gtag('event', 'tab_switch', {
                    'tab_name': targetTab
                });
            }
        });
    });

    // Mobile menu toggle
    if (mobileMenuBtn && tabs) {
        mobileMenuBtn.addEventListener('click', function() {
            tabs.classList.toggle('active');
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.tab-navigation') && tabs.classList.contains('active')) {
                tabs.classList.remove('active');
            }
        });
    }

    // ===== SIDEBAR NAVIGATION =====
    sidebarNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');
            
            // Activate tab
            activateTab(targetTab);
            
            // Update URL
            updateUrl(targetTab);
            
            // Scroll to top of page to show tab navigation
            window.scrollTo({ 
                top: 0,
                behavior: 'smooth'
            });
        });
    });

    // ===== SIDEBAR VISIBILITY & TAB NAVIGATION TOGGLE =====
    const tabNavigation = document.querySelector('.tab-navigation');
    
    function updateNavigationVisibility() {
        const scrollPosition = window.scrollY;
        const pageHeaderHeight = document.querySelector('.page-header').offsetHeight;
        const tabNavigationHeight = document.querySelector('.tab-navigation').offsetHeight;
        const threshold = pageHeaderHeight + tabNavigationHeight;

        if (scrollPosition > threshold) {
            // Hide tab navigation and show sidebar on large screens
            tabNavigation.classList.add('hidden');
            if (window.innerWidth > 1200) {
                stickySidebar.classList.add('visible');
            }
        } else {
            // Show tab navigation and hide sidebar
            tabNavigation.classList.remove('hidden');
            stickySidebar.classList.remove('visible');
        }
    }

    window.addEventListener('scroll', updateNavigationVisibility);
    window.addEventListener('resize', updateNavigationVisibility);

    // ===== RESOURCE TABS =====
    const resourceTabBtns = document.querySelectorAll('.resource-tab-btn');
    const resourceContents = document.querySelectorAll('.resource-content');

    resourceTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetResource = btn.getAttribute('data-resource');
            
            // Remove active class
            resourceTabBtns.forEach(b => b.classList.remove('active'));
            resourceContents.forEach(c => c.classList.remove('active'));
            
            // Add active class
            btn.classList.add('active');
            const targetContent = document.getElementById(targetResource);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // ===== SCROLL PROGRESS BAR =====
    const progressBar = document.querySelector('.scroll-progress-bar');
    if (progressBar) {
        window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            progressBar.style.width = scrolled + '%';
        });
    }

    // ===== INTERSECTION OBSERVER FOR ANIMATIONS =====
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe cards for animation
    const animatedElements = document.querySelectorAll(`
        .field-card, .trend-card, .industry-card, .venue-card, 
        .platform-card, .sensor-card, .computing-card, 
        .subject-card, .practical-card, .book-category, .course-item
    `);
    
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.05}s, transform 0.6s ease ${index * 0.05}s`;
        observer.observe(el);
    });

    // ===== INTERACTIVE EFFECTS =====
    
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
    const hoverCards = document.querySelectorAll(`
        .field-card, .industry-card, .venue-card, 
        .platform-card, .sensor-card, .computing-card,
        .subject-card, .practical-card, .course-item
    `);
    
    hoverCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // ===== UTILITY FUNCTIONS =====
    
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

    // ===== LAZY LOADING FOR FUTURE IMAGES =====
    if ('IntersectionObserver' in window) {
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

    // ===== RESIZE HANDLER =====
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Close mobile menu on resize to larger screen
            if (window.innerWidth > 768 && tabs.classList.contains('active')) {
                tabs.classList.remove('active');
            }
        }, 250);
    });

    // ===== PERFORMANCE MONITORING =====
    if ('performance' in window) {
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

    // ===== ACCESSIBILITY IMPROVEMENTS =====
    
    // Add aria-labels to interactive elements
    tabButtons.forEach((btn, index) => {
        btn.setAttribute('aria-label', `탭 ${index + 1}: ${btn.textContent.trim()}`);
        btn.setAttribute('role', 'tab');
    });

    tabContents.forEach(content => {
        content.setAttribute('role', 'tabpanel');
    });

    // Announce tab changes to screen readers
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
    `;
    document.body.appendChild(announcer);

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.textContent.trim();
            announcer.textContent = `${tabName} 섹션으로 이동했습니다.`;
        });
    });

    // Log successful initialization
    console.log('🎓 AIR Labs 대학원 과정 가이드가 성공적으로 초기화되었습니다!');
});