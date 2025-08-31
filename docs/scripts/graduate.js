// Graduate Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Learning section inner tabs (path-tab)
    const pathTabs = document.querySelectorAll('.path-tab');
    const pathContents = document.querySelectorAll('.path-content');
    pathTabs.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-path');
            pathTabs.forEach(btn => btn.classList.remove('active'));
            pathContents.forEach(content => content.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });

    // Main navigation tabs
    const mainTabs = Array.from(document.querySelectorAll('.main-navigation .nav-tab'));
    const panes = Array.from(document.querySelectorAll('.tab-pane'));
    
    function activatePane(targetId) {
        panes.forEach(p => p.classList.toggle('active', p.id === targetId));
        mainTabs.forEach(btn => {
            const isActive = btn.dataset.target === targetId;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
    }
    
    if (mainTabs.length) {
        mainTabs.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.target;
                activatePane(target);
                history.replaceState(null, '', `#${target}`);
            });
        });
        
        // Initialize from hash if present
        const hash = (location.hash || '').replace('#','');
        const valid = panes.some(p => p.id === hash);
        activatePane(valid ? hash : mainTabs[0].dataset.target);
        
        window.addEventListener('hashchange', () => {
            const h = (location.hash || '').replace('#','');
            if (panes.some(p => p.id === h)) activatePane(h);
        });
    }

    // Scroll-in animations
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    document.querySelectorAll('section, .field-card, .trend-card, .industry-card, .hw-category, .theory-section, .practice-section, .book-category, .lecture-category').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});
