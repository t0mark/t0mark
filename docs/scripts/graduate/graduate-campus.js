// 캠퍼스 건물 데이터 (외부 JSON 로드)
// 각 건물 클릭 시 모달에 표시될 상세 정보는 JSON에서 로드됨
let buildingData = {};

document.addEventListener('DOMContentLoaded', () => {
    fetch('data/graduate/campus-buildings.json')
        .then(res => res.json())
        .then(data => {
            buildingData = data;
            document.dispatchEvent(new CustomEvent('campusBuildingsLoaded'));
        })
        .catch(err => {
            console.error('campus-buildings.json 로드 실패:', err);
        });
});

class CampusMap {
    constructor() {
        // 모달 관련 DOM 요소들 참조
        this.modal = document.getElementById('buildingModal');
        this.modalTitle = document.getElementById('buildingTitle');
        this.modalContent = document.getElementById('buildingContent');
        this.activeBuilding = null;
        
        this.init();
    }
    
    // 캠퍼스 맵 기능 초기화
    init() {
        this.bindEvents();
        this.addHoverEffects();
    }
    
    // 캠퍼스 건물과 모달의 이벤트 리스너 바인딩
    bindEvents() {
        // 각 건물에 클릭 이벤트 추가
        document.querySelectorAll('.campus-building').forEach(building => {
            building.addEventListener('click', (e) => {
                const buildingType = building.dataset.building;
                this.openBuildingModal(buildingType);
                this.setActiveBuilding(building);
            });
        });
        
        // 모달 닫기 버튼과 배경 오버레이 선택
        const closeBtn = this.modal.querySelector('.modal-close');
        const overlay = this.modal.querySelector('.modal-overlay');
        
        // 닫기 버튼 및 배경 클릭 이벤트
        closeBtn?.addEventListener('click', () => this.closeBuildingModal());
        overlay?.addEventListener('click', () => this.closeBuildingModal());
        
        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.closeBuildingModal();
            }
        });
    }
    
    // 건물에 마우스 호버 시 비주얼 효과 추가
    addHoverEffects() {
        document.querySelectorAll('.campus-building').forEach(building => {
            // 마우스 진입 시 밝기와 그림자 효과
            building.addEventListener('mouseenter', () => {
                building.style.filter = 'brightness(1.1) drop-shadow(0 8px 16px rgba(0,0,0,0.3))';
            });
            
            // 마우스 벗어날 때 효과 제거 (활성 상태가 아닌 경우)
            building.addEventListener('mouseleave', () => {
                if (!building.classList.contains('active')) {
                    building.style.filter = '';
                }
            });
        });
    }
    
    // 선택된 건물의 상세 정보 모달 열기
    openBuildingModal(buildingType) {
        const data = buildingData[buildingType];
        if (!data) return;

        // 모달 제목
        this.modalTitle.textContent = data.title || '';

        // 콘텐츠 렌더링: 구조 데이터 우선, 없으면 기존 HTML(Fallback)
        if (data.sections && Array.isArray(data.sections)) {
            this.modalContent.innerHTML = data.sections.map(this.renderSection).join('');
        } else if (data.content) {
            this.modalContent.innerHTML = data.content;
        } else {
            this.modalContent.innerHTML = '';
        }

        // 모달 표시 및 배경 스크롤 비활성화
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // 모달 콘텐츠에 스타일 적용
        this.styleModalContent();
    }

    // 섹션 타입별 렌더러
    renderSection(section) {
        const esc = (s) => String(s ?? '').replace(/&/g, '&amp;')
                                           .replace(/</g, '&lt;')
                                           .replace(/>/g, '&gt;');
        const title = section.title ? `<h4>${esc(section.title)}</h4>` : '';
        const t = section.type;
        if (t === 'subjects' && Array.isArray(section.items)) {
            return `
            <div class="building-detail-content">
                ${title}
                <div class="subject-list">
                    ${section.items.map(it => `
                        <div class="subject-item">
                            <span class="subject-name">${esc(it.name)}</span>
                            <span class="importance-badge ${esc(it.importance || 'medium')}">${it.importance === 'high' ? '⭐⭐⭐' : it.importance === 'medium' ? '⭐⭐' : '⭐'}</span>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }
        if (t === 'skills' && Array.isArray(section.items)) {
            return `
            <div class="building-detail-content">
                ${title}
                <div class="skill-list">
                    ${section.items.map(it => `
                        <div class="skill-item">
                            <span class="skill-name">${esc(it.name)}</span>
                            ${it.detail ? `<span class="skill-detail">${esc(it.detail)}</span>` : ''}
                            <span class="importance-badge ${esc(it.importance || 'medium')}">${it.importance === 'high' ? '⭐⭐⭐' : it.importance === 'medium' ? '⭐⭐' : '⭐'}</span>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }
        if (t === 'books' && Array.isArray(section.items)) {
            return `
            <div class="building-detail-content">
                ${title}
                <div class="book-list">
                    ${section.items.map(it => `
                        <div class="book-mini-card ${it.featured ? 'featured' : ''}">
                            ${it.image ? `<img src="${esc(it.image)}" alt="${esc(it.title)}">` : ''}
                            <div>
                                <div class="book-title">${esc(it.title)}</div>
                                ${it.author ? `<div class="book-author">${esc(it.author)}</div>` : ''}
                            </div>
                            ${it.badge ? `<div class="book-badge">${esc(it.badge)}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }
        if (t === 'courses' && Array.isArray(section.items)) {
            return `
            <div class="building-detail-content">
                ${title}
                <div class="course-collection">
                    ${section.items.map(it => `
                        <div class="course-mini-card ${it.featured ? 'featured' : ''}">
                            <div class="course-thumbnail">${esc(it.source || 'COURSE')}</div>
                            <div>
                                <div class="course-title">${esc(it.title)}</div>
                                ${it.instructor ? `<div class="course-instructor">${esc(it.instructor)}</div>` : ''}
                            </div>
                            ${it.badge ? `<div class="course-badge">${esc(it.badge)}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }
        if (t === 'platforms' && Array.isArray(section.items)) {
            return `
            <div class="building-detail-content">
                ${title}
                <div class="platform-list">
                    ${section.items.map(it => `
                        <div class="platform-item ${it.featured ? 'featured' : ''}">
                            <span class="platform-name">${esc(it.name)}</span>
                            ${it.desc ? `<span class="platform-desc">${esc(it.desc)}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }
        if (t === 'sims' && Array.isArray(section.items)) {
            return `
            <div class="building-detail-content">
                ${title}
                <div class="sim-list">
                    ${section.items.map(it => `
                        <div class="sim-item ${it.popular ? 'popular' : ''}">${esc(it.name)}</div>
                    `).join('')}
                </div>
            </div>`;
        }
        if (t === 'notice' && section.text) {
            return `
            <div class="building-detail-content">
                <div class="library-info">${esc(section.text)}</div>
            </div>`;
        }
        return '';
    }
    
    // 건물 상세 정보 모달 닫기
    closeBuildingModal() {
        // 모달 숨김 및 배경 스크롤 활성화
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // 모든 건물에서 활성화 상태 및 비주얼 효과 제거
        document.querySelectorAll('.campus-building.active').forEach(building => {
            building.classList.remove('active');
            building.style.filter = '';
        });
        
        this.activeBuilding = null;
    }
    
    // 클릭된 건물을 활성 상태로 설정
    setActiveBuilding(building) {
        // 다른 모든 건물의 활성 상태 제거
        document.querySelectorAll('.campus-building.active').forEach(b => {
            b.classList.remove('active');
            b.style.filter = '';
        });
        
        // 클릭한 건물에 활성 상태 설정
        building.classList.add('active');
        this.activeBuilding = building;
    }
    
    // 모달 콘텐츠에 동적 스타일 적용
    styleModalContent() {
        // 모달 콘텐츠 요소들에 CSS 스타일 추가
        const style = `
            <style>
                .building-detail-content h4, .building-detail-content h5 {
                    color: var(--text);
                    margin: 1.5rem 0 1rem 0;
                    padding-bottom: 0.5rem;
                    border-bottom: 2px solid var(--border);
                    font-weight: 600;
                }
                
                .subject-list, .skill-list {
                    display: grid;
                    gap: 0.75rem;
                    margin-bottom: 2rem;
                }
                
                .subject-item, .skill-item {
                    background: var(--bg-light);
                    padding: 1rem;
                    border-radius: var(--border-radius);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border: 1px solid var(--border);
                }
                
                .subject-name, .skill-name {
                    font-weight: 600;
                    color: var(--text);
                }
                
                .skill-detail {
                    font-size: var(--text-sm);
                    color: var(--text-muted);
                    margin-left: 1rem;
                    flex: 1;
                }
                
                .importance-badge {
                    font-size: var(--text-xs);
                    padding: 0.25rem 0.5rem;
                    border-radius: var(--border-radius-full);
                    font-weight: 600;
                }
                
                .importance-badge.high {
                    background: #ffebee;
                    color: #d32f2f;
                }
                
                .importance-badge.medium {
                    background: #fff3e0;
                    color: #f57c00;
                }
                
                .importance-badge.low {
                    background: var(--bg-light);
                    color: var(--text-muted);
                }
                
                .book-list, .book-collection {
                    display: grid;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }
                
                .book-mini-card {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem;
                    background: var(--bg-light);
                    border-radius: var(--border-radius);
                    border: 1px solid var(--border);
                    position: relative;
                }
                
                .book-mini-card.featured {
                    border-left: 4px solid var(--accent-research);
                }
                
                .book-mini-card img {
                    width: 60px;
                    height: 80px;
                    object-fit: cover;
                    border-radius: 4px;
                    box-shadow: var(--shadow-sm);
                }
                
                .book-title {
                    font-weight: 600;
                    color: var(--text);
                    font-size: var(--text-sm);
                    margin-bottom: 0.25rem;
                }
                
                .book-author {
                    color: var(--text-muted);
                    font-size: var(--text-xs);
                }
                
                .book-badge, .course-badge {
                    position: absolute;
                    top: 0.5rem;
                    right: 0.5rem;
                    background: var(--accent-research);
                    color: white;
                    padding: 0.25rem 0.5rem;
                    border-radius: var(--border-radius-full);
                    font-size: var(--text-xs);
                    font-weight: 600;
                }
                
                .course-collection {
                    display: grid;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                
                .course-mini-card {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem;
                    background: var(--bg-light);
                    border-radius: var(--border-radius);
                    border: 1px solid var(--border);
                    position: relative;
                }
                
                .course-mini-card.featured {
                    border-left: 4px solid var(--accent-research);
                }
                
                .course-thumbnail {
                    width: 80px;
                    height: 50px;
                    background: var(--primary);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    font-size: var(--text-xs);
                    font-weight: 600;
                }
                
                .course-title {
                    font-weight: 600;
                    color: var(--text);
                    font-size: var(--text-sm);
                    margin-bottom: 0.25rem;
                }
                
                .course-instructor {
                    color: var(--text-muted);
                    font-size: var(--text-xs);
                }
                
                .platform-list, .sim-list {
                    display: grid;
                    gap: 0.5rem;
                    margin-bottom: 2rem;
                }
                
                .platform-item, .sim-item {
                    background: var(--bg-light);
                    padding: 0.75rem 1rem;
                    border-radius: var(--border-radius);
                    border: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .platform-item.featured, .sim-item.popular {
                    background: var(--primary);
                    color: white;
                    font-weight: 600;
                }
                
                .platform-name {
                    font-weight: 600;
                    color: var(--text);
                }
                
                .platform-desc {
                    color: var(--text-muted);
                    font-size: var(--text-sm);
                }
                
                .platform-item.featured .platform-name,
                .platform-item.featured .platform-desc {
                    color: white;
                }
                
                .library-section, .lecture-section {
                    margin-bottom: 2rem;
                    padding: 1rem;
                    background: var(--bg-light);
                    border-radius: var(--border-radius);
                    border: 1px solid var(--border);
                }
                
                .library-info {
                    background: var(--accent-research);
                    color: white;
                    padding: 1rem;
                    border-radius: var(--border-radius);
                    margin-top: 1.5rem;
                    text-align: center;
                }
                
                @media (max-width: 768px) {
                    .book-mini-card, .course-mini-card {
                        flex-direction: column;
                        text-align: center;
                    }
                    
                    .book-mini-card img {
                        width: 80px;
                        height: 100px;
                        margin: 0 auto;
                    }
                }
            </style>
        `;
        
        // 이미 스타일이 적용되었는지 확인 후 추가
        if (!document.getElementById('modal-dynamic-styles')) {
            const styleElement = document.createElement('div');
            styleElement.id = 'modal-dynamic-styles';
            styleElement.innerHTML = style;
            document.head.appendChild(styleElement);
        }
    }
}

// 다른 모듈에서 사용할 캠퍼스 맵 관련 함수들을 전역 객체로 제공
window.campusMap = {
    CampusMap,
    // 동적으로 로드된 콘텐츠의 캠퍼스 맵 기능 재초기화
    reinitializeCampusMap: function() {
        const campusBuildings = document.querySelectorAll('.campus-building');
        
        // 새로 로드된 건물들에 클릭 이벤트 추가
        campusBuildings.forEach(building => {
            building.addEventListener('click', function() {
                const buildingType = this.getAttribute('data-building');
                if (buildingType && window.campusMap.instance) {
                    window.campusMap.instance.openBuildingModal(buildingType);
                }
            });
        });
    }
};

// DOM 로드 완료 시 캠퍼스 맵 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 캠퍼스 맵 인스턴스 생성 및 전역 참조 저장
    const campusMapInstance = new CampusMap();
    window.campusMap.instance = campusMapInstance;
    
    // 캠퍼스 입장 애니메이션 효과
    setTimeout(() => {
        document.querySelectorAll('.campus-building').forEach((building, index) => {
            setTimeout(() => {
                // 각 건물에 초기 상태 설정
                building.style.opacity = '0';
                building.style.transform = 'translateY(50px) scale(0.8)';
                building.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                
                // 짧은 딜레이 후 나타나는 효과
                setTimeout(() => {
                    building.style.opacity = '1';
                    building.style.transform = '';
                }, 100);
            }, index * 150);
        });
    }, 500);
    
    console.log('🏫 Graduate Campus 모듈이 초기화되었습니다.');
});
