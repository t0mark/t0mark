import React, { useState } from 'react';
import { ArrowLeft, Brain, Target, Cog, Database, BookOpen, Eye, Lightbulb, X, Layers, Zap, Search } from 'lucide-react';

const MachineLearningInfographic = () => {
  const [currentPath, setCurrentPath] = useState([]);
  const [popupData, setPopupData] = useState(null);

  // 메인 카테고리
  const mainData = {
    paradigm: {
      title: "학습 방식",
      subtitle: "Learning Paradigm",
      icon: <Brain className="w-12 h-12" />,
      color: "from-blue-500 to-purple-600",
      description: "데이터와 정답의 유무에 따른 구분"
    },
    problem: {
      title: "문제 유형",
      subtitle: "Problem Type", 
      icon: <Target className="w-12 h-12" />,
      color: "from-green-500 to-teal-600",
      description: "해결하고자 하는 문제의 성격"
    },
    implementation: {
      title: "구현 방법",
      subtitle: "Implementation",
      icon: <Cog className="w-12 h-12" />,
      color: "from-orange-500 to-red-600",
      description: "구체적인 알고리즘과 모델"
    }
  };

  // 전체 계층 데이터
  const hierarchyData = {
    paradigm: [
      {
        id: 'supervised',
        title: '지도학습',
        subtitle: 'Supervised',
        icon: <BookOpen className="w-8 h-8" />,
        color: 'from-blue-400 to-blue-600',
        description: '입력과 정답이 함께 주어진 학습',
        isLeaf: true
      },
      {
        id: 'unsupervised', 
        title: '비지도학습',
        subtitle: 'Unsupervised',
        icon: <Eye className="w-8 h-8" />,
        color: 'from-purple-400 to-purple-600',
        description: '정답 없이 패턴을 찾는 학습',
        isLeaf: true
      },
      {
        id: 'reinforcement',
        title: '강화학습', 
        subtitle: 'Reinforcement',
        icon: <Lightbulb className="w-8 h-8" />,
        color: 'from-indigo-400 to-indigo-600',
        description: '보상을 통한 행동 학습',
        isLeaf: true
      },
      {
        id: 'hybrid',
        title: '하이브리드',
        subtitle: 'Hybrid/Weakly',
        icon: <Database className="w-8 h-8" />,
        color: 'from-cyan-400 to-cyan-600',
        description: '지도/비지도 혼합 방식',
        isLeaf: false
      }
    ],
    problem: [
      {
        id: 'predictive',
        title: '예측 모델링',
        subtitle: 'Predictive',
        icon: <Target className="w-8 h-8" />,
        color: 'from-green-400 to-green-600',
        description: '특정 출력값 예측',
        isLeaf: false
      },
      {
        id: 'structure',
        title: '구조 발견',
        subtitle: 'Structure Discovery',
        icon: <Search className="w-8 h-8" />,
        color: 'from-teal-400 to-teal-600', 
        description: '숨겨진 패턴 찾기',
        isLeaf: false
      },
      {
        id: 'detection',
        title: '탐지',
        subtitle: 'Detection',
        icon: <Eye className="w-8 h-8" />,
        color: 'from-emerald-400 to-emerald-600',
        description: '이상 상황 찾기',
        isLeaf: true
      },
      {
        id: 'generative',
        title: '생성 모델링',
        subtitle: 'Generative',
        icon: <Lightbulb className="w-8 h-8" />,
        color: 'from-lime-400 to-lime-600',
        description: '새로운 데이터 생성',
        isLeaf: true
      }
    ],
    implementation: [
      {
        id: 'linear',
        title: '선형 모델',
        subtitle: 'Linear Models',
        icon: <Database className="w-8 h-8" />,
        color: 'from-orange-400 to-orange-600',
        description: '선형 관계 가정',
        isLeaf: false
      },
      {
        id: 'tree',
        title: '트리 기반',
        subtitle: 'Tree-based',
        icon: <Layers className="w-8 h-8" />,
        color: 'from-red-400 to-red-600',
        description: '계층적 분할',
        isLeaf: true
      },
      {
        id: 'neural',
        title: '신경망',
        subtitle: 'Neural Networks',
        icon: <Brain className="w-8 h-8" />,
        color: 'from-pink-400 to-pink-600',
        description: '뉴런 모방 모델',
        isLeaf: false
      },
      {
        id: 'probabilistic',
        title: '확률 모델',
        subtitle: 'Probabilistic',
        icon: <Target className="w-8 h-8" />,
        color: 'from-rose-400 to-rose-600',
        description: '확률론적 접근',
        isLeaf: false
      },
      {
        id: 'kernel',
        title: '커널 방법',
        subtitle: 'Kernel Methods',
        icon: <Cog className="w-8 h-8" />,
        color: 'from-amber-400 to-amber-600',
        description: '커널 함수 활용',
        isLeaf: false
      },
      {
        id: 'instance',
        title: '사례 기반',
        subtitle: 'Instance-based',
        icon: <Eye className="w-8 h-8" />,
        color: 'from-yellow-400 to-yellow-600',
        description: '사례 비교 예측',
        isLeaf: true
      },
      {
        id: 'ensemble',
        title: '앙상블',
        subtitle: 'Ensembles',
        icon: <Zap className="w-8 h-8" />,
        color: 'from-orange-500 to-red-500',
        description: '여러 모델 결합',
        isLeaf: false
      }
    ],
    hybrid: [
      {
        id: 'semi-supervised',
        title: '준지도학습',
        subtitle: 'Semi-supervised',
        icon: <BookOpen className="w-6 h-6" />,
        color: 'from-cyan-300 to-cyan-500',
        description: '소량 레이블 + 대량 무레이블',
        isLeaf: true
      },
      {
        id: 'self-supervised',
        title: '자기지도학습',
        subtitle: 'Self-supervised',
        icon: <Lightbulb className="w-6 h-6" />,
        color: 'from-blue-300 to-blue-500',
        description: '데이터 자체에서 레이블 생성',
        isLeaf: true
      }
    ],
    predictive: [
      {
        id: 'classification',
        title: '분류',
        subtitle: 'Classification',
        icon: <Target className="w-6 h-6" />,
        color: 'from-green-300 to-green-500',
        description: '카테고리로 분류',
        isLeaf: true
      },
      {
        id: 'regression',
        title: '회귀',
        subtitle: 'Regression',
        icon: <Database className="w-6 h-6" />,
        color: 'from-emerald-300 to-emerald-500',
        description: '연속값 예측',
        isLeaf: true
      }
    ],
    structure: [
      {
        id: 'clustering',
        title: '군집화',
        subtitle: 'Clustering',
        icon: <Search className="w-6 h-6" />,
        color: 'from-teal-300 to-teal-500',
        description: '유사한 데이터 그룹핑',
        isLeaf: true
      },
      {
        id: 'dimensionality',
        title: '차원 축소',
        subtitle: 'Dimensionality Reduction',
        icon: <Layers className="w-6 h-6" />,
        color: 'from-cyan-300 to-cyan-500',
        description: '고차원을 저차원으로',
        isLeaf: true
      },
      {
        id: 'density',
        title: '밀도 추정',
        subtitle: 'Density Estimation',
        icon: <Eye className="w-6 h-6" />,
        color: 'from-blue-300 to-blue-500',
        description: '확률 분포 추정',
        isLeaf: true
      }
    ],
    linear: [
      {
        id: 'linear-regression',
        title: '선형 회귀',
        subtitle: 'Linear Regression',
        icon: <Database className="w-6 h-6" />,
        color: 'from-orange-300 to-orange-500',
        description: '선형 관계 모델링',
        isLeaf: true
      },
      {
        id: 'logistic-regression',
        title: '로지스틱 회귀',
        subtitle: 'Logistic Regression',
        icon: <Target className="w-6 h-6" />,
        color: 'from-red-300 to-red-500',
        description: '분류 문제에 적용',
        isLeaf: true
      }
    ],
    neural: [
      {
        id: 'shallow-networks',
        title: '얕은 신경망',
        subtitle: 'Shallow Networks',
        icon: <Layers className="w-6 h-6" />,
        color: 'from-pink-300 to-pink-500',
        description: '1-2개 은닉층',
        isLeaf: true
      },
      {
        id: 'deep-networks',
        title: '깊은 신경망',
        subtitle: 'Deep Networks',
        icon: <Brain className="w-6 h-6" />,
        color: 'from-purple-300 to-purple-500',
        description: '여러 층의 신경망',
        isLeaf: false
      }
    ],
    probabilistic: [
      {
        id: 'naive-bayes',
        title: '나이브 베이즈',
        subtitle: 'Naive Bayes',
        icon: <BookOpen className="w-6 h-6" />,
        color: 'from-rose-300 to-rose-500',
        description: '베이즈 정리 기반',
        isLeaf: true
      },
      {
        id: 'bayesian-networks',
        title: '베이지안 네트워크',
        subtitle: 'Bayesian Networks',
        icon: <Search className="w-6 h-6" />,
        color: 'from-pink-300 to-pink-500',
        description: '확률적 관계 그래프',
        isLeaf: true
      },
      {
        id: 'gaussian-mixture',
        title: '가우시안 혼합',
        subtitle: 'Gaussian Mixture',
        icon: <Target className="w-6 h-6" />,
        color: 'from-red-300 to-red-500',
        description: '여러 가우시안 분포 혼합',
        isLeaf: true
      }
    ],
    kernel: [
      {
        id: 'svm',
        title: 'SVM',
        subtitle: 'Support Vector Machine',
        icon: <Target className="w-6 h-6" />,
        color: 'from-amber-300 to-amber-500',
        description: '마진 최대화 분류',
        isLeaf: true
      },
      {
        id: 'kernel-pca',
        title: '커널 PCA',
        subtitle: 'Kernel PCA',
        icon: <Layers className="w-6 h-6" />,
        color: 'from-yellow-300 to-yellow-500',
        description: '비선형 차원 축소',
        isLeaf: true
      }
    ],
    ensemble: [
      {
        id: 'bagging',
        title: '배깅',
        subtitle: 'Bagging',
        icon: <Database className="w-6 h-6" />,
        color: 'from-orange-300 to-orange-500',
        description: '독립 모델 평균',
        isLeaf: true
      },
      {
        id: 'boosting',
        title: '부스팅',
        subtitle: 'Boosting',
        icon: <Zap className="w-6 h-6" />,
        color: 'from-red-300 to-red-500',
        description: '순차적 약한 학습기',
        isLeaf: true
      },
      {
        id: 'stacking',
        title: '스태킹',
        subtitle: 'Stacking',
        icon: <Layers className="w-6 h-6" />,
        color: 'from-pink-300 to-pink-500',
        description: '메타 모델 학습',
        isLeaf: true
      }
    ],
    'deep-networks': [
      {
        id: 'cnn',
        title: 'CNN',
        subtitle: '합성곱 신경망',
        icon: <Eye className="w-5 h-5" />,
        color: 'from-purple-200 to-purple-400',
        description: '이미지 처리 특화',
        isLeaf: true
      },
      {
        id: 'rnn-lstm',
        title: 'RNN/LSTM',
        subtitle: '순환/장단기 메모리',
        icon: <Zap className="w-5 h-5" />,
        color: 'from-indigo-200 to-indigo-400',
        description: '시계열 데이터 처리',
        isLeaf: true
      },
      {
        id: 'transformer',
        title: 'Transformer',
        subtitle: '트랜스포머',
        icon: <Brain className="w-5 h-5" />,
        color: 'from-blue-200 to-blue-400',
        description: '어텐션 메커니즘',
        isLeaf: true
      }
    ]
  };

  // 상세 정보
  const detailInfo = {
    supervised: {
      title: '지도학습 (Supervised Learning)',
      items: ['분류 (Classification)', '회귀 (Regression)'],
      description: '입력과 정답(레이블)이 함께 주어진 데이터로 학습합니다. 미리 정의된 정답을 통해 모델이 올바른 예측을 할 수 있도록 훈련됩니다.',
      characteristics: '정확도가 높고 해석이 용이하지만, 레이블된 데이터가 필요합니다.'
    },
    unsupervised: {
      title: '비지도학습 (Unsupervised Learning)', 
      items: ['군집화', '차원 축소', '밀도 추정'],
      description: '정답 없이 입력 데이터만으로 숨겨진 패턴이나 구조를 찾는 학습 방법입니다.',
      characteristics: '레이블이 없는 대량의 데이터에서 유용한 정보를 추출할 수 있습니다.'
    },
    reinforcement: {
      title: '강화학습 (Reinforcement Learning)',
      items: ['정책 학습', '가치 함수', 'Q-러닝'],
      description: '환경과의 상호작용을 통해 보상을 최대화하는 행동 전략을 학습합니다.',
      characteristics: '복잡한 의사결정 문제에 적합하지만 학습 시간이 오래 걸립니다.'
    },
    'semi-supervised': {
      title: '준지도학습 (Semi-supervised Learning)',
      items: ['라벨 전파', '자가 훈련', '공동 훈련'],
      description: '소량의 레이블된 데이터와 대량의 레이블되지 않은 데이터를 함께 사용합니다.',
      characteristics: '적은 레이블 데이터로도 좋은 성능을 달성할 수 있습니다.'
    },
    'self-supervised': {
      title: '자기지도학습 (Self-supervised Learning)',
      items: ['마스킹 언어 모델', '대조 학습', '예측 과제'],
      description: '데이터 자체에서 감독 신호를 생성하여 학습하는 방법입니다.',
      characteristics: '대량의 무레이블 데이터를 활용할 수 있습니다.'
    },
    classification: {
      title: '분류 (Classification)',
      items: ['이진 분류', '다중 클래스 분류', '다중 레이블 분류'],
      description: '입력 데이터를 미리 정의된 카테고리로 분류하는 문제입니다.',
      characteristics: '명확한 범주가 있는 문제에 적합합니다.'
    },
    regression: {
      title: '회귀 (Regression)',
      items: ['선형 회귀', '다항 회귀', '시계열 회귀'],
      description: '연속적인 수치값을 예측하는 문제입니다.',
      characteristics: '연속값 예측에 사용되며 예측값의 불확실성을 정량화할 수 있습니다.'
    },
    clustering: {
      title: '군집화 (Clustering)',
      items: ['K-means', '계층적 군집화', 'DBSCAN'],
      description: '유사한 특성을 가진 데이터들을 그룹으로 묶는 작업입니다.',
      characteristics: '데이터의 자연스러운 그룹을 발견할 수 있습니다.'
    },
    dimensionality: {
      title: '차원 축소 (Dimensionality Reduction)',
      items: ['PCA', 't-SNE', 'UMAP'],
      description: '고차원 데이터를 저차원으로 변환하면서 중요한 정보는 보존합니다.',
      characteristics: '시각화와 노이즈 제거에 유용합니다.'
    },
    density: {
      title: '밀도 추정 (Density Estimation)',
      items: ['가우시안 밀도 추정', '커널 밀도 추정'],
      description: '데이터의 확률 분포를 추정하는 작업입니다.',
      characteristics: '데이터 생성과 이상 탐지에 활용됩니다.'
    },
    detection: {
      title: '탐지 (Detection)',
      items: ['이상 탐지', '특이점 검출'],
      description: '정상 패턴에서 벗어나는 이상 상황을 찾아내는 문제입니다.',
      characteristics: '희귀한 사건을 찾는 것이므로 불균형 데이터 문제가 있습니다.'
    },
    generative: {
      title: '생성 모델링 (Generative Modeling)',
      items: ['GAN', 'VAE', '확산 모델'],
      description: '기존 데이터의 분포를 학습하여 새로운 데이터를 생성합니다.',
      characteristics: '창의적 응용이 가능하지만 학습이 복잡합니다.'
    },
    'linear-regression': {
      title: '선형 회귀 (Linear Regression)',
      items: ['최소제곱법', '정규화 회귀'],
      description: '입력과 출력 간의 선형 관계를 모델링합니다.',
      characteristics: '해석이 쉽고 계산이 빠릅니다.'
    },
    'logistic-regression': {
      title: '로지스틱 회귀 (Logistic Regression)',
      items: ['시그모이드 함수', '최대우도추정'],
      description: '선형 회귀를 분류 문제에 적용한 알고리즘입니다.',
      characteristics: '확률을 출력하며 이진 분류에 주로 사용됩니다.'
    },
    tree: {
      title: '트리 기반 모델 (Tree-based Models)',
      items: ['의사결정트리', '랜덤 포레스트', 'XGBoost'],
      description: '데이터를 트리 구조로 분할하여 예측합니다.',
      characteristics: '해석이 쉽고 전처리가 적게 필요합니다.'
    },
    'shallow-networks': {
      title: '얕은 신경망 (Shallow Networks)',
      items: ['퍼셉트론', '다층 퍼셉트론'],
      description: '은닉층이 1-2개인 기본적인 신경망입니다.',
      characteristics: '비선형 문제 해결이 가능하지만 복잡한 패턴 학습에는 한계가 있습니다.'
    },
    'naive-bayes': {
      title: '나이브 베이즈 (Naive Bayes)',
      items: ['가우시안 나이브 베이즈', '다항 나이브 베이즈'],
      description: '베이즈 정리를 기반으로 한 확률적 분류 알고리즘입니다.',
      characteristics: '텍스트 분류에 효과적이고 계산이 빠릅니다.'
    },
    'bayesian-networks': {
      title: '베이지안 네트워크 (Bayesian Networks)',
      items: ['조건부 확률', '인과 추론'],
      description: '변수 간의 확률적 관계를 그래프로 표현한 모델입니다.',
      characteristics: '불확실성 모델링에 사용됩니다.'
    },
    'gaussian-mixture': {
      title: '가우시안 혼합 모델 (Gaussian Mixture Models)',
      items: ['EM 알고리즘', '혼합 성분'],
      description: '여러 가우시안 분포의 혼합으로 데이터 분포를 모델링합니다.',
      characteristics: '군집화와 밀도 추정에 활용됩니다.'
    },
    svm: {
      title: 'SVM (Support Vector Machine)',
      items: ['서포트 벡터', '커널 트릭'],
      description: '마진을 최대화하는 결정 경계를 찾는 분류 알고리즘입니다.',
      characteristics: '고차원 데이터에 효과적입니다.'
    },
    'kernel-pca': {
      title: '커널 PCA (Kernel PCA)',
      items: ['커널 트릭', '비선형 변환'],
      description: '커널 트릭을 사용한 비선형 차원 축소 기법입니다.',
      characteristics: '비선형 관계를 포착할 수 있습니다.'
    },
    instance: {
      title: '사례 기반 방법 (Instance-based Methods)',
      items: ['k-NN', '지역 회귀'],
      description: '새로운 데이터를 기존 사례들과 비교하여 예측합니다.',
      characteristics: '구현이 간단하고 직관적입니다.'
    },
    bagging: {
      title: '배깅 (Bagging)',
      items: ['부트스트랩', '랜덤 포레스트'],
      description: '여러 모델을 독립적으로 학습시켜 평균내는 앙상블 기법입니다.',
      characteristics: '과적합 감소 효과가 있습니다.'
    },
    boosting: {
      title: '부스팅 (Boosting)',
      items: ['AdaBoost', 'Gradient Boosting'],
      description: '약한 학습기들을 순차적으로 학습시켜 강한 학습기를 만듭니다.',
      characteristics: '높은 성능을 달성할 수 있습니다.'
    },
    stacking: {
      title: '스태킹 (Stacking)',
      items: ['메타 학습기', '교차 검증'],
      description: '여러 모델의 예측을 입력으로 사용하는 메타 모델을 학습합니다.',
      characteristics: '매우 높은 성능을 달성할 수 있습니다.'
    },
    cnn: {
      title: 'CNN (합성곱 신경망)',
      items: ['합성곱층', '풀링층'],
      description: '이미지 처리에 특화된 딥러닝 모델입니다.',
      characteristics: '이미지 인식에서 뛰어난 성능을 보입니다.'
    },
    'rnn-lstm': {
      title: 'RNN/LSTM (순환 신경망)',
      items: ['순환 연결', '게이트 메커니즘'],
      description: '시계열 데이터와 순차 데이터 처리에 특화된 신경망입니다.',
      characteristics: '순차적 패턴 학습이 가능합니다.'
    },
    transformer: {
      title: 'Transformer (트랜스포머)',
      items: ['어텐션 메커니즘', '인코더-디코더'],
      description: '어텐션 메커니즘 기반의 모델로 현재 NLP의 주류입니다.',
      characteristics: '병렬 처리가 가능하고 긴 시퀀스를 잘 처리합니다.'
    }
  };

  const handleClick = (itemId) => {
    const currentData = getCurrentData();
    const item = currentData?.find(item => item.id === itemId);
    
    if (item?.isLeaf) {
      // 말단 노드인 경우 팝업 표시
      setPopupData(detailInfo[itemId]);
    } else {
      // 하위 항목이 있는 경우 경로에 추가
      setCurrentPath([...currentPath, itemId]);
    }
  };

  const goBack = () => {
    setCurrentPath(currentPath.slice(0, -1));
  };

  const closePopup = () => {
    setPopupData(null);
  };

  const getCurrentData = () => {
    if (currentPath.length === 0) {
      return Object.entries(mainData).map(([key, value]) => ({
        id: key,
        ...value,
        isLeaf: false
      }));
    }
    
    const lastPath = currentPath[currentPath.length - 1];
    return hierarchyData[lastPath] || [];
  };

  const getCurrentTitle = () => {
    if (currentPath.length === 0) {
      return "Machine Learning";
    }
    
    const lastPath = currentPath[currentPath.length - 1];
    
    // 메인 카테고리에서 찾기
    if (mainData[lastPath]) {
      return mainData[lastPath].title;
    }
    
    // 계층 데이터에서 찾기
    for (const items of Object.values(hierarchyData)) {
      const found = items.find(item => item.id === lastPath);
      if (found) {
        return found.title;
      }
    }
    
    return "Unknown";
  };

  const getCircleSize = (level) => {
    const sizes = ['w-64 h-64', 'w-48 h-48', 'w-40 h-40', 'w-32 h-32'];
    return sizes[Math.min(level, sizes.length - 1)];
  };

  const getIconSize = (level) => {
    if (level === 0) return "w-12 h-12";
    if (level === 1) return "w-8 h-8";
    if (level === 2) return "w-6 h-6";
    return "w-5 h-5";
  };

  const getPosition = (index, total) => {
    if (total === 1) {
      return { x: 0, y: 0 };
    }
    
    if (total === 2) {
      const x = index === 0 ? -120 : 120;
      return { x, y: 0 };
    }
    
    if (total === 3) {
      // 메인 화면과 동일한 배치 (0도, 120도, 240도)
      const angle = (index * 120) * (Math.PI / 180);
      const radius = 180;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };
    }
    
    if (total <= 6) {
      const angle = (index * (360 / total)) * (Math.PI / 180);
      const radius = total === 4 ? 200 : 220;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };
    }
    
    // 7개일 때는 중앙 1개 + 주변 6개
    if (total === 7) {
      if (index === 0) {
        return { x: 0, y: 0 };
      } else {
        const angle = ((index - 1) * 60) * (Math.PI / 180);
        const radius = 250;
        return {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        };
      }
    }
    
    // 8개 이상은 이중 원
    const innerCount = Math.ceil(total / 2);
    if (index < innerCount) {
      const angle = (index * (360 / innerCount)) * (Math.PI / 180);
      return {
        x: Math.cos(angle) * 180,
        y: Math.sin(angle) * 180
      };
    } else {
      const outerCount = total - innerCount;
      const angle = ((index - innerCount) * (360 / outerCount)) * (Math.PI / 180);
      return {
        x: Math.cos(angle) * 300,
        y: Math.sin(angle) * 300
      };
    }
  };

  const currentData = getCurrentData();
  const currentTitle = getCurrentTitle();
  const level = currentPath.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <Database className="w-10 h-10 text-white" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Machine Learning
            </h1>
          </div>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            머신러닝의 전체 분류 체계를 인터랙티브하게 탐험해보세요
          </p>
        </div>

        {/* Back Button */}
        {currentPath.length > 0 && (
          <button
            onClick={goBack}
            className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>뒤로 가기</span>
          </button>
        )}

        {/* Current Level Title */}
        {currentPath.length > 0 && (
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">{currentTitle}</h2>
          </div>
        )}

        {/* Circles */}
        <div className="relative w-full h-[700px] flex items-center justify-center">
          {currentData.map((item, index) => {
            const position = getPosition(index, currentData.length);
            const circleSize = getCircleSize(level);
            const iconSize = getIconSize(level);
            
            return (
              <div
                key={item.id}
                onClick={() => handleClick(item.id)}
                className="absolute cursor-pointer transform transition-all duration-300 hover:scale-110"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px)`,
                }}
              >
                <div className={`bg-gradient-to-br ${item.color} rounded-full ${circleSize} flex flex-col items-center justify-center text-center shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-white/20 relative`}>
                  {!item.isLeaf && (
                    <div className="absolute top-3 right-3 bg-white/20 rounded-full p-1">
                      <Layers className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`text-white mb-3`}>
                    <div className={iconSize}>
                      {item.icon}
                    </div>
                  </div>
                  <h3 className={`font-bold text-white mb-2 ${level === 0 ? 'text-xl' : level === 1 ? 'text-base' : 'text-sm'}`}>
                    {item.title}
                  </h3>
                  <p className={`text-white/80 mb-2 ${level === 0 ? 'text-sm' : 'text-xs'}`}>
                    {item.subtitle}
                  </p>
                  <p className={`text-white/70 leading-relaxed px-4 ${level === 0 ? 'text-sm' : 'text-xs'}`}>
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-400 mt-8">
          <p>원형 도형을 클릭하여 더 자세한 내용을 탐험해보세요</p>
          <p className="text-sm mt-2">
            <Layers className="w-4 h-4 inline mr-1" />
            아이콘이 있는 항목은 추가 하위 분류가 있습니다
          </p>
        </div>

        {/* Popup Modal */}
        {popupData && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">{popupData.title}</h2>
                  <button
                    onClick={closePopup}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                  {popupData.description}
                </p>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">주요 기법</h3>
                  <div className="space-y-2">
                    {popupData.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                        <span className="text-gray-700 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">특징</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {popupData.characteristics}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MachineLearningInfographic;