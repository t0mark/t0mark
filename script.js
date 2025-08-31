document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Initialize first tab as active
    if (tabButtons.length > 0 && tabContents.length > 0) {
        tabButtons[0].classList.add('active');
        tabContents[0].classList.add('active');
    }

    // Tab switching logic
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // Scroll to top of content area
            document.querySelector('.main-content').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        });
    });

    // Smooth scrolling for internal links
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

    // Add hover effects to interactive elements
    const interactiveCards = document.querySelectorAll('.field-card, .trend-card, .industry-card, .venue-card, .platform-card, .sensor-card, .computing-card, .subject-card, .practical-card, .book-category, .course-item');
    
    interactiveCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Tech tag click effects
    const techTags = document.querySelectorAll('.tech-tag, .ai-venue, .lang, .course-tag');
    
    techTags.forEach(tag => {
        tag.addEventListener('click', function() {
            // Add ripple effect
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });

    // Progress indicator for scroll
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.innerHTML = '<div class="scroll-progress-bar"></div>';
    document.body.appendChild(progressBar);

    // Add CSS for progress bar
    const progressStyle = document.createElement('style');
    progressStyle.textContent = `
        .scroll-progress {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            z-index: 1000;
            backdrop-filter: blur(10px);
        }
        
        .scroll-progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            width: 0%;
            transition: width 0.3s ease;
        }
    `;
    document.head.appendChild(progressStyle);

    // Update progress bar on scroll
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        document.querySelector('.scroll-progress-bar').style.width = scrolled + '%';
    });

    // Intersection Observer for animations
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

    // Observe all cards for animation
    const animatedElements = document.querySelectorAll('.field-card, .trend-card, .industry-card, .venue-card, .platform-card, .sensor-card, .computing-card, .subject-card, .practical-card, .book-category, .course-item');
    
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(el);
    });

    // Search functionality (basic)
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '검색어를 입력하세요...';
    searchInput.className = 'search-input';
    
    // Add search to header
    const headerContainer = document.querySelector('.header .container');
    if (headerContainer) {
        headerContainer.appendChild(searchInput);
    }

    // Add CSS for search input
    const searchStyle = document.createElement('style');
    searchStyle.textContent = `
        .search-input {
            margin-top: 1rem;
            padding: 12px 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 25px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 1rem;
            width: 100%;
            max-width: 400px;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        }
        
        .search-input::placeholder {
            color: rgba(255, 255, 255, 0.7);
        }
        
        .search-input:focus {
            outline: none;
            border-color: rgba(255, 255, 255, 0.6);
            background: rgba(255, 255, 255, 0.2);
        }
        
        .search-highlight {
            background: yellow;
            padding: 2px 4px;
            border-radius: 3px;
        }
    `;
    document.head.appendChild(searchStyle);

    // Search functionality
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.toLowerCase().trim();
        
        searchTimeout = setTimeout(() => {
            // Remove previous highlights
            document.querySelectorAll('.search-highlight').forEach(el => {
                el.outerHTML = el.innerHTML;
            });
            
            if (query.length > 2) {
                // Search in all text content
                const allElements = document.querySelectorAll('.tab-content *');
                let foundInTabs = new Set();
                
                allElements.forEach(el => {
                    if (el.textContent && el.textContent.toLowerCase().includes(query)) {
                        // Find which tab this element belongs to
                        let parent = el;
                        while (parent && !parent.classList.contains('tab-content')) {
                            parent = parent.parentElement;
                        }
                        if (parent) {
                            foundInTabs.add(parent.id);
                        }
                        
                        // Highlight text
                        if (el.children.length === 0) {
                            const regex = new RegExp(`(${query})`, 'gi');
                            el.innerHTML = el.textContent.replace(regex, '<span class="search-highlight">$1</span>');
                        }
                    }
                });
                
                // Highlight tabs that contain results
                tabButtons.forEach(btn => {
                    const tabId = btn.getAttribute('data-tab');
                    if (foundInTabs.has(tabId)) {
                        btn.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
                        btn.style.color = 'white';
                        btn.style.borderColor = '#f39c12';
                    } else {
                        btn.style.background = '';
                        btn.style.color = '';
                        btn.style.borderColor = '';
                    }
                });
            } else {
                // Reset tab button styles
                tabButtons.forEach(btn => {
                    btn.style.background = '';
                    btn.style.color = '';
                    btn.style.borderColor = '';
                });
            }
        }, 300);
    });

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            // Allow normal tab navigation
            return;
        }
        
        if (e.key >= '1' && e.key <= '5') {
            const index = parseInt(e.key) - 1;
            if (tabButtons[index]) {
                tabButtons[index].click();
                e.preventDefault();
            }
        }
        
        if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
            searchInput.focus();
            e.preventDefault();
        }
        
        if (e.key === 'Escape') {
            searchInput.value = '';
            searchInput.blur();
            // Clear search highlights
            document.querySelectorAll('.search-highlight').forEach(el => {
                el.outerHTML = el.innerHTML;
            });
            // Reset tab button styles
            tabButtons.forEach(btn => {
                btn.style.background = '';
                btn.style.color = '';
                btn.style.borderColor = '';
            });
        }
    });

    // Add keyboard shortcuts info
    const shortcutsInfo = document.createElement('div');
    shortcutsInfo.className = 'shortcuts-info';
    shortcutsInfo.innerHTML = `
        <div class="shortcuts-content">
            <h4><i class="fas fa-keyboard"></i> 키보드 단축키</h4>
            <p><kbd>1-5</kbd> 탭 전환</p>
            <p><kbd>/</kbd> 검색</p>
            <p><kbd>Esc</kbd> 검색 취소</p>
        </div>
    `;
    document.body.appendChild(shortcutsInfo);

    // Add CSS for shortcuts info
    const shortcutsStyle = document.createElement('style');
    shortcutsStyle.textContent = `
        .shortcuts-info {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 1rem;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
            font-size: 0.8rem;
            z-index: 1000;
            border: 1px solid rgba(0, 0, 0, 0.1);
            opacity: 0.7;
            transition: opacity 0.3s ease;
        }
        
        .shortcuts-info:hover {
            opacity: 1;
        }
        
        .shortcuts-content h4 {
            color: #2c3e50;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
        }
        
        .shortcuts-content p {
            margin: 0.2rem 0;
            color: #555;
        }
        
        kbd {
            background: #f0f0f0;
            border: 1px solid #ccc;
            border-radius: 3px;
            padding: 2px 6px;
            font-family: monospace;
            font-size: 0.8rem;
        }
        
        @media (max-width: 768px) {
            .shortcuts-info {
                display: none;
            }
        }
    `;
    document.head.appendChild(shortcutsStyle);

    // Mobile menu toggle for small screens
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'mobile-menu-btn';
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    document.querySelector('.tab-navigation .container').appendChild(mobileMenuBtn);

    // Add CSS for mobile menu
    const mobileMenuStyle = document.createElement('style');
    mobileMenuStyle.textContent = `
        .mobile-menu-btn {
            display: none;
            background: #667eea;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 5px;
            font-size: 1.2rem;
            cursor: pointer;
            position: absolute;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
        }
        
        @media (max-width: 768px) {
            .mobile-menu-btn {
                display: block;
            }
            
            .tabs {
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                padding: 1rem;
                flex-direction: column;
            }
            
            .tabs.active {
                display: flex;
            }
        }
    `;
    document.head.appendChild(mobileMenuStyle);

    // Mobile menu toggle functionality
    mobileMenuBtn.addEventListener('click', function() {
        const tabs = document.querySelector('.tabs');
        tabs.classList.toggle('active');
    });

    // Close mobile menu when tab is selected
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                document.querySelector('.tabs').classList.remove('active');
            }
        });
    });

    // Performance optimization: Lazy load images
    const images = document.querySelectorAll('img');
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    console.log('로봇공학 학습 가이드가 성공적으로 로드되었습니다! 🤖');
    console.log('키보드 단축키: 1-5 (탭 전환), / (검색), Esc (검색 취소)');
});