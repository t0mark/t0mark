// 다른 모듈에서 사용할 탭 관리 함수들을 전역 객체로 제공
window.GraduateCore = {
    activateTab,
    updateUrl,
    loadTabContent,
    reinitializeInteractivity
};

// 로드된 콘텐츠를 캐시하여 성능 향상
const contentCache = {};

// URL 쏼리 파라미터를 추출하여 반환
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// 현재 URL에 선택된 탭 정보를 반영 (브라우저 히스토리 업데이트)
function updateUrl(tab) {
    const url = new URL(window.location);
    url.searchParams.set('tab', tab);
    window.history.replaceState(null, '', url);
}

// 지정된 탭을 활성화하고 관련 콘텐츠 로드
function activateTab(targetTab) {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const sidebarNavItems = document.querySelectorAll('.sidebar-nav-item');
    
    // 모든 탭과 콘텐츠에서 활성화 클래스 제거
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    sidebarNavItems.forEach(item => item.classList.remove('active'));
    
    // 대상 탭과 콘텐츠에 활성화 클래스 추가
    const targetButton = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`);
    const targetContent = document.getElementById(targetTab);
    const matchingSidebarItem = document.querySelector(`.sidebar-nav-item[data-tab="${targetTab}"]`);
    
    if (targetButton) targetButton.classList.add('active');
    if (targetContent) targetContent.classList.add('active');
    if (matchingSidebarItem) matchingSidebarItem.classList.add('active');
    
    // 아직 로드되지 않은 콘텐츠를 동적으로 로드
    if (targetContent) {
        loadTabContent(targetTab, targetContent);
    }
}

// 지정된 탭의 콘텐츠를 비동기로 로드하고 캐시 처리
async function loadTabContent(tabName, targetElement) {
    // 이미 로드된 콘텐츠는 재로드 안함 (로딩 플레이스홀더 없음)
    const loadingPlaceholder = targetElement.querySelector('.loading-placeholder');
    if (!loadingPlaceholder) {
        return;
    }
    
    // 우선 캐시에서 확인
    if (contentCache[tabName]) {
        targetElement.innerHTML = contentCache[tabName];
        reinitializeInteractivity(tabName);
        return;
    }
    
    try {
        // 서버에서 탭 콘텐츠 HTML 파일 가져오기
        const response = await fetch(`partials/graduate/${tabName}.html`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        
        // 캐시에 콘텐츠 저장
        contentCache[tabName] = html;
        
        // 로딩 플레이스홀더를 실제 콘텐츠로 교체
        targetElement.innerHTML = html;
        
        // 로드된 콘텐츠내의 인터랙티브 요소들 재초기화
        reinitializeInteractivity(tabName);
        
        console.log(`✅ ${tabName} 콘텐츠가 성공적으로 로드되었습니다.`);
        
    } catch (error) {
        console.error(`❌ ${tabName} 콘텐츠 로드 실패:`, error);
        
        // 오류 메시지 표시
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

// 동적으로 로드된 콘텐츠의 인터랙티브 요소들 재초기화
function reinitializeInteractivity(tabName) {
    // 새로 로드된 콘텐츠의 애니메이션 재초기화
    const observer = window.GraduateUtils.getObserver();
    const newElements = document.querySelectorAll(`#${tabName} .field-card, #${tabName} .trend-card, #${tabName} .industry-card, #${tabName} .venue-card, #${tabName} .conference-item-compact, #${tabName} .journal-item, #${tabName} .campus-building`);
    
    // 각 요소에 초기 상태와 트랜지션 설정 후 옵저버 등록
    newElements.forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
        observer.observe(el);
    });
    
    // 특정 탭에 특화된 기능 재초기화
    if (tabName === 'trends' && window.GraduateHardware) {
        // 연구 동향 탭의 하드웨어 인터랙션 재초기화
        window.GraduateHardware.reinitializeHardwareInteractivity();
    }
    
    if (tabName === 'learning' && window.campusMap) {
        // 학습 가이드 탭의 캠퍼스 맵 재초기화
        window.campusMap.reinitializeCampusMap();
    }
    
    // 새로 로드된 카드들에 호버 효과 추가
    window.GraduateUtils.addHoverEffects(tabName);
}

