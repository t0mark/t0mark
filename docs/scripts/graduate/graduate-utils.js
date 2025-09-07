// 다른 모듈에서 사용할 유틸리티 함수들을 전역 객체로 제공
window.GraduateUtils = {
    initializeUtilities,
    getObserver,
    addHoverEffects,
    showTooltip,
    initializeScrollProgress,
    initializeImageLazyLoading,
    initializePerformanceMonitoring
};

// 애니메이션용 인터섹션 옵저버 전역 인스턴스
let intersectionObserver;

// 모든 유틸리티 기능을 초기화하는 메인 함수
function initializeUtilities() {
    initializeIntersectionObserver();
    initializeScrollProgress();
    initializeInteractiveEffects();
    initializeImageLazyLoading();
    initializePerformanceMonitoring();
    initializeSmoothScrolling();
    
    console.log('🛠️ Graduate Utils 모듈이 초기화되었습니다.');
}

// 다른 모듈에서 애니메이션 옵저버를 사용할 수 있도록 반환
function getObserver() {
    return intersectionObserver;
}

// 스크롤 애니메이션을 위한 인터섹션 옵저버 초기화
function initializeIntersectionObserver() {
    // 뷰포트 10% 진입 시 트리거, 하단 50px 마진 설정
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    // 요소가 화면에 나타날 때 페이드인 효과 적용
    intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // 애니메이션을 적용할 모든 카드와 제목 요소들 선택
    const animatedElements = document.querySelectorAll(`
        .field-card, .trend-card, .industry-card, .venue-card,
        .platform-card, .sensor-card, .computing-card,
        .subject-card, .practical-card, .book-category, .course-item,
        .trend-section h3, .hardware-subsection h4, .venue-category h4,
        .publication-strategy h3, .publication-tips h4, .learning-section h3,
        .conference-section h3
    `);

    // 각 요소에 초기 상태와 트랜지션 설정 후 옵저버 등록
    animatedElements.forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
        intersectionObserver.observe(el);
    });
}

// 인터랙티브 효과들을 초기화 (클릭, 호버 효과)
function initializeInteractiveEffects() {
    // 기술 태그 클릭 시 클립보드 복사 및 리플 효과
    const interactiveTags = document.querySelectorAll('.tech-tag, .ai-venue, .lang, .course-tag');
    interactiveTags.forEach(tag => {
        tag.addEventListener('click', function() {
            // 클릭 시 스케일 애니메이션 효과
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);

            // 클립보드 API 지원 시 텍스트 복사
            if (navigator.clipboard) {
                const text = this.textContent.trim();
                navigator.clipboard.writeText(text).then(() => {
                    showTooltip(this, '복사됨!');
                });
            }
        });
    });

    // 카드 요소들에 호버 효과 추가
    addHoverEffects();
}

// 카드 요소들에 마우스 호버 시 위로 떠오르는 효과 추가
function addHoverEffects(tabName) {
    // 전체 카드 선택자
    let selector = `
        .field-card, .industry-card, .venue-card, 
        .platform-card, .sensor-card, .computing-card,
        .subject-card, .practical-card, .course-item
    `;
    
    // 특정 탭의 카드만 선택하는 경우
    if (tabName) {
        selector = `#${tabName} .field-card, #${tabName} .industry-card, #${tabName} .venue-card, 
                   #${tabName} .platform-card, #${tabName} .sensor-card, #${tabName} .computing-card,
                   #${tabName} .subject-card, #${tabName} .practical-card, #${tabName} .course-item`;
    }
    
    const hoverCards = document.querySelectorAll(selector);
    
    // 각 카드에 호버 효과 이벤트 추가
    hoverCards.forEach(card => {
        // 마우스 진입 시 위로 8px 이동
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        // 마우스 벗어날 시 원래 위치로 복귀
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// 요소 위에 임시로 표시되는 툴팁을 생성하고 자동으로 제거
function showTooltip(element, text) {
    // 툴팁 요소 생성 및 스타일 적용
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
    
    // 부모 요소를 상대 위치로 설정하고 툴팁 추가
    element.style.position = 'relative';
    element.appendChild(tooltip);
    
    // 페이드인 효과
    setTimeout(() => tooltip.style.opacity = '1', 10);
    
    // 2초 후 페이드아웃 및 제거
    setTimeout(() => {
        tooltip.style.opacity = '0';
        setTimeout(() => tooltip.remove(), 300);
    }, 2000);
}

// 페이지 하단의 스크롤 진행률 바 초기화
function initializeScrollProgress() {
    const progressBar = document.querySelector('.scroll-progress-bar');
    if (!progressBar) return;
    
    // 스크롤 이벤트로 진행률 계산 및 바 너비 업데이트
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    });
}

// 앵커 링크 클릭 시 부드러운 스크롤 효과 초기화
function initializeSmoothScrolling() {
    // 해시(#)로 시작하는 모든 앵커 링크에 스무스 스크롤 적용
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

// 이미지 지연 로딩(Lazy Loading) 초기화
function initializeImageLazyLoading() {
    // 인터섹션 옵저버를 지원하지 않는 브라우저는 건너뛰기
    if (!('IntersectionObserver' in window)) return;
    
    // 이미지가 뷰포트에 진입할 때 실제 이미지 로드
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    // data-src 속성값을 src로 이동하여 이미지 로드
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            }
        });
    });

    // data-src 속성을 가진 모든 이미지에 옵저버 등록
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// 페이지 로딩 성능 모니터링 초기화
function initializePerformanceMonitoring() {
    // Performance API를 지원하지 않는 브라우저는 건너뛰기
    if (!('performance' in window)) return;
    
    // 페이지 로드 완료 시 로딩 시간 측정 및 로그 출력
    window.addEventListener('load', function() {
        const loadTime = performance.now();
        console.log(`🎓 AIR Labs 가이드 로드 완료: ${Math.round(loadTime)}ms`);
        
        // Google Analytics가 있는 경우 성능 데이터 전송
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_load_time', {
                'load_time': Math.round(loadTime)
            });
        }
    });
}

// DOM 로드 완료 시 모든 유틸리티 기능 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeUtilities();
});