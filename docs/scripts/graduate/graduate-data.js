// 하드웨어 카테고리 정보 데이터
// 로봇 파트별 제목, 배지, 색상 정보를 관리
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

// 다른 모듈에서 사용할 수 있도록 전역 객체에 데이터 등록
// 하드웨어 상세 데이터는 외부 JSON으로 분리하여 로드함
window.GraduateData = {
    hardwareData: {},
    categoryData
};

// 하드웨어 데이터(JSON) 비동기 로드
document.addEventListener('DOMContentLoaded', () => {
    fetch('data/graduate/hardware.json')
        .then(res => res.json())
        .then(data => {
            window.GraduateData.hardwareData = data;
            // 필요 시 데이터 로드 완료 이벤트 디스패치
            document.dispatchEvent(new CustomEvent('hardwareDataLoaded'));
        })
        .catch(err => {
            console.error('hardware.json 로드 실패:', err);
        });
});