// 탭 시스템 초기화 (클릭 이벤트, URL 처리, 모바일 메뉴)
function initializeTabSystem() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const sidebarNavItems = document.querySelectorAll('.sidebar-nav-item');
    const mobileMenuBtn = document.querySelector('.tab-mobile-btn');
    const tabs = document.querySelector('.tabs');
    
    // URL 파라미터를 기반으로 초기 탭 설정
    const urlTab = getUrlParameter('tab');
    const validTabs = ['fields', 'trends', 'conferences', 'learning'];
    const initialTab = (urlTab && validTabs.includes(urlTab)) ? urlTab : 'fields';
    
    activateTab(initialTab);

    // 탭 버튼 클릭 시 동작 처리
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // 탭 활성화
            activateTab(targetTab);
            
            // URL 업데이트
            updateUrl(targetTab);
            
            // 모바일 메뉴가 열려있으면 닫기
            if (window.innerWidth <= 768) {
                tabs.classList.remove('active');
            }
            
            // 탭 네비게이션이 보이도록 페이지 맨 위로 스크롤
            window.scrollTo({ 
                top: 0,
                behavior: 'smooth'
            });

            // Google Analytics 추적 (사용 가능한 경우)
            if (typeof gtag !== 'undefined') {
                gtag('event', 'tab_switch', {
                    'tab_name': targetTab
                });
            }
        });
    });

    // 모바일 메뉴 토글 버튼 처리
    if (mobileMenuBtn && tabs) {
        mobileMenuBtn.addEventListener('click', function() {
            tabs.classList.toggle('active');
        });

        // 모바일 메뉴 바깥 클릭 시 닫기
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.tab-navigation') && tabs.classList.contains('active')) {
                tabs.classList.remove('active');
            }
        });
    }

    // 사이드바 네비게이션 아이템 클릭 처리
    sidebarNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');
            
            // 탭 활성화
            activateTab(targetTab);
            
            // URL 업데이트
            updateUrl(targetTab);
            
            // 탭 네비게이션이 보이도록 페이지 맨 위로 스크롤
            window.scrollTo({ 
                top: 0,
                behavior: 'smooth'
            });
        });
    });
}

// 스크롤 위치에 따른 사이드바 및 탭 네비게이션 가시성 제어
function initializeSidebarVisibility() {
    const tabNavigation = document.querySelector('.tab-navigation');
    const stickySidebar = document.getElementById('stickySidebar');
    
    // 스크롤 위치에 따른 네비게이션 가시성 업데이트
    function updateNavigationVisibility() {
        const scrollPosition = window.scrollY;
        const pageHeaderHeight = document.querySelector('.page-header').offsetHeight;
        const tabNavigationHeight = document.querySelector('.tab-navigation').offsetHeight;
        const threshold = pageHeaderHeight + tabNavigationHeight;

        if (scrollPosition > threshold) {
            // 탭 네비게이션 숨김 및 대화면에서 사이드바 표시
            tabNavigation.classList.add('hidden');
            if (window.innerWidth > 1200) {
                stickySidebar.classList.add('visible');
            }
        } else {
            // 탭 네비게이션 표시 및 사이드바 숨김
            tabNavigation.classList.remove('hidden');
            stickySidebar.classList.remove('visible');
        }
    }

    // 스크롤 및 리사이즈 이벤트 리스너 추가
    window.addEventListener('scroll', updateNavigationVisibility);
    window.addEventListener('resize', updateNavigationVisibility);
}

// 리소스 탭 전환 기능 초기화 (콘텐츠 내부의 서브 탭들)
function initializeResourceTabs() {
    const resourceTabBtns = document.querySelectorAll('.resource-tab-btn');
    const resourceContents = document.querySelectorAll('.resource-content');

    // 리소스 탭 버튼 클릭 시 동작
    resourceTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetResource = btn.getAttribute('data-resource');
            
            // 모든 리소스 탭에서 활성화 클래스 제거
            resourceTabBtns.forEach(b => b.classList.remove('active'));
            resourceContents.forEach(c => c.classList.remove('active'));
            
            // 선택된 탭과 콘텐츠에 활성화 클래스 추가
            btn.classList.add('active');
            const targetContent = document.getElementById(targetResource);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// 스크린 리더 접근성 및 ARIA 라벨 초기화
function initializeAccessibility() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // 탭 버튼에 접근성 라벨 추가
    tabButtons.forEach((btn, index) => {
        btn.setAttribute('aria-label', `탭 ${index + 1}: ${btn.textContent.trim()}`);
        btn.setAttribute('role', 'tab');
    });

    // 탭 콘텐츠에 역할 속성 추가
    tabContents.forEach(content => {
        content.setAttribute('role', 'tabpanel');
    });

    // 스크린 리더에게 탭 변경을 알리는 요소 생성
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

    // 탭 변경 시 스크린 리더에게 알림
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.textContent.trim();
            announcer.textContent = `${tabName} 섹션으로 이동했습니다.`;
        });
    });
}

// 브라우저 리사이즈 이벤트 처리 (모바일 메뉴 자동 닫기)
function initializeResizeHandler() {
    const tabs = document.querySelector('.tabs');
    let resizeTimeout;
    
    // 리사이즈 이벤트에 디바운스 처리 적용
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // 화면이 커질 때 모바일 메뉴가 열려있으면 닫기
            if (window.innerWidth > 768 && tabs.classList.contains('active')) {
                tabs.classList.remove('active');
            }
        }, 250);
    });
}

// DOM 로드 완료 시 모든 탭 시스템 기능 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeTabSystem();
    initializeSidebarVisibility();
    initializeResourceTabs();
    initializeAccessibility();
    initializeResizeHandler();
    
    console.log('🔧 Graduate Core 모듈이 초기화되었습니다.');
});