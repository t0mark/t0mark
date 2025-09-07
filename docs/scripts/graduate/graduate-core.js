/**
 * Graduate Core Module
 * 탭 관리, 네비게이션, URL 처리 담당
 */

// Export functions for other modules
window.GraduateCore = {
    activateTab,
    updateUrl,
    loadTabContent,
    reinitializeInteractivity
};

// Cache for loaded content
const contentCache = {};

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
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const sidebarNavItems = document.querySelectorAll('.sidebar-nav-item');
    
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
    
    // Load content dynamically if not already loaded
    if (targetContent) {
        loadTabContent(targetTab, targetContent);
    }
}

async function loadTabContent(tabName, targetElement) {
    // Skip if already loaded (no loading placeholder)
    const loadingPlaceholder = targetElement.querySelector('.loading-placeholder');
    if (!loadingPlaceholder) {
        return; // Content already loaded
    }
    
    // Check cache first
    if (contentCache[tabName]) {
        targetElement.innerHTML = contentCache[tabName];
        reinitializeInteractivity(tabName);
        return;
    }
    
    try {
        const response = await fetch(`partials/graduate/${tabName}.html`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        
        // Cache the content
        contentCache[tabName] = html;
        
        // Replace loading placeholder with actual content
        targetElement.innerHTML = html;
        
        // Reinitialize any interactive elements in the loaded content
        reinitializeInteractivity(tabName);
        
        console.log(`✅ ${tabName} 콘텐츠가 성공적으로 로드되었습니다.`);
        
    } catch (error) {
        console.error(`❌ ${tabName} 콘텐츠 로드 실패:`, error);
        
        // Show error message
        targetElement.innerHTML = `
            <div class="error-placeholder">
                <div class="error-icon">⚠️</div>
                <h3>콘텐츠를 불러올 수 없습니다</h3>
                <p>네트워크 연결을 확인하고 페이지를 새로고침해 주세요.</p>
                <button class="retry-btn" onclick="location.reload()">새로고침</button>
            </div>
        `;
    }
}

function reinitializeInteractivity(tabName) {
    // Reinitialize animations for newly loaded content
    const observer = window.GraduateUtils.getObserver();
    const newElements = document.querySelectorAll(`#${tabName} .field-card, #${tabName} .trend-card, #${tabName} .industry-card, #${tabName} .venue-card, #${tabName} .conference-item-compact, #${tabName} .journal-item, #${tabName} .campus-building`);
    
    newElements.forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
        observer.observe(el);
    });
    
    // Reinitialize specific tab functionality
    if (tabName === 'trends' && window.GraduateHardware) {
        window.GraduateHardware.reinitializeHardwareInteractivity();
    }
    
    if (tabName === 'learning' && window.campusMap) {
        window.campusMap.reinitializeCampusMap();
    }
    
    // Add hover effects to newly loaded cards
    window.GraduateUtils.addHoverEffects(tabName);
}

function initializeTabSystem() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const sidebarNavItems = document.querySelectorAll('.sidebar-nav-item');
    const mobileMenuBtn = document.querySelector('.tab-mobile-btn');
    const tabs = document.querySelector('.tabs');
    
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

    // Sidebar navigation
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
}

function initializeSidebarVisibility() {
    const tabNavigation = document.querySelector('.tab-navigation');
    const stickySidebar = document.getElementById('stickySidebar');
    
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
}

function initializeResourceTabs() {
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
}

function initializeAccessibility() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
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
}

function initializeResizeHandler() {
    const tabs = document.querySelector('.tabs');
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeTabSystem();
    initializeSidebarVisibility();
    initializeResourceTabs();
    initializeAccessibility();
    initializeResizeHandler();
    
    console.log('🔧 Graduate Core 모듈이 초기화되었습니다.');
});