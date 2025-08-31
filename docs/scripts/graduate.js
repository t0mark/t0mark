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

    // ===== HARDWARE INTERACTIVE ROBOT =====
    const robotParts = document.querySelectorAll('.robot-part');
    const hardwareCategoryContents = document.querySelectorAll('.hardware-category-content');
    const panelTitle = document.getElementById('panel-title');
    const panelBadge = document.getElementById('panel-badge');
    
    const categoryData = {
        'platforms': {
            title: '차세대 로봇 플랫폼',
            badge: '2024 HOT',
            badgeColor: 'linear-gradient(135deg, #ff6b6b, #ee5a24)'
        },
        'computing': {
            title: 'AI 컴퓨팅 하드웨어', 
            badge: 'EDGE AI',
            badgeColor: 'var(--accent-hardware)'
        },
        'sensors': {
            title: '차세대 센서 기술',
            badge: 'SENSING',
            badgeColor: 'var(--accent-industry)'
        },
        'actuators': {
            title: '스마트 액추에이터',
            badge: 'MOTION',
            badgeColor: 'var(--primary)'
        }
    };
    
    function switchHardwareCategory(category) {
        // Remove active class from all robot parts and contents
        robotParts.forEach(part => part.classList.remove('active'));
        hardwareCategoryContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to selected category
        const selectedPart = document.querySelector(`.robot-part[data-category="${category}"]`);
        const selectedContent = document.querySelector(`.hardware-category-content[data-category="${category}"]`);
        
        if (selectedPart) selectedPart.classList.add('active');
        if (selectedContent) selectedContent.classList.add('active');
        
        // Update panel header
        if (categoryData[category] && panelTitle && panelBadge) {
            panelTitle.textContent = categoryData[category].title;
            panelBadge.textContent = categoryData[category].badge;
            panelBadge.style.background = categoryData[category].badgeColor;
        }
    }
    
    // Add click event listeners to robot parts
    robotParts.forEach(part => {
        part.addEventListener('click', () => {
            const category = part.getAttribute('data-category');
            if (category) {
                switchHardwareCategory(category);
                
                // Track interaction if analytics available
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'hardware_part_click', {
                        'category': category
                    });
                }
            }
        });
        
        // Add hover effects
        part.addEventListener('mouseenter', () => {
            part.style.opacity = '0.8';
        });
        
        part.addEventListener('mouseleave', () => {
            if (!part.classList.contains('active')) {
                part.style.opacity = '1';
            }
        });
    });
    
    // Initialize with platforms category active
    if (robotParts.length > 0) {
        switchHardwareCategory('platforms');
    }

    // ===== HARDWARE MODAL FUNCTIONALITY =====
    const modal = document.getElementById('hardwareModal');
    const modalClose = document.querySelector('.modal-close');
    const allHardwareItems = document.querySelectorAll('.hardware-item');
    
    const hardwareData = {
        'Tesla Bot Gen-2': {
            name: 'Tesla Bot Gen-2',
            category: '차세대 로봇 플랫폼',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjFmNWY5Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTRweCI+VGVzbGEgQm90IEdlbi0yPC90ZXh0Pgo8L3N2Zz4=',
            description: 'Tesla의 차세대 휴머노이드 로봇 Optimus로, 일반 가정과 산업용 작업에 최적화되었습니다.',
            features: ['자율 보행', '객체 인식 및 조작', '자연어 처리', 'FSD 컴퓨터 탑재'],
            specs: {
                '신장': '173cm',
                '무게': '57kg',
                '손 자유도': '11-DOF per hand',
                '보행 속도': '8km/h'
            }
        },
        'Figure 01': {
            name: 'Figure 01',
            category: '차세대 로봇 플랫폼',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjFmNWY5Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTRweCI+RmlndXJlIDAxPC90ZXh0Pgo8L3N2Zz4=',
            description: 'OpenAI와 협력하여 개발된 범용 휴머노이드 로봇으로, 고도의 AI 추론 능력을 갖추고 있습니다.',
            features: ['GPT 기반 대화', '복잡한 작업 수행', '학습 기반 적응', '안전한 인간-로봇 상호작용'],
            specs: {
                '신장': '167cm',
                '무게': '60kg',
                '배터리 수명': '5시간',
                'AI 모델': 'GPT-4 기반'
            }
        },
        'NVIDIA Jetson Thor': {
            name: 'NVIDIA Jetson Thor',
            category: 'AI 컴퓨팅 하드웨어',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjFmNWY5Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTRweCI+TlZJRElBIEpldHNvbiBUaG9yPC90ZXh0Pgo8L3N2Zz4=',
            description: 'NVIDIA의 차세대 휴머노이드 로봇용 AI 컴퓨팅 플랫폼으로, 초고성능 AI 처리가 가능합니다.',
            features: ['2000 TOPS AI 성능', 'Transformer 모델 최적화', '실시간 멀티모달 처리', '저전력 설계'],
            specs: {
                'AI 성능': '2000 TOPS',
                'GPU': 'Blackwell 아키텍처',
                'CPU': 'Grace Superchip',
                '전력 소모': '60W'
            }
        },
        'Apple M4 Ultra': {
            name: 'Apple M4 Ultra',
            category: 'AI 컴퓨팅 하드웨어',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjFmNWY5Ci8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTRweCI+QXBwbGUgTTQgVWx0cmE8L3RleHQ+Cjwvc3ZnPg==',
            description: 'Apple의 최신 Neural Engine을 탑재한 고성능 AI 프로세서로, 온디바이스 AI에 최적화되었습니다.',
            features: ['38 TOPS Neural Engine', '통합 메모리 아키텍처', '전력 효율성', 'CoreML 가속'],
            specs: {
                'Neural Engine': '38 TOPS',
                '메모리': '192GB 통합 메모리',
                'CPU 코어': '24코어',
                'GPU 코어': '76코어'
            }
        },
        '4D Imaging Radar': {
            name: '4D Imaging Radar',
            category: '차세대 센서 기술',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjFmNWY5Ci8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTRweCI+NEQgSW1hZ2luZyBSYWRhcjwvdGV4dD4KPC9zdmc+',
            description: 'Arbe Robotics의 4D 이미징 레이더로, 거리, 각도, 속도, 고도를 동시에 측정할 수 있습니다.',
            features: ['초고해상도 이미징', '악천후 대응', '장거리 감지', 'SLAM 기능'],
            specs: {
                '해상도': '2K 포인트',
                '탐지 거리': '300m',
                '각도 정확도': '1도',
                '업데이트율': '20Hz'
            }
        },
        'Event Camera': {
            name: 'Event Camera',
            category: '차세대 센서 기술',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjFmNWY5Ci8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTRweCI+RXZlbnQgQ2FtZXJhPC90ZXh0Pgo8L3N2Zz4=',
            description: 'Prophesee의 DVS 이벤트 카메라로, 변화하는 픽셀만을 비동기적으로 감지합니다.',
            features: ['초고속 반응', '저전력 소모', '높은 동적 범위', '모션 블러 없음'],
            specs: {
                '해상도': '1280×720',
                '지연시간': '1μs',
                '동적 범위': '120dB',
                '전력': '10mW'
            }
        },
        'Series Elastic Actuator': {
            name: 'Series Elastic Actuator',
            category: '스마트 액추에이터',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjFmNWY5Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTJweCI+U2VyaWVzIEVsYXN0aWMgQWN0dWF0b3I8L3RleHQ+Cjwvc3ZnPg==',
            description: '직렬 탄성 구조를 통해 안전하고 정밀한 힘 제어가 가능한 차세대 액추에이터입니다.',
            features: ['충격 흡수', '정밀 힘 제어', '백드라이브 가능', '안전성 보장'],
            specs: {
                '토크': '150 N·m',
                '탄성 상수': '100 N·m/rad',
                '정밀도': '0.1 N·m',
                '무게': '2.5kg'
            }
        },
        'Soft Robotics Actuator': {
            name: 'Soft Robotics Actuator',
            category: '스마트 액추에이터',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjFmNWY5Ci8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTJweCI+U29mdCBSb2JvdGljcyBBY3R1YXRvcjwvdGV4dD4KPC9zdmc+',
            description: '공압 구동 방식의 소프트 액추에이터로, 유연하고 안전한 그리퍼 동작이 가능합니다.',
            features: ['연속 변형', '안전한 그립', '적응형 형상', '경량 설계'],
            specs: {
                '최대 압력': '6 bar',
                '그립력': '25 N',
                '변형률': '300%',
                '재료': '실리콘 고무'
            }
        },
        // Additional hardware items (non-featured)
        'Boston Dynamics Atlas': {
            name: 'Boston Dynamics Atlas',
            category: '차세대 로봇 플랫폼',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjFmNWY5Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTRweCI+Qm9zdG9uIER5bmFtaWNzIEF0bGFzPC90ZXh0Pgo8L3N2Zz4=',
            description: 'Boston Dynamics의 전기 구동 휴머노이드 로봇으로, 뛰어난 운동 능력을 자랑합니다.',
            features: ['전기 구동', '고정밀 제어', '자율 보행', '물체 조작'],
            specs: {
                '신장': '180cm',
                '무게': '89kg',
                '배터리 수명': '1시간',
                '최대 속도': '2.5m/s'
            }
        },
        'Agility Digit v6': {
            name: 'Agility Digit v6',
            category: '차세대 로봇 플랫폼',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjFmNWY5Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTRweCI+QWdpbGl0eSBEaWdpdCB2NjwvdGV4dD4KPC9zdmc+',
            description: 'Agility Robotics의 물류 자동화 전용 휴머노이드 로봇입니다.',
            features: ['물류 최적화', '자율 내비게이션', '박스 핸들링', '안전 센서'],
            specs: {
                '신장': '175cm',
                '무게': '65kg',
                '페이로드': '16kg',
                '작업 시간': '16시간'
            }
        },
        '1X NEO Beta': {
            name: '1X NEO Beta',
            category: '차세대 로봇 플랫폼',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjFmNWY5Ci8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTRweCI+MVggTkVPIEJldGE8L3RleHQ+Cjwvc3ZnPg==',
            description: '1X Technologies의 가정용 휴머노이드 로봇으로, 일상 업무를 보조합니다.',
            features: ['가사 업무', '음성 인식', '학습 능력', '안전한 상호작용'],
            specs: {
                '신장': '165cm',
                '무게': '30kg',
                '배터리': '4시간',
                'AI 모델': '자체 개발'
            }
        },
        'Qualcomm RB5': {
            name: 'Qualcomm RB5',
            category: 'AI 컴퓨팅 하드웨어',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjFmNWY5Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTRweCI+UXVhbGNvbW0gUkI1PC90ZXh0Pgo8L3N2Zz4=',
            description: 'Qualcomm의 로봇 전용 AI 컴퓨팅 플랫폼으로, 5G 연결성을 제공합니다.',
            features: ['5G 모뎀', '헥사곤 DSP', 'Adreno GPU', 'AI 가속기'],
            specs: {
                'AI 성능': '15 TOPS',
                '연결성': '5G/Wi-Fi 6',
                '카메라': '최대 64MP',
                '전력': '12W'
            }
        },
        'Intel Loihi 2': {
            name: 'Intel Loihi 2',
            category: 'AI 컴퓨팅 하드웨어',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjFmNWY5Ci8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTRweCI+SW50ZWwgTG9paGkgMjwvdGV4dD4KPC9zdmc+',
            description: 'Intel의 차세대 뉴로모픽 프로세서로, 뇌의 구조를 모방합니다.',
            features: ['스파이킹 뉴럴 네트워크', '초저전력', '실시간 학습', '이벤트 기반 처리'],
            specs: {
                '뉴런': '1M 뉴런',
                '시냅스': '120M 시냅스',
                '전력': '88mW',
                '공정': '14nm'
            }
        },
        'Google Coral TPU': {
            name: 'Google Coral TPU',
            category: 'AI 컴퓨팅 하드웨어',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjFmNWY5Ci8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTRweCI+R29vZ2xlIENvcmFsIFRQVTwvdGV4dD4KPC9zdmc+',
            description: 'Google의 엣지 AI 추론 전용 프로세서로, TensorFlow Lite에 최적화되었습니다.',
            features: ['TensorFlow Lite', '엣지 TPU', 'USB 연결', '저전력 설계'],
            specs: {
                'AI 성능': '4 TOPS',
                '인터페이스': 'USB 3.0',
                '전력': '0.5W',
                '크기': '30×25mm'
            }
        },
        'Solid-State LiDAR': {
            name: 'Solid-State LiDAR',
            category: '차세대 센서 기술',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjFmNWY5Ci8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTJweCI+U29saWQtU3RhdGUgTGlEQVI8L3RleHQ+Cjwvc3ZnPg==',
            description: 'Luminar의 고성능 솔리드 스테이트 LiDAR로, 장거리 물체 감지가 가능합니다.',
            features: ['1550nm 레이저', '250m 탐지거리', '고해상도', '내구성 강화'],
            specs: {
                '탐지거리': '250m',
                '시야각': '120° × 26°',
                '해상도': '300점/㎡',
                '업데이트율': '10Hz'
            }
        },
        'Tactile Sensor Array': {
            name: 'Tactile Sensor Array',
            category: '차세대 센서 기술',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjFmNWY5Ci8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTJweCI+VGFjdGlsZSBTZW5zb3IgQXJyYXk8L3RleHQ+Cjwvc3ZnPg==',
            description: 'SynTouch의 BioTac 센서로, 인간의 촉감을 모방한 로봇 센서입니다.',
            features: ['압력 감지', '진동 감지', '온도 감지', '질감 인식'],
            specs: {
                '센서 수': '19개',
                '샘플링 속도': '2.2kHz',
                '압력 범위': '0-40N',
                '온도 범위': '5-40°C'
            }
        },
        'Multi-modal Fusion': {
            name: 'Multi-modal Fusion',
            category: '차세대 센서 기술',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjFmNWY5Ci8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTJweCI+TXVsdGktbW9kYWwgRnVzaW9uPC90ZXh0Pgo8L3N2Zz4=',
            description: '카메라, 레이더, LiDAR을 융합한 다중 모달 센서 시스템입니다.',
            features: ['센서 융합', '실시간 처리', '고신뢰성', '환경 적응'],
            specs: {
                '센서 종류': '3종류',
                '데이터 융합': 'Kalman Filter',
                '처리 속도': '30Hz',
                '신뢰도': '99.9%'
            }
        },
        'Direct Drive Motor': {
            name: 'Direct Drive Motor',
            category: '스마트 액추에이터',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjFmNWY5Ci8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTJweCI+RGlyZWN0IERyaXZlIE1vdG9yPC90ZXh0Pgo8L3N2Zz4=',
            description: '기어박스 없이 직접 구동되는 고토크 밀도 모터입니다.',
            features: ['무기어박스', '고토크 밀도', '낮은 백래시', '정밀 제어'],
            specs: {
                '토크': '200 N·m',
                '토크 밀도': '15 N·m/kg',
                '백래시': '0 arcmin',
                '효율': '90%'
            }
        },
        'Shape Memory Alloy': {
            name: 'Shape Memory Alloy',
            category: '스마트 액추에이터',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjFmNWY5Ci8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTJweCI+U2hhcGUgTWVtb3J5IEFsbG95PC90ZXh0Pgo8L3N2Zz4=',
            description: '형상 기억 합금을 이용한 바이오 미메틱 액추에이터입니다.',
            features: ['형상 기억', '바이오 미메틱', '무소음', '자가 치유'],
            specs: {
                '변형률': '8%',
                '응답 시간': '1초',
                '구동 온도': '70°C',
                '수명': '10⁶ 사이클'
            }
        },
        'Magnetic Gear': {
            name: 'Magnetic Gear',
            category: '스마트 액추에이터',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjFmNWY5Ci8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTRweCI+TWFnbmV0aWMgR2VhcjwvdGV4dD4KPC9zdmc+',
            description: '자기력을 이용한 비접촉 전동 시스템으로, 마모가 없습니다.',
            features: ['비접촉 전동', '무마모', '고효율', '저소음'],
            specs: {
                '감속비': '1:10',
                '토크 전달': '95%',
                '소음': '< 30dB',
                '수명': '무제한'
            }
        }
    };
    
    // Modal open function
    function openModal(hardwareName) {
        const data = hardwareData[hardwareName];
        if (!data) return;
        
        // Populate modal content
        document.getElementById('modalImage').src = data.image;
        document.getElementById('modalImage').alt = data.name;
        document.getElementById('modalName').textContent = data.name;
        document.getElementById('modalSpec').textContent = data.category;
        document.getElementById('modalDescription').textContent = data.description;
        
        // Remove any existing specs section
        const existingSpecs = document.querySelector('.detail-specs');
        if (existingSpecs) {
            existingSpecs.remove();
        }
        
        // Populate features
        const featuresList = document.getElementById('modalFeatures');
        featuresList.innerHTML = '<h5>주요 특징</h5><ul></ul>';
        const featuresUl = featuresList.querySelector('ul');
        data.features.forEach(feature => {
            const li = document.createElement('li');
            li.textContent = feature;
            featuresUl.appendChild(li);
        });
        
        // Add specs section
        const specsHtml = `<div class="detail-specs">
            <h5>기술 사양</h5>
            <ul>
                ${Object.entries(data.specs).map(([key, value]) => 
                    `<li><strong>${key}:</strong> ${value}</li>`
                ).join('')}
            </ul>
        </div>`;
        
        featuresList.insertAdjacentHTML('afterend', specsHtml);
        
        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Modal close function
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Add event listeners to all hardware items
    allHardwareItems.forEach(item => {
        item.addEventListener('click', () => {
            const nameElement = item.querySelector('.item-name');
            if (nameElement) {
                const hardwareName = nameElement.textContent.trim();
                openModal(hardwareName);
            }
        });
        
        // Add visual feedback
        item.style.cursor = 'pointer';
    });
    
    // Modal close event listeners
    modalClose.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Log successful initialization
    console.log('🎓 AIR Labs 대학원 과정 가이드가 성공적으로 초기화되었습니다!');
});
