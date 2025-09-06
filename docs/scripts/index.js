document.addEventListener('DOMContentLoaded', function() {
  const graphContainer = document.querySelector('.graph-container');

  // 높이 조정 함수
  function setGraphHeight() {
    const header = document.querySelector('.top-nav');
    const headerHeight = header ? header.offsetHeight : 88;
    if (graphContainer) {
      graphContainer.style.height = `calc(100vh - ${headerHeight}px)`;
    }
  }

  // 초기 설정
  setGraphHeight();
  window.addEventListener('resize', setGraphHeight);
  document.addEventListener('navbar:ready', setGraphHeight);

  // vis-network 그래프 요소
  // 컨테이너
  const container = document.getElementById('network');
  // 노드
  const baseNodes = [
    // 앵커 노드
    { id: 'computer', label: 'Computer', group: 'level2', title: 'Computer', x: -800, y: -150, physics: false, image: 'images/icons/computer.png' },
    { id: 'ee', label: 'Electrical Engineering', group: 'level1', title: 'Electrical Engineering', x: -400, y: -150, physics: false, image: 'images/icons/ee.png' },
    { id: 'me', label: 'Mechanical Engineering', group: 'level1', title: 'Mechanical Engineering', x: 0, y: -150, physics: false, image: 'images/icons/me.png' },

    // 세부 노드
    // 전자공학
    { id: 'signal', label: 'Signal & Comm.', group: 'level2', x: -500, y: -200, image: 'images/icons/signal.png' },
    { id: 'control', label: 'Control', group: 'level2', x: -350, y: -40, image: 'images/icons/control.png' },

    // 기계공학
    { id: 'robotics', label: 'Robotics', group: 'level2', x: 380, y: -230, image: 'images/icons/robotics.png' },
    { id: 'kinematics', label: 'Kinematics & Dynamics', group: 'level3', x: 440, y: -300, image: 'images/icons/kinematics.png' },

    // 전자 - 기계
    { id: 'mechatronics', label: 'Mechatronics', group: 'inter', title: 'Interdisciplinary', x: 200, y: -40, image: 'images/icons/mechatronics.png' },

    // 컴퓨터
    { id: 'cs', label: 'CS', group: 'level3', x: -520, y: -230, image: 'images/icons/cs.png' },
    { id: 'ca', label: 'CA', group: 'level3', x: -470, y: -170, image: 'images/icons/ca.png' },
    { id: 'se', label: 'SE', group: 'level3', x: -360, y: -70, image: 'images/icons/se.png' },
    { id: 'net', label: 'Net & Sec', group: 'level3', x: -560, y: 10, image: 'images/icons/netsec.png' },
    { id: 'ai', label: 'AI & Data', group: 'level3', x: -460, y: 70, image: 'images/icons/ai.png' },
    { id: 'hci', label: 'HCI', group: 'level3', x: -360, y: 10, image: 'images/icons/hci.png' },

    // 수학
    { id: 'mathematics', label: 'Mathematics', group: 'level1', title: 'Mathematics', x: -200, y: 200, physics: false, image: 'images/icons/mathematics.png' },
    { id: 'statistics', label: 'Statistics', group: 'level2', x: -120, y: 280, image: 'images/icons/statistics.png' },
    { id: 'engineering_math', label: 'Engineering Math', group: 'level2', x: -200, y: 320, image: 'images/icons/engineering_math.png' },
    { id: 'linear_algebra', label: 'Linear Algebra', group: 'level2', x: -280, y: 280, image: 'images/icons/linear_algebra.png' }
  ];

  // 엣지
  const edgesData = [
    { from: 'ee', to: 'signal', length: 170 },
    { from: 'ee', to: 'control', length: 170 },
    { from: 'ee', to: 'computer' },
    { from: 'computer', to: 'cs', length: 150 },
    { from: 'computer', to: 'ca', length: 150 },
    { from: 'computer', to: 'se', length: 150 },
    { from: 'computer', to: 'net', length: 150 },
    { from: 'computer', to: 'ai', length: 150 },
    { from: 'computer', to: 'hci', length: 150 },
    { from: 'me', to: 'robotics', length: 170 },
    { from: 'robotics', to: 'kinematics', length: 150 },
    { from: 'ee', to: 'mechatronics' },
    { from: 'me', to: 'mechatronics' },
    { from: 'mathematics', to: 'statistics', length: 150 },
    { from: 'mathematics', to: 'engineering_math', length: 150 },
    { from: 'mathematics', to: 'linear_algebra', length: 150 }
  ];

  // 그래프 옵션
  const options = {
    // 노드 스타일 설정
    nodes: {
      shape: 'circularImage',
      shapeProperties: { useBorderWithImage: true },
      shadow: { enabled: true, x: 3, y: 3, size: 10, color: 'rgba(0, 0, 0, 0.2)' },
      font: { color: '#343434', size: 14, face: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', vadjust: 10 },
      borderWidth: 3
    },

    // 노드 그룹별 스타일 설정
    groups: {
      level1: { color: { border: '#FF7272', background: 'rgba(255, 138, 138, 0.9)' }, size: 62 },
      level2: { color: { border: '#61AFFF', background: 'rgba(138, 198, 255, 0.9)' }, size: 50 },
      level3: { color: { border: '#69D483', background: 'rgba(148, 226, 166, 0.9)' }, size: 38 },
      inter: { color: { border: '#FFD35A', background: 'rgba(255, 217, 120, 0.9)' }, size: 50 }
    },

    // 엣지 스타일 설정
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
        centralGravity: 0.18,
        springLength: 180,
        springConstant: 0.035,
        nodeDistance: 160,
        damping: 0.12
      },
      stabilization: { iterations: 900 }
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

  // 아이콘 이미지 조정 함수
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

  // 모든 노드의 이미지를 패딩 처리하여 최종 노드 데이터 생성
  async function buildPaddedNodes(base) {
    // 이미지 URL 수집
    const imageUrls = base.filter(n => n.image).map(n => n.image);
    const urlToData = new Map();
    
    // 모든 이미지를 병렬로 처리
    await Promise.all(imageUrls.map(async (url) => {
      try {
        const dataUrl = await padImageToRatio(url, 0.6);
        urlToData.set(url, dataUrl);
      } catch (e) {
        urlToData.set(url, url);
      }
    }));
    
    // 노드에 처리된 이미지 URL 적용
    return base.map(n => n.image ? { ...n, image: urlToData.get(n.image) || n.image } : { ...n });
  }

  // 그래프 초기화
  (async () => {
    // 노드 데이터 생성
    const paddedNodes = await buildPaddedNodes(baseNodes);
    
    // vis.js DataSet 객체 생성 (노드, 엣지)
    const nodes = new vis.DataSet(paddedNodes);
    const edges = new vis.DataSet(edgesData);
    
    // 네트워크 그래프 생성
    const network = new vis.Network(container, { nodes, edges }, options);
  })();
});
