/**
 * Campus Map Interactive Features
 * 캠퍼스 맵 인터랙티브 기능 구현
 */

// Building data configuration
const buildingData = {
    math: {
        title: "📐 수학관",
        content: `
            <div class="building-detail-content">
                <h4>기초 수학 과목</h4>
                <div class="subject-list">
                    <div class="subject-item">
                        <span class="subject-name">선형대수학</span>
                        <span class="importance-badge high">⭐⭐⭐</span>
                    </div>
                    <div class="subject-item">
                        <span class="subject-name">확률론 및 통계학</span>
                        <span class="importance-badge high">⭐⭐⭐</span>
                    </div>
                    <div class="subject-item">
                        <span class="subject-name">최적화 (Convex Optimization)</span>
                        <span class="importance-badge medium">⭐⭐</span>
                    </div>
                </div>
                
                <h4>추천 도서</h4>
                <div class="book-list">
                    <div class="book-mini-card">
                        <img src="https://images-na.ssl-images-amazon.com/images/I/81kqrwS1nxL.jpg" alt="선형대수학과 그 응용">
                        <div>
                            <div class="book-title">선형대수학과 그 응용</div>
                            <div class="book-author">Gilbert Strang</div>
                        </div>
                    </div>
                    <div class="book-mini-card">
                        <img src="https://images-na.ssl-images-amazon.com/images/I/61GMhHg7MML.jpg" alt="최적화 모델링">
                        <div>
                            <div class="book-title">최적화 모델링</div>
                            <div class="book-author">Stephen Boyd</div>
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    engineering: {
        title: "⚙️ 공학관",
        content: `
            <div class="building-detail-content">
                <h4>제어 이론</h4>
                <div class="subject-list">
                    <div class="subject-item">
                        <span class="subject-name">PID 제어</span>
                        <span class="importance-badge medium">⭐⭐</span>
                    </div>
                    <div class="subject-item">
                        <span class="subject-name">상태공간 모델</span>
                        <span class="importance-badge high">⭐⭐⭐</span>
                    </div>
                    <div class="subject-item">
                        <span class="subject-name">LQR (최적 제어)</span>
                        <span class="importance-badge medium">⭐⭐</span>
                    </div>
                    <div class="subject-item">
                        <span class="subject-name">비선형 제어</span>
                        <span class="importance-badge low">⭐</span>
                    </div>
                </div>
                
                <h4>시스템 이론</h4>
                <div class="subject-list">
                    <div class="subject-item">
                        <span class="subject-name">신호처리 및 필터링</span>
                        <span class="importance-badge medium">⭐⭐</span>
                    </div>
                    <div class="subject-item">
                        <span class="subject-name">상태추정 (Kalman, Particle Filter)</span>
                        <span class="importance-badge medium">⭐⭐</span>
                    </div>
                </div>
            </div>
        `
    },
    robotics: {
        title: "🤖 로봇공학관 (메인)",
        content: `
            <div class="building-detail-content">
                <h4>로봇공학 이론</h4>
                <div class="subject-list">
                    <div class="subject-item">
                        <span class="subject-name">운동학 (Kinematics)</span>
                        <span class="importance-badge high">⭐⭐⭐</span>
                    </div>
                    <div class="subject-item">
                        <span class="subject-name">동역학 (Dynamics)</span>
                        <span class="importance-badge medium">⭐⭐</span>
                    </div>
                    <div class="subject-item">
                        <span class="subject-name">자코비안</span>
                        <span class="importance-badge high">⭐⭐⭐</span>
                    </div>
                    <div class="subject-item">
                        <span class="subject-name">SLAM 이론</span>
                        <span class="importance-badge medium">⭐⭐</span>
                    </div>
                    <div class="subject-item">
                        <span class="subject-name">모션플래닝 알고리즘</span>
                        <span class="importance-badge medium">⭐⭐</span>
                    </div>
                </div>
                
                <h4>필수 도서</h4>
                <div class="book-list">
                    <div class="book-mini-card featured">
                        <img src="https://images-na.ssl-images-amazon.com/images/I/71u3wL%2BGjEL.jpg" alt="모던 로보틱스">
                        <div>
                            <div class="book-title">모던 로보틱스: 기구학, 동역학, 제어</div>
                            <div class="book-author">Kevin Lynch, Frank Park</div>
                            <div class="book-badge">필수</div>
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    vision: {
        title: "👁️ 비전연구소",
        content: `
            <div class="building-detail-content">
                <h4>컴퓨터 비전</h4>
                <div class="subject-list">
                    <div class="subject-item">
                        <span class="subject-name">카메라 모델링</span>
                        <span class="importance-badge medium">⭐⭐</span>
                    </div>
                    <div class="subject-item">
                        <span class="subject-name">3D 인식</span>
                        <span class="importance-badge medium">⭐⭐</span>
                    </div>
                    <div class="subject-item">
                        <span class="subject-name">객체 탐지</span>
                        <span class="importance-badge medium">⭐⭐</span>
                    </div>
                </div>
                
                <h4>추천 강의</h4>
                <div class="course-list">
                    <div class="course-mini-card">
                        <div class="course-thumbnail">K-MOOC</div>
                        <div>
                            <div class="course-title">컴퓨터 비전</div>
                            <div class="course-instructor">KAIST, 고려대</div>
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    ai: {
        title: "🧠 AI연구원",
        content: `
            <div class="building-detail-content">
                <h4>머신러닝 이론</h4>
                <div class="subject-list">
                    <div class="subject-item">
                        <span class="subject-name">지도학습 / 비지도학습</span>
                        <span class="importance-badge high">⭐⭐⭐</span>
                    </div>
                    <div class="subject-item">
                        <span class="subject-name">강화학습</span>
                        <span class="importance-badge medium">⭐⭐</span>
                    </div>
                    <div class="subject-item">
                        <span class="subject-name">딥러닝</span>
                        <span class="importance-badge high">⭐⭐⭐</span>
                    </div>
                    <div class="subject-item">
                        <span class="subject-name">Bayesian Methods</span>
                        <span class="importance-badge low">⭐</span>
                    </div>
                </div>
                
                <h4>핵심 도서</h4>
                <div class="book-list">
                    <div class="book-mini-card featured">
                        <img src="https://images-na.ssl-images-amazon.com/images/I/91qbJQXxNvL.jpg" alt="강화학습">
                        <div>
                            <div class="book-title">강화학습: 이론과 알고리즘</div>
                            <div class="book-author">Sutton & Barto</div>
                            <div class="book-badge">필수</div>
                        </div>
                    </div>
                    <div class="book-mini-card">
                        <img src="https://images-na.ssl-images-amazon.com/images/I/71m7QGPBMYL.jpg" alt="딥러닝">
                        <div>
                            <div class="book-title">딥러닝</div>
                            <div class="book-author">Ian Goodfellow 외</div>
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    workshop: {
        title: "🔧 실습동",
        content: `
            <div class="building-detail-content">
                <h4>프로그래밍 실무</h4>
                <div class="skill-list">
                    <div class="skill-item">
                        <span class="skill-name">Python</span>
                        <span class="skill-detail">NumPy, SciPy, PyTorch/TensorFlow, OpenCV</span>
                        <span class="importance-badge high">⭐⭐⭐</span>
                    </div>
                    <div class="skill-item">
                        <span class="skill-name">C++</span>
                        <span class="skill-detail">실시간 시스템, ROS 개발</span>
                        <span class="importance-badge medium">⭐⭐</span>
                    </div>
                </div>
                
                <h4>로봇 플랫폼</h4>
                <div class="platform-list">
                    <div class="platform-item featured">
                        <span class="platform-name">ROS/ROS2</span>
                        <span class="platform-desc">노드, 토픽, 서비스, 액션</span>
                    </div>
                    <div class="platform-item">
                        <span class="platform-name">Gazebo</span>
                        <span class="platform-desc">시뮬레이션 환경</span>
                    </div>
                </div>
                
                <h4>시뮬레이션 도구</h4>
                <div class="sim-list">
                    <div class="sim-item">Gazebo (범용)</div>
                    <div class="sim-item popular">MuJoCo (접촉-rich 조작)</div>
                    <div class="sim-item">PyBullet (경량)</div>
                    <div class="sim-item">NVIDIA Isaac Sim (GPU 가속)</div>
                </div>
            </div>
        `
    },
    library: {
        title: "📚 중앙도서관",
        content: `
            <div class="building-detail-content">
                <h4>주요 도서 컬렉션</h4>
                
                <div class="library-section">
                    <h5>📐 수학 & 최적화</h5>
                    <div class="book-collection">
                        <div class="book-mini-card">
                            <img src="https://images-na.ssl-images-amazon.com/images/I/81kqrwS1nxL.jpg" alt="선형대수학">
                            <div>
                                <div class="book-title">선형대수학과 그 응용</div>
                                <div class="book-author">Gilbert Strang</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="library-section">
                    <h5>🤖 로봇공학</h5>
                    <div class="book-collection">
                        <div class="book-mini-card featured">
                            <img src="https://images-na.ssl-images-amazon.com/images/I/71u3wL%2BGjEL.jpg" alt="모던 로보틱스">
                            <div>
                                <div class="book-title">모던 로보틱스</div>
                                <div class="book-author">Kevin Lynch, Frank Park</div>
                                <div class="book-badge">필수</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="library-section">
                    <h5>🧠 AI & 머신러닝</h5>
                    <div class="book-collection">
                        <div class="book-mini-card">
                            <img src="https://images-na.ssl-images-amazon.com/images/I/71m7QGPBMYL.jpg" alt="딥러닝">
                            <div>
                                <div class="book-title">딥러닝</div>
                                <div class="book-author">Ian Goodfellow 외</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="library-info">
                    <p><i class="fas fa-info-circle"></i> 모든 도서는 온라인으로도 접근 가능합니다</p>
                </div>
            </div>
        `
    },
    lecture: {
        title: "🎓 강의동",
        content: `
            <div class="building-detail-content">
                <h4>온라인 강의 목록</h4>
                
                <div class="lecture-section">
                    <h5>📐 수학 & 최적화</h5>
                    <div class="course-collection">
                        <div class="course-mini-card">
                            <div class="course-thumbnail">K-MOOC</div>
                            <div>
                                <div class="course-title">선형대수학</div>
                                <div class="course-instructor">연세대 이영무 교수</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="lecture-section">
                    <h5>🤖 로봇공학</h5>
                    <div class="course-collection">
                        <div class="course-mini-card featured">
                            <div class="course-thumbnail">K-MOOC</div>
                            <div>
                                <div class="course-title">로봇공학</div>
                                <div class="course-instructor">서울대, KAIST, 한양대</div>
                                <div class="course-badge">추천</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="lecture-section">
                    <h5>🧠 AI & 머신러닝</h5>
                    <div class="course-collection">
                        <div class="course-mini-card">
                            <div class="course-thumbnail">인프런</div>
                            <div>
                                <div class="course-title">파이토치/텐서플로 딥러닝</div>
                                <div class="course-instructor">Fast Campus/인프런</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="lecture-section">
                    <h5>⚙️ ROS & 실습</h5>
                    <div class="course-collection">
                        <div class="course-mini-card featured">
                            <div class="course-thumbnail">K-MOOC</div>
                            <div>
                                <div class="course-title">ROS와 로봇 프로그래밍</div>
                                <div class="course-instructor">한양대, 충북대</div>
                                <div class="course-badge">필수</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }
};

// Campus Map Interactive Features
class CampusMap {
    constructor() {
        this.modal = document.getElementById('buildingModal');
        this.modalTitle = document.getElementById('buildingTitle');
        this.modalContent = document.getElementById('buildingContent');
        this.activeBuilding = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.addHoverEffects();
    }
    
    bindEvents() {
        // Building click events
        document.querySelectorAll('.campus-building').forEach(building => {
            building.addEventListener('click', (e) => {
                const buildingType = building.dataset.building;
                this.openBuildingModal(buildingType);
                this.setActiveBuilding(building);
            });
        });
        
        // Modal close events
        const closeBtn = this.modal.querySelector('.modal-close');
        const overlay = this.modal.querySelector('.modal-overlay');
        
        closeBtn?.addEventListener('click', () => this.closeBuildingModal());
        overlay?.addEventListener('click', () => this.closeBuildingModal());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.closeBuildingModal();
            }
        });
    }
    
    addHoverEffects() {
        document.querySelectorAll('.campus-building').forEach(building => {
            building.addEventListener('mouseenter', () => {
                building.style.filter = 'brightness(1.1) drop-shadow(0 8px 16px rgba(0,0,0,0.3))';
            });
            
            building.addEventListener('mouseleave', () => {
                if (!building.classList.contains('active')) {
                    building.style.filter = '';
                }
            });
        });
    }
    
    openBuildingModal(buildingType) {
        const data = buildingData[buildingType];
        if (!data) return;
        
        this.modalTitle.textContent = data.title;
        this.modalContent.innerHTML = data.content;
        
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Add modal content styles
        this.styleModalContent();
    }
    
    closeBuildingModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Remove active state from buildings
        document.querySelectorAll('.campus-building.active').forEach(building => {
            building.classList.remove('active');
            building.style.filter = '';
        });
        
        this.activeBuilding = null;
    }
    
    setActiveBuilding(building) {
        // Remove active state from other buildings
        document.querySelectorAll('.campus-building.active').forEach(b => {
            b.classList.remove('active');
            b.style.filter = '';
        });
        
        // Set active state for clicked building
        building.classList.add('active');
        this.activeBuilding = building;
    }
    
    styleModalContent() {
        // Add styles to modal content elements
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
        
        if (!document.getElementById('modal-dynamic-styles')) {
            const styleElement = document.createElement('div');
            styleElement.id = 'modal-dynamic-styles';
            styleElement.innerHTML = style;
            document.head.appendChild(styleElement);
        }
    }
}

// Initialize campus map when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CampusMap();
    
    // Add campus entrance animation
    setTimeout(() => {
        document.querySelectorAll('.campus-building').forEach((building, index) => {
            setTimeout(() => {
                building.style.opacity = '0';
                building.style.transform = 'translateY(50px) scale(0.8)';
                building.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                
                setTimeout(() => {
                    building.style.opacity = '1';
                    building.style.transform = '';
                }, 100);
            }, index * 150);
        });
    }, 500);
});