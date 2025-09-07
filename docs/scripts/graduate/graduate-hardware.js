// 다른 모듈에서 사용할 하드웨어 관련 함수들을 전역 객체로 제공
window.GraduateHardware = {
    initializeHardwareSystem,
    reinitializeHardwareInteractivity,
    switchHardwareCategory,
    openModal,
    closeModal
};

// 하드웨어 시스템의 모든 기능을 초기화하는 메인 함수
function initializeHardwareSystem() {
    initializeRobotInteraction();
    initializeHardwareModal();
    
    console.log('🔧 Graduate Hardware 모듈이 초기화되었습니다.');
}

// 로봇 파트 클릭 및 호버 인터랙션 초기화
function initializeRobotInteraction() {
    const robotParts = document.querySelectorAll('.robot-part');
    
    // 로봇 파트 요소가 없으면 함수 종료
    if (robotParts.length === 0) return;
    
    // 각 로봇 파트에 클릭 이벤트 리스너 추가
    robotParts.forEach(part => {
        part.addEventListener('click', () => {
            const category = part.getAttribute('data-category');
            if (category) {
                // 해당 카테고리로 하드웨어 패널 전환
                switchHardwareCategory(category);
                
                // Google Analytics 추적 (사용 가능한 경우)
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'hardware_part_click', {
                        'category': category
                    });
                }
            }
        });
        
        // 마우스 호버 시 투명도 변경 효과
        part.addEventListener('mouseenter', () => {
            part.style.opacity = '0.8';
        });
        
        // 마우스가 벗어날 때 원래 투명도로 복구 (활성 상태가 아닌 경우)
        part.addEventListener('mouseleave', () => {
            if (!part.classList.contains('active')) {
                part.style.opacity = '1';
            }
        });
    });
    
    // 초기 로드 시 플랫폼 카테고리를 활성화
    switchHardwareCategory('platforms');
}

// 하드웨어 카테고리 전환 (플랫폼, 컴퓨팅, 센서, 액추에이터)
function switchHardwareCategory(category) {
    const robotParts = document.querySelectorAll('.robot-part');
    const hardwareCategoryContents = document.querySelectorAll('.hardware-category-content');
    const panelTitle = document.getElementById('panel-title');
    const panelBadge = document.getElementById('panel-badge');
    
    // 모든 로봇 파트와 콘텐츠에서 활성화 클래스 제거
    robotParts.forEach(part => part.classList.remove('active'));
    hardwareCategoryContents.forEach(content => content.classList.remove('active'));
    
    // 선택된 카테고리의 파트와 콘텐츠에 활성화 클래스 추가
    const selectedPart = document.querySelector(`.robot-part[data-category="${category}"]`);
    const selectedContent = document.querySelector(`.hardware-category-content[data-category="${category}"]`);
    
    if (selectedPart) selectedPart.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');
    
    // 패널 헤더의 제목과 배지 업데이트
    const categoryData = window.GraduateData.categoryData[category];
    if (categoryData && panelTitle && panelBadge) {
        panelTitle.textContent = categoryData.title;
        panelBadge.textContent = categoryData.badge;
        panelBadge.style.background = categoryData.badgeColor;
    }
}

