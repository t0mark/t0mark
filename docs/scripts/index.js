document.addEventListener('DOMContentLoaded', function() {
  
  // ==========================================
  // 데이터 정의
  // ==========================================
  
  // DOM 요소
  const container = document.getElementById('network');
  
  // 네트워크 노드 데이터
  const baseNodes = [
    // 앵커 노드 (주요 분야)
    { id: 'ee', label: 'Electrical Engineering', group: 'level1', title: 'Electrical Engineering', x: 0, y: 0,  image: 'images/icons/ee.png' },
    { id: 'me', label: 'Mechanical Engineering', group: 'level1', title: 'Mechanical Engineering', x: 500, y: 0, image: 'images/icons/me.png' },
    { id: 'computer', label: 'Computer', group: 'level2', title: 'Computer', x: -500, y: 0, image: 'images/icons/computer.png' },
    { id: 'mathematics', label: 'Mathematics', group: 'level1', title: 'Mathematics', x: 0, y: 350, image: 'images/icons/mathematics.png' },

    // 세부 노드
    // 전자공학
    { id: 'signal', label: 'Signal & Comm.', group: 'level2', y: -100, image: 'images/icons/signal.png' },
    { id: 'control', label: 'Control', group: 'level2', y: -100, image: 'images/icons/control.png' },

    // 기계공학
    { id: 'robotics', label: 'Robotics', group: 'level2', x: 500, y: 200, image: 'images/icons/robotics.png' },
    { id: 'kinematics', label: 'Kinematics & Dynamics', group: 'level3', x: 600, y: 150, image: 'images/icons/kinematics.png' },

    // 전자 - 기계
    { id: 'mechatronics', label: 'Mechatronics', group: 'inter', title: 'Interdisciplinary', x: 150, y: 150, image: 'images/icons/mechatronics.png' },

    // 컴퓨터 과학
    { id: 'cs', label: 'CS', group: 'level3', image: 'images/icons/cs.png' },
    { id: 'ca', label: 'CA', group: 'level3', image: 'images/icons/ca.png' },
    { id: 'se', label: 'SE', group: 'level3', image: 'images/icons/se.png' },
    { id: 'net', label: 'Net & Sec', group: 'level3', image: 'images/icons/netsec.png' },
    { id: 'ai', label: 'AI & Data', group: 'level3', image: 'images/icons/ai.png' },
    { id: 'hci', label: 'HCI', group: 'level3', image: 'images/icons/hci.png' },

    // 수학 분야
    { id: 'statistics', label: 'Statistics', group: 'level2', y: 400, image: 'images/icons/statistics.png' },
    { id: 'engineering_math', label: 'Engineering Math', group: 'level2', y: 400, image: 'images/icons/engineering_math.png' },
    { id: 'linear_algebra', label: 'Linear Algebra', group: 'level2', y: 400, image: 'images/icons/linear_algebra.png' }
  ];

  // 네트워크 연결 데이터
  const edgesData = [
    // 전자공학 연결
    { from: 'ee', to: 'signal', length: 170 },
    { from: 'ee', to: 'control', length: 170 },
    { from: 'ee', to: 'computer', length: 400 },

    // 기계공학 연결
    { from: 'me', to: 'robotics', length: 170 },
    { from: 'robotics', to: 'kinematics', length: 150 },
    
    // 융복합 연결
    { from: 'ee', to: 'mechatronics', length: 240 },
    { from: 'me', to: 'mechatronics', length: 240 },
    
    // 컴퓨터 과학 연결
    { from: 'computer', to: 'cs', length: 150 },
    { from: 'computer', to: 'ca', length: 150 },
    { from: 'computer', to: 'se', length: 150 },
    { from: 'computer', to: 'net', length: 150 },
    { from: 'computer', to: 'ai', length: 150 },
    { from: 'computer', to: 'hci', length: 150 },
    
    // 수학 연결
    { from: 'mathematics', to: 'statistics', length: 150 },
    { from: 'mathematics', to: 'engineering_math', length: 150 },
    { from: 'mathematics', to: 'linear_algebra', length: 150 }
  ];

  // vis.js 네트워크 옵션 설정
  const options = {
    // 노드 기본 스타일
    nodes: {
      shape: 'circularImage',
      shapeProperties: { useBorderWithImage: true },
      shadow: { enabled: true, x: 3, y: 3, size: 10, color: 'rgba(0, 0, 0, 0.2)' },
      font: { color: '#343434', size: 14, face: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', vadjust: 10 },
      borderWidth: 3
    },

    // 노드 그룹별 색상 및 크기
    groups: {
      level1: { color: { border: '#FF7272', background: 'rgba(255, 138, 138, 0.9)' }, size: 62 },
      level2: { color: { border: '#61AFFF', background: 'rgba(138, 198, 255, 0.9)' }, size: 50 },
      level3: { color: { border: '#69D483', background: 'rgba(148, 226, 166, 0.9)' }, size: 38 },
      inter: { color: { border: '#FFD35A', background: 'rgba(255, 217, 120, 0.9)' }, size: 50 }
    },

    // 엣지 스타일
    edges: {
      width: 2,
      color: { color: '#cccccc', highlight: '#a8a8a8', hover: '#a8a8a8' },
      smooth: { type: 'continuous' }
    },

    // 레이아웃 설정
    layout: { improvedLayout: true },
    
    // 물리 엔진 설정
    physics: {
      enabled: true,
      solver: 'repulsion',
      repulsion: {
        centralGravity: 0,
        springConstant: 0.035,
        nodeDistance: 100,
        damping: 0.12
      }
    },

    // 사용자 상호작용 설정
    interaction: {
      hover: true,
      tooltipDelay: 200,
      dragNodes: true,
      dragView: false,
      zoomView: false
    }
  };

  // ==========================================
  // 유틸리티 함수들
  // ==========================================

  // 디바운스 함수 - 연속 호출 방지
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // 이미지 패딩 처리 함수
  function padImageToRatio(url, ratio) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // 캔버스 크기 계산
        const maxSide = Math.max(img.width, img.height) || 256;
        const canvas = document.createElement('canvas');
        canvas.width = maxSide;
        canvas.height = maxSide;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, maxSide, maxSide);

        // 이미지 크기 조정 및 중앙 정렬
        const targetSize = Math.floor(maxSide * ratio);
        const scale = Math.min(targetSize / img.width, targetSize / img.height);
        const drawW = Math.floor(img.width * scale);
        const drawH = Math.floor(img.height * scale);
        const dx = Math.floor((maxSide - drawW) / 2);
        const dy = Math.floor((maxSide - drawH) / 2);
        ctx.drawImage(img, dx, dy, drawW, drawH);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  // 노드 이미지 전처리 함수
  async function buildPaddedNodes(baseNodes) {
    const imageUrls = baseNodes.filter(n => n.image).map(n => n.image);
    const urlToData = new Map();
    
    // 모든 이미지를 병렬로 처리
    await Promise.all(imageUrls.map(async (url) => {
      try {
        const dataUrl = await padImageToRatio(url, 0.6);
        urlToData.set(url, dataUrl);
      } catch (error) {
        urlToData.set(url, url);
      }
    }));
    
    // 처리된 이미지 URL을 노드에 적용
    return baseNodes.map(node => 
      node.image ? { ...node, image: urlToData.get(node.image) || node.image } : { ...node }
    );
  }

  // 리사이즈 핸들러
  function handleResize() {
    if (network) {
      network.fit();
      network.redraw();
    }
  }

  // ==========================================
  // 초기화 및 이벤트 설정
  // ==========================================

  // 네트워크 객체
  let network;

  // 그래프 초기화 및 생성
  async function initializeNetwork() {
    try {
      // 이미지 전처리된 노드 데이터 생성
      const paddedNodes = await buildPaddedNodes(baseNodes);
      
      // vis.js DataSet 객체 생성
      const nodes = new vis.DataSet(paddedNodes);
      const edges = new vis.DataSet(edgesData);
      
      // 네트워크 그래프 생성
      network = new vis.Network(container, { nodes, edges }, options);
    } catch (error) {
      console.error('Network initialization failed:', error);
    }
  }

  // 이벤트 리스너 설정
  function setupEventListeners() {
    // 창 크기 변경 시 그래프 다시 그리기
    window.addEventListener('resize', debounce(handleResize, 150));
  }

  // ==========================================
  // 실행 부분
  // ==========================================

  // 네트워크 초기화 실행
  initializeNetwork();
  
  // 이벤트 리스너 설정
  setupEventListeners();

});