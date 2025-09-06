// 공유 네비게이션 바를 로드하고 현재 페이지에 맞는 활성 링크를 설정
(function () {
  // 현재 페이지에 해당하는 네비게이션 링크에 active 클래스를 추가
  function setActiveLink(root) {
    try {
      var path = window.location.pathname.split('/').pop();
      if (!path || path === '/') path = 'index.html';
      var selector = 'a.nav-link[href$="' + path + '"]';
      var link = root.querySelector(selector);
      if (link) link.classList.add('active');
    } catch (_) {}
  }

  // 네비게이션 바 HTML을 DOM에 삽입하고 활성 링크 설정
  function inject(html) {
    var container = document.getElementById('navbar');
    if (!container) return;
    container.innerHTML = html;
    setActiveLink(container);
    setupMobileMenu(container);
    try {
      document.dispatchEvent(new CustomEvent('navbar:ready'));
    } catch (_) {}
  }

  // 모바일 메뉴 설정
  function setupMobileMenu(container) {
    var menuBtn = container.querySelector('.mobile-menu-btn');
    var navMenu = container.querySelector('.nav-menu');
    
    if (!menuBtn || !navMenu) return;

    // 메뉴 토글 함수
    function toggleMenu() {
      var isActive = menuBtn.classList.contains('active');
      
      if (isActive) {
        menuBtn.classList.remove('active');
        navMenu.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
      } else {
        menuBtn.classList.add('active');
        navMenu.classList.add('active');
        menuBtn.setAttribute('aria-expanded', 'true');
      }
    }

    // 클릭 이벤트
    menuBtn.addEventListener('click', toggleMenu);

    // 키보드 이벤트 (Enter, Space)
    menuBtn.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMenu();
      }
    });

    // 메뉴 링크 클릭 시 모바일 메뉴 닫기
    var navLinks = container.querySelectorAll('.nav-link');
    for (var i = 0; i < navLinks.length; i++) {
      navLinks[i].addEventListener('click', function() {
        if (window.innerWidth <= 768) {
          menuBtn.classList.remove('active');
          navMenu.classList.remove('active');
          menuBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // 창 크기 변경 시 메뉴 상태 초기화
    window.addEventListener('resize', function() {
      if (window.innerWidth > 768) {
        menuBtn.classList.remove('active');
        navMenu.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // ESC 키로 메뉴 닫기
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        menuBtn.classList.remove('active');
        navMenu.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }

  // 서버에서 실행될 때는 fetch를 우선 사용하고, 실패하면 인라인 템플릿으로 대체
  var partialUrl = 'partials/navbar.html';
  fetch(partialUrl)
    .then(function (res) { return res.text(); })
    .then(inject)
    .catch(function () {
      // fetch가 실패하면 (예: file:// 프로토콜) 최소한의 대체 네비게이션 바 사용
      var fallback = '<header class="top-nav">\n'
        + '  <nav class="nav-container" role="navigation" aria-label="메인 네비게이션">\n'
        + '    <button class="mobile-menu-btn" aria-label="메뉴 열기/닫기" aria-expanded="false">\n'
        + '      <span class="hamburger-line"></span>\n'
        + '      <span class="hamburger-line"></span>\n'
        + '      <span class="hamburger-line"></span>\n'
        + '    </button>\n'
        + '    <div class="nav-menu">\n'
        + '      <div class="nav-links">\n'
        + '        <a href="index.html" class="nav-link">Home</a>\n'
        + '        <a href="posts.html" class="nav-link">Post</a>\n'
        + '        <a href="projects.html" class="nav-link">Project</a>\n'
        + '        <a href="graduate.html" class="nav-link">Graduate</a>\n'
        + '        <a href="cv.html" class="nav-link">CV</a>\n'
        + '      </div>\n'
        + '      <div class="social-nav" role="list" aria-label="소셜 링크">\n'
        + '        <a href="https://solved.ac/profile/gusdnd5297#" class="social-nav-link" aria-label="백준 프로필">\n'
        + '          <img src="images/boj-icon.png" alt="백준">\n'
        + '        </a>\n'
        + '        <a href="https://github.com/t0mark" class="social-nav-link" aria-label="GitHub 프로필">\n'
        + '          <img src="images/github_icon.png" alt="GitHub">\n'
        + '        </a>\n'
        + '        <a href="mailto:iwagoho@gmail.com" class="social-nav-link" aria-label="이메일 보내기">\n'
        + '          <img src="images/Gmail_icon.svg" alt="Gmail">\n'
        + '        </a>\n'
        + '        <a href="https://www.linkedin.com/in/%ED%98%84%EC%9B%85-%EC%96%91-531931339/" target="_blank" class="social-nav-link" aria-label="LinkedIn 프로필">\n'
        + '          <img src="images/LinkedIn_icon.svg" alt="LinkedIn">\n'
        + '        </a>\n'
        + '      </div>\n'
        + '    </div>\n'
        + '  </nav>\n'
        + '</header>';
      inject(fallback);
    });
})();