// 동적으로 로드된 콘텐츠의 하드웨어 인터랙션 재초기화
function reinitializeHardwareInteractivity() {
    const newRobotParts = document.querySelectorAll('.robot-part');
    
    // 새로 로드된 로봇 파트들에 이벤트 리스너 추가
    if (newRobotParts.length > 0) {
        newRobotParts.forEach(part => {
            // 클릭 시 카테고리 전환
            part.addEventListener('click', () => {
                const category = part.getAttribute('data-category');
                if (category) {
                    switchHardwareCategory(category);
                }
            });
            
            // 호버 효과 추가
            part.addEventListener('mouseenter', () => {
                part.style.opacity = '0.8';
            });
            
            part.addEventListener('mouseleave', () => {
                if (!part.classList.contains('active')) {
                    part.style.opacity = '1';
                }
            });
        });
        
        // 기본으로 플랫폼 카테고리 활성화
        switchHardwareCategory('platforms');
    }
    
    // 새로 로드된 하드웨어 아이템들에 모달 오픈 이벤트 추가
    const newHardwareItems = document.querySelectorAll('.hardware-item');
    newHardwareItems.forEach(item => {
        item.addEventListener('click', () => {
            const nameElement = item.querySelector('.item-name');
            if (nameElement) {
                const hardwareName = nameElement.textContent.trim();
                openModal(hardwareName);
            }
        });
        // 클릭 가능함을 나타내는 커서 변경
        item.style.cursor = 'pointer';
    });
}

// 하드웨어 상세 정보 모달의 이벤트 리스너 초기화
function initializeHardwareModal() {
    const modal = document.getElementById('hardwareModal');
    const modalClose = document.querySelector('.modal-close');
    const allHardwareItems = document.querySelectorAll('.hardware-item');
    
    // 모달 요소가 없으면 함수 종료
    if (!modal) return;
    
    // 모든 하드웨어 아이템에 클릭 이벤트 추가
    allHardwareItems.forEach(item => {
        item.addEventListener('click', () => {
            const nameElement = item.querySelector('.item-name');
            if (nameElement) {
                const hardwareName = nameElement.textContent.trim();
                openModal(hardwareName);
            }
        });
        
        // 클릭 가능함을 나타내는 포인터 커서 설정
        item.style.cursor = 'pointer';
    });
    
    // 모달 닫기 버튼 이벤트 리스너
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    // 모달 배경 클릭 시 모달 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // ESC 키 누를 시 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

// 하드웨어 상세 정보 모달을 열고 데이터 채우기
function openModal(hardwareName) {
    const modal = document.getElementById('hardwareModal');
    const data = window.GraduateData.hardwareData[hardwareName];
    
    // 데이터나 모달이 없으면 함수 종료
    if (!data || !modal) return;
    
    // 모달 기본 정보 채우기
    document.getElementById('modalImage').src = data.image;
    document.getElementById('modalImage').alt = data.name;
    document.getElementById('modalName').textContent = data.name;
    document.getElementById('modalSpec').textContent = data.category;
    document.getElementById('modalDescription').textContent = data.description;
    
    // 기존 사양 섹션이 있으면 제거
    const existingSpecs = document.querySelector('.detail-specs');
    if (existingSpecs) {
        existingSpecs.remove();
    }
    
    // 주요 특징 목록 생성
    const featuresList = document.getElementById('modalFeatures');
    featuresList.innerHTML = '<h5>주요 특징</h5><ul></ul>';
    const featuresUl = featuresList.querySelector('ul');
    data.features.forEach(feature => {
        const li = document.createElement('li');
        li.textContent = feature;
        featuresUl.appendChild(li);
    });
    
    // 기술 사양 섹션 HTML 생성 및 추가
    const specsHtml = `<div class="detail-specs">
        <h5>기술 사양</h5>
        <ul>
            ${Object.entries(data.specs).map(([key, value]) => 
                `<li><strong>${key}:</strong> ${value}</li>`
            ).join('')}
        </ul>
    </div>`;
    
    featuresList.insertAdjacentHTML('afterend', specsHtml);
    
    // 모달 표시 및 배경 스크롤 비활성화
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 하드웨어 상세 정보 모달 닫기
function closeModal() {
    const modal = document.getElementById('hardwareModal');
    if (!modal) return;
    
    // 모달 숨김 및 배경 스크롤 활성화
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// DOM 로드 완료 시 하드웨어 시스템 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 다른 모듈들이 먼저 로드되도록 100ms 지연 후 초기화
    setTimeout(() => {
        initializeHardwareSystem();
    }, 100);
});