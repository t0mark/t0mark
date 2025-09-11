// 캘린더 관련 전역 변수
let currentDate = new Date();
let calendarData = null;
let htmlTemplates = {};

// 월 이름 배열
const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', async function() {
    await loadHtmlTemplates();
    await loadCalendarData();
    initializeCalendar();
    setupEventListeners();
    initializeScrollProgress();
});

// HTML 템플릿 로드
async function loadHtmlTemplates() {
    const templates = [
        'dday-card', 'category', 'item', 
        'progress-bar', 'calendar-day'
    ];
    
    for (const template of templates) {
        try {
            const response = await fetch(`partials/calendar/${template}.html?t=${Date.now()}`);
            htmlTemplates[template] = await response.text();
        } catch (error) {
            console.error(`Error loading template ${template}:`, error);
        }
    }
}

// YAML 데이터 로드
async function loadCalendarData() {
    try {
        const response = await fetch(`data/calendar/calendar-data.yaml?t=${Date.now()}`);
        const yamlText = await response.text();
        calendarData = jsyaml.load(yamlText);
        
        renderDDayCards();
        renderTasks();
        renderProgressBars();
        renderTodoList();
    } catch (error) {
        console.error('Error loading calendar data:', error);
    }
}

// D-DAY 카드 렌더링
function renderDDayCards() {
    const container = document.getElementById('ddayCards');
    if (!calendarData || !calendarData.dDay) return;

    container.innerHTML = '';
    
    let currentRow = null;
    let cardsInCurrentRow = 0;
    
    Object.entries(calendarData.dDay).forEach(([key, data]) => {
        const targetDate = new Date(data.targetDate);
        const today = new Date();
        const diffTime = targetDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (cardsInCurrentRow === 0) {
            currentRow = document.createElement('div');
            currentRow.className = 'dday-row';
            container.appendChild(currentRow);
        }

        const card = document.createElement('div');
        card.className = 'dday-card';
        card.innerHTML = htmlTemplates['dday-card']
            .replace('{{diffDays}}', diffDays)
            .replace('{{key}}', key);
        currentRow.appendChild(card);
        
        cardsInCurrentRow++;
        if (cardsInCurrentRow >= 2) {
            cardsInCurrentRow = 0;
        }
    });
}

// 작업 목록 렌더링
function renderTasks() {
    const container = document.getElementById('tasksList');
    if (!calendarData || !calendarData.tasks) return;

    container.innerHTML = '';

    Object.entries(calendarData.tasks).forEach(([categoryName, taskData]) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'task-category';

        const icon = taskData.icon;
        
        categoryDiv.innerHTML = htmlTemplates['category']
            .replace('{{icon}}', icon)
            .replace('{{categoryName}}', categoryName);

        const tasksList = document.createElement('div');
        taskData.items.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = 'task-item';
            taskItem.innerHTML = htmlTemplates['item']
                .replace('{{item}}', task);
            tasksList.appendChild(taskItem);
        });

        categoryDiv.appendChild(tasksList);
        container.appendChild(categoryDiv);
    });
}

// 실시간 진행률 계산 및 렌더링
function renderProgressBars() {
    const container = document.getElementById('progressBars');
    container.innerHTML = '';

    const now = new Date();
    const progressData = calculateTimeProgress(now);

    const progressItems = [
        { key: 'year', label: 'Year', value: progressData.year },
        { key: 'month', label: 'Month', value: progressData.month },
        { key: 'week', label: 'Week', value: progressData.week },
        { key: 'day', label: 'Day', value: progressData.day }
    ];

    progressItems.forEach(item => {
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        
        const percentage = Math.round(item.value * 100);
        
        progressBar.innerHTML = htmlTemplates['progress-bar']
            .replace(/{{percentage}}/g, percentage)
            .replace('{{label}}', item.label);
        
        container.appendChild(progressBar);
    });
}

// 시간 진행률 계산 함수
function calculateTimeProgress(now) {
    // 연도 진행률
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
    const yearProgress = (now - yearStart) / (yearEnd - yearStart);

    // 월 진행률
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthProgress = (now - monthStart) / (monthEnd - monthStart);

    // 주 진행률 (월요일 기준)
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // 일요일을 7로 처리
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const weekProgress = (now - weekStart) / (weekEnd - weekStart);

    // 일 진행률
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const dayProgress = (now - dayStart) / (dayEnd - dayStart);

    return {
        year: Math.max(0, Math.min(1, yearProgress)),
        month: Math.max(0, Math.min(1, monthProgress)),
        week: Math.max(0, Math.min(1, weekProgress)),
        day: Math.max(0, Math.min(1, dayProgress))
    };
}

// TO DO 목록 렌더링
function renderTodoList() {
    const container = document.getElementById('todoList');
    if (!calendarData || !calendarData.todos) return;

    container.innerHTML = '';

    Object.entries(calendarData.todos).forEach(([categoryName, todoData]) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'todo-category';

        const icon = todoData.icon || '';

        categoryDiv.innerHTML = htmlTemplates['category']
            .replace('{{icon}}', icon)
            .replace('{{categoryName}}', categoryName);

        const itemsList = document.createElement('div');
        todoData.items.forEach(item => {
            const todoItem = document.createElement('div');
            todoItem.className = 'todo-item';
            
            todoItem.innerHTML = htmlTemplates['item']
                .replace('{{item}}', item);
            itemsList.appendChild(todoItem);
        });

        categoryDiv.appendChild(itemsList);
        container.appendChild(categoryDiv);
    });
}

// 캘린더 초기화
function initializeCalendar() {
    renderCalendar();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const todayBtn = document.getElementById('todayBtn');

    prevBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar();
    });
}

// 캘린더 렌더링
function renderCalendar() {
    const monthElement = document.getElementById('currentMonth');
    const yearElement = document.getElementById('currentYear');
    const gridElement = document.getElementById('calendarGrid');

    // 현재 월/연도 표시 업데이트
    monthElement.textContent = monthNames[currentDate.getMonth()];
    yearElement.textContent = currentDate.getFullYear();

    // 캘린더 그리드 생성
    gridElement.innerHTML = '';

    // 요일 헤더 생성
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = day;
        gridElement.appendChild(dayHeader);
    });

    // 달력 날짜 생성
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    // 이전 달의 마지막 날들
    const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.innerHTML = htmlTemplates['calendar-day']
            .replace('{{day}}', prevMonthLastDay - i);
        gridElement.appendChild(dayElement);
    }

    // 현재 달의 날들
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        if (currentDay.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }

        dayElement.innerHTML = htmlTemplates['calendar-day']
            .replace('{{day}}', day);
        
        // 샘플 이벤트 추가 (실제로는 Google Calendar API에서 가져와야 함)
        if (day === 11) {
            const event = document.createElement('div');
            event.className = 'calendar-event';
            event.textContent = '정처기 필기 설명회';
            dayElement.appendChild(event);
        }
        if (day === 15) {
            const event = document.createElement('div');
            event.className = 'calendar-event';
            event.textContent = '연구실 과제 시작';
            dayElement.appendChild(event);
        }
        if (day === 18) {
            const event = document.createElement('div');
            event.className = 'calendar-event';
            event.textContent = '14회 TOPCIT';
            dayElement.appendChild(event);
        }
        if (day === 21) {
            const event = document.createElement('div');
            event.className = 'calendar-event';
            event.textContent = '1차 정처기 시험';
            dayElement.appendChild(event);
        }

        gridElement.appendChild(dayElement);
    }

    // 다음 달의 첫 날들
    const totalCells = gridElement.children.length;
    const remainingCells = 42 - totalCells + 7; // 7은 헤더 행
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.innerHTML = htmlTemplates['calendar-day']
            .replace('{{day}}', day);
        gridElement.appendChild(dayElement);
    }
}

// 페이지 스크롤 진행률 바 초기화
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