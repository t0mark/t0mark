// 캘린더 관련 전역 변수
let currentDate = new Date();
let calendarData = null;
let htmlTemplates = {};

// Google Calendar API 설정
const GOOGLE_API_KEY = 'AIzaSyCucfjhj-WTaApAEE3kRrNvnsCaS_VgZdg';
const CALENDAR_ID = 'a96536009@gmail.com'; // 공개 캘린더 ID
let googleCalendarEvents = [];

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
    await loadGoogleCalendarEvents();
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

// Google Calendar 이벤트 로드
async function loadGoogleCalendarEvents() {
    try {
        const timeMin = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
        const timeMax = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
        
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?` +
            `key=${GOOGLE_API_KEY}&` +
            `timeMin=${timeMin}&` +
            `timeMax=${timeMax}&` +
            `singleEvents=true&` +
            `orderBy=startTime`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        googleCalendarEvents = data.items || [];
        console.log('Google Calendar events loaded:', googleCalendarEvents.length);
    } catch (error) {
        console.error('Error loading Google Calendar events:', error);
        googleCalendarEvents = [];
    }
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

    prevBtn.addEventListener('click', async () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        await loadGoogleCalendarEvents();
        renderCalendar();
    });

    nextBtn.addEventListener('click', async () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        await loadGoogleCalendarEvents();
        renderCalendar();
    });

    todayBtn.addEventListener('click', async () => {
        currentDate = new Date();
        await loadGoogleCalendarEvents();
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
        
        // 기존 방식의 이벤트 표시는 제거 (Grid Span으로 통합)

        gridElement.appendChild(dayElement);
    }
    
    // 이벤트 레이어 추가
    const eventsLayer = document.createElement('div');
    eventsLayer.className = 'calendar-events-layer';
    eventsLayer.id = 'calendarEventsLayer';
    gridElement.appendChild(eventsLayer);
    
    // Grid Span 이벤트 렌더링
    renderGridEvents();
    
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

// 특정 날짜의 이벤트 가져오기
function getEventsForDay(date) {
    return googleCalendarEvents.filter(event => {
        return isEventOnDate(event, date);
    });
}

// 이벤트 날짜 추출
function getEventDate(event) {
    if (event.start?.date) {
        // 종일 이벤트
        return new Date(event.start.date + 'T00:00:00');
    } else if (event.start?.dateTime) {
        // 시간 지정 이벤트
        return new Date(event.start.dateTime);
    }
    return null;
}

// 같은 날인지 확인
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

// 이벤트가 특정 날짜에 해당하는지 확인
function isEventOnDate(event, targetDate) {
    let startDate, endDate;
    
    if (event.start?.date && event.end?.date) {
        // 종일 이벤트
        startDate = new Date(event.start.date + 'T00:00:00');
        endDate = new Date(event.end.date + 'T00:00:00');
        // Google Calendar의 종일 이벤트 endDate는 다음날 00:00이므로 1일 빼기
        endDate.setDate(endDate.getDate() - 1);
    } else if (event.start?.dateTime && event.end?.dateTime) {
        // 시간 지정 이벤트
        startDate = new Date(event.start.dateTime);
        endDate = new Date(event.end.dateTime);
    } else {
        return false;
    }
    
    // targetDate가 startDate와 endDate 사이에 있는지 확인
    const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const eventStartDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const eventEndDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    return targetDay >= eventStartDay && targetDay <= eventEndDay;
}

// 이벤트의 위치 확인 (시작/중간/끝/단일)
function getEventPosition(event, targetDate) {
    let startDate, endDate;
    
    if (event.start?.date && event.end?.date) {
        startDate = new Date(event.start.date + 'T00:00:00');
        endDate = new Date(event.end.date + 'T00:00:00');
        endDate.setDate(endDate.getDate() - 1);
    } else if (event.start?.dateTime && event.end?.dateTime) {
        startDate = new Date(event.start.dateTime);
        endDate = new Date(event.end.dateTime);
    } else {
        return 'single';
    }
    
    const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const eventStartDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const eventEndDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    if (eventStartDay.getTime() === eventEndDay.getTime()) {
        return 'single';
    } else if (targetDay.getTime() === eventStartDay.getTime()) {
        return 'start';
    } else if (targetDay.getTime() === eventEndDay.getTime()) {
        return 'end';
    } else {
        return 'middle';
    }
}

// 이벤트 시간 포맷팅
function formatEventTime(event) {
    if (event.start?.date) {
        return '종일';
    } else if (event.start?.dateTime) {
        const startTime = new Date(event.start.dateTime);
        return startTime.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        });
    }
    return '';
}

// Grid Span 이벤트 렌더링
function renderGridEvents() {
    const eventsLayer = document.getElementById('calendarEventsLayer');
    if (!eventsLayer) return;
    
    // 기존 이벤트 제거
    eventsLayer.innerHTML = '';
    
    // 모든 이벤트를 처리해서 그리드 위치 계산
    const eventPlacements = calculateEventPlacements();
    
    eventPlacements.forEach(placement => {
        createGridEvent(placement);
    });
}

// 이벤트의 그리드 위치 계산
function calculateEventPlacements() {
    const placements = [];
    const eventsByPosition = {}; // 위치별 이벤트 그룹핑
    
    googleCalendarEvents.forEach(event => {
        let startDate, endDate;
        
        if (event.start?.date && event.end?.date) {
            startDate = new Date(event.start.date + 'T00:00:00');
            endDate = new Date(event.end.date + 'T00:00:00');
            endDate.setDate(endDate.getDate() - 1);
        } else if (event.start?.dateTime && event.end?.dateTime) {
            startDate = new Date(event.start.dateTime);
            endDate = new Date(event.end.dateTime);
        } else {
            return;
        }
        
        // 현재 월에 포함되는 부분만 계산
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        const displayStartDate = new Date(Math.max(startDate.getTime(), monthStart.getTime()));
        const displayEndDate = new Date(Math.min(endDate.getTime(), monthEnd.getTime()));
        
        // 그리드 위치 계산
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const firstDayOfWeek = firstDayOfMonth.getDay();
        
        const startDay = displayStartDate.getDate();
        const endDay = displayEndDate.getDate();
        
        const startGridPos = firstDayOfWeek + startDay - 1;
        const endGridPos = firstDayOfWeek + endDay - 1;
        
        const startRow = Math.floor(startGridPos / 7) + 1; // +1 for header row
        const startCol = (startGridPos % 7) + 1;
        const span = endGridPos - startGridPos + 1;
        
        // 주 경계를 넘어가는 경우 분할
        const maxSpanInRow = 7 - startCol + 1;
        const actualSpan = Math.min(span, maxSpanInRow);
        
        const isMultiDay = startDate.getTime() !== endDate.getTime();
        
        // 위치 키 생성 (row + col + span 조합)
        const positionKey = `${startRow}-${startCol}-${actualSpan}`;
        
        if (!eventsByPosition[positionKey]) {
            eventsByPosition[positionKey] = [];
        }
        
        eventsByPosition[positionKey].push({
            event: event,
            row: startRow,
            col: startCol,
            span: actualSpan,
            isMultiDay: isMultiDay
        });
    });
    
    // 같은 위치의 이벤트들을 층별로 배치
    Object.values(eventsByPosition).forEach(positionEvents => {
        positionEvents.forEach((placement, index) => {
            placement.layer = index; // 층 번호 추가
            placements.push(placement);
        });
    });
    
    return placements;
}

// Grid Event 생성
function createGridEvent(placement) {
    const eventsLayer = document.getElementById('calendarEventsLayer');
    if (!eventsLayer) return;
    
    const eventElement = document.createElement('div');
    eventElement.className = `grid-event${placement.isMultiDay ? ' multi-day' : ''}`;
    eventElement.textContent = placement.event.summary || '(제목 없음)';
    eventElement.title = `${placement.event.summary}\n${formatEventTime(placement.event)}`;
    
    // Grid 위치 설정
    eventElement.style.gridRow = placement.row;
    eventElement.style.gridColumn = `${placement.col} / span ${placement.span}`;
    
    // 층별 배치 (Y축 오프셋)
    if (placement.layer > 0) {
        eventElement.style.marginTop = `${22 + (placement.layer * 18)}px`;
    }
    
    eventsLayer.appendChild(eventElement);
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