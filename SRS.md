# SRS — "몇 분이나 됐지?" Meeting Cost Timer

> 작성일: 2026-04-07
> 기반 문서: office-hours 디자인 문서, DESIGN.md, plan-ceo-review

---

## 1. 개요

회의 시간이 길어질수록 실시간으로 비용을 보여주는 웹앱.
택시 미터기처럼 돈이 올라가는 시각적 긴장감이 핵심 경험.
GitHub 포트폴리오용 데모 프로젝트.

## 2. 기술 스택 및 제약

- 바닐라 JS (ES5, IIFE 패턴) + CSS3 + HTML5
- localStorage (백엔드 없음)
- file:// 프로토콜 호환 (로컬에서 바로 열기)
- 외부 CDN 없음 (Odometer.js는 vendor/ 폴더에 벤더링)
- 빌드 도구 없음
- 전역 네임스페이스: `MeetingCost` 단일 객체
- XSS 방지: textContent only, innerHTML 사용 금지

## 3. 파일 구조

```
index.html
css/
  style.css
  odometer-theme.css
js/
  app.js          — 초기화, 탭 라우팅, 이벤트 바인딩
  timer.js        — 타이머 엔진 (Date.now 기반)
  cost.js         — 비용 계산 + 오도미터 연동
  emotion.js      — 감정 단계 상태머신
  comparisons.js  — 재미 비교 데이터 + 표시 로직
  settings.js     — 설정 관리 (참석자, 시급, 통화)
  history.js      — 히스토리 CRUD
  stats.js        — 통계 + Canvas 스파크라인
  storage.js      — localStorage 래퍼 (try/catch)
vendor/
  odometer.min.js — Odometer.js (MIT, 벤더링)
```

Script 로딩 순서:
`vendor/odometer.min.js → storage.js → timer.js → cost.js → emotion.js → comparisons.js → settings.js → history.js → stats.js → app.js`

---

## 4. 기능 요구사항 (FR)

### 4.1 타이머 (Timer)

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-01 | 시작 버튼을 누르면 타이머가 시작된다 | P1 |
| FR-02 | 일시정지 버튼을 누르면 타이머가 멈추고, 다시 누르면 이어서 진행한다 | P1 |
| FR-03 | 리셋 버튼을 누르면 타이머가 0으로 초기화된다 | P1 |
| FR-04 | 경과 시간은 HH:MM:SS 형식으로 표시된다 (JetBrains Mono, tabular-nums) | P1 |
| FR-05 | 타이머는 Date.now() 기반으로 동작하여 탭 비활성 시에도 정확한 시간을 유지한다 | P1 |
| FR-06 | 타이머 실행 중 시작 버튼을 다시 누르면 무시된다 (double-click 방지) | P1 |

### 4.2 비용 계산 (Cost)

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-07 | 비용 = 참석자 수 × (시급 ÷ 3600) × 경과 초, 실시간 업데이트 | P1 |
| FR-08 | 비용은 오도미터 스타일 숫자 스피닝 애니메이션으로 표시된다 (Odometer.js) | P1 |
| FR-09 | 비용 표시 형식: 통화 기호 + 천단위 콤마 (예: ₩548,600) | P1 |
| FR-10 | ₩10,000,000 이상일 때 폰트 크기가 자동 축소된다 (반응형) | P2 |

### 4.3 감정 단계 (Emotion Stage)

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-11 | 경과 시간에 따라 4단계로 UI가 변화한다 | P1 |
| FR-12 | 0~15분: 초록(#3FB950), 😌, "순조롭습니다" | P1 |
| FR-13 | 15~30분: 노랑(#D29922), 😐, "슬슬 길어지네요" | P1 |
| FR-14 | 30~60분: 주황(#DB6D28), 😰, "이쯤이면..." | P1 |
| FR-15 | 60분+: 빨강(#F85149), 🔥, "회의의 늪" | P1 |
| FR-16 | 단계 전환 시 배경색이 CSS transition(300ms)으로 부드럽게 변한다 | P1 |
| FR-17 | 단계 인디케이터 도트(4개)가 현재 단계를 표시한다 (활성 도트에 glow) | P2 |
| FR-18 | 임계값은 고정이다 (사용자 설정 불가) | P1 |

### 4.4 재미 비교 (Fun Comparisons)

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-19 | 하드코딩된 15~20개 비교 항목 배열이 있다 (예: {name:"커피", cost:5000, emoji:"☕"}) | P1 |
| FR-20 | 비용이 비교 항목의 가격을 넘을 때마다 새 항목이 슬라이드인으로 등장한다 | P1 |
| FR-21 | 타이머 아래 단일 카드로 표시된다. "이 회의 비용 = 커피 3잔 ☕" 형식 | P1 |

### 4.5 설정 (Settings)

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-22 | 참석자 수를 설정할 수 있다 (기본값: 5, 범위: 1~100) | P1 |
| FR-23 | 평균 시급을 설정할 수 있다 (기본값: ₩35,000, 범위: 1 이상 양수) | P1 |
| FR-24 | 통화를 선택할 수 있다 (₩/$/€, 기본값: ₩) | P2 |
| FR-25 | 설정은 localStorage에 자동 저장되고, 다음 방문 시 복원된다 | P1 |
| FR-26 | 잘못된 입력(음수, NaN, 빈값)은 거부되고 빨간 테두리 + 메시지로 피드백한다 | P1 |

### 4.6 히스토리 (History)

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-27 | 타이머 정지 시 회의 기록이 자동 저장된다 (날짜, 경과시간, 참석자 수, 총 비용) | P1 |
| FR-28 | 히스토리 탭에서 과거 회의 목록을 날짜순(최신 먼저)으로 조회할 수 있다 | P1 |
| FR-29 | 각 히스토리 항목은 비용에 따라 감정 단계 색상으로 표시된다 | P2 |
| FR-30 | 히스토리가 0건이면 빈 상태 메시지를 표시한다 ("아직 회의 기록이 없습니다") | P1 |

### 4.7 통계 (Stats)

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-31 | 통계 탭에서 요약 수치를 표시한다: 총 회의 수, 총 비용, 평균 회의 시간, 평균 비용 | P1 |
| FR-32 | Canvas 스파크라인으로 최근 회의 비용 추이를 표시한다 (x: 회의 인덱스, y: 비용) | P2 |
| FR-33 | 데이터가 1건이면 점 하나로 표시, 0건이면 빈 상태 메시지 | P2 |

### 4.8 탭 네비게이션

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-34 | 하단 탭으로 Timer / History / Stats 화면을 전환한다 | P1 |
| FR-35 | 활성 탭은 액센트 색상 + 하단 인디케이터로 구분된다 | P1 |
| FR-36 | 탭 전환 시 타이머 상태가 유지된다 (다른 탭 갔다가 돌아와도 계속 카운트) | P1 |

### 4.9 다크모드

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-37 | 다크모드가 기본값이다 | P1 |
| FR-38 | 토글 버튼으로 라이트/다크모드를 전환할 수 있다 | P1 |
| FR-39 | 테마 선택은 localStorage에 저장되고 다음 방문 시 복원된다 | P2 |

---

## 5. 비기능 요구사항 (NFR)

### 5.1 디자인 (NFR-UI)

| ID | 요구사항 |
|----|---------|
| NFR-UI-01 | 모든 시각적 결정은 DESIGN.md를 따른다 |
| NFR-UI-02 | 폰트: Display=Geist, Body=DM Sans, Data=JetBrains Mono |
| NFR-UI-03 | 색상: 배경=#0D1117, 서피스=#161B22, 액센트=#FF6B35 |
| NFR-UI-04 | 스페이싱: 8px 기반, comfortable 밀도 |
| NFR-UI-05 | 모션: 오도미터 스핀, 색상 전환 300ms, 비교 슬라이드인 300ms |

### 5.2 호환성 (NFR-COMPAT)

| ID | 요구사항 |
|----|---------|
| NFR-COMPAT-01 | file:// 프로토콜에서 정상 동작한다 |
| NFR-COMPAT-02 | Chrome, Firefox, Edge 최신 버전 지원 |
| NFR-COMPAT-03 | 모바일(360px~) / 데스크톱(~1920px) 반응형 |

### 5.3 데이터 (NFR-DATA)

| ID | 요구사항 |
|----|---------|
| NFR-DATA-01 | localStorage 쓰기는 try/catch로 감싸고, 실패 시 사용자에게 알린다 |
| NFR-DATA-02 | localStorage quota 초과 시 가장 오래된 히스토리를 삭제한다 |
| NFR-DATA-03 | 손상된 JSON은 초기값으로 리셋하고 "데이터 복구됨" 알림을 표시한다 |

### 5.4 보안 (NFR-SEC)

| ID | 요구사항 |
|----|---------|
| NFR-SEC-01 | DOM 조작은 textContent만 사용한다. innerHTML 사용 금지. |
| NFR-SEC-02 | 사용자 입력은 숫자 범위 검증 후 사용한다 |

### 5.5 코드 품질 (NFR-CODE)

| ID | 요구사항 |
|----|---------|
| NFR-CODE-01 | IIFE 패턴 + MeetingCost 전역 객체로 네임스페이스 관리 |
| NFR-CODE-02 | script 로딩 순서를 index.html에 명시적으로 기술 |
| NFR-CODE-03 | 각 모듈은 단일 책임 원칙을 따른다 |

---

## 6. NOT in scope

- Wall-of-shame 리더보드
- 스크린샷 카드 내보내기 (Canvas-to-PNG)
- 소리 효과
- 실시간 다인원 회의 공유
- 회의록 자동 생성
- 직급별 차등 시급
- 자동화 테스트 프레임워크 (수동 QA로 대체)

---

## 7. Spike (구현 전 검증)

| ID | 내용 | 판단 기준 |
|----|------|----------|
| SPIKE-01 | Odometer.js가 file://에서 정상 렌더링되는지 확인 (Chrome, Firefox) | 렌더링 OK → 벤더링 진행. 실패 → CSS-only 오도미터 직접 구현 |

---

## 8. 비교 항목 데이터 (참고)

```javascript
// comparisons.js에 하드코딩
[
  { name: "자판기 커피", cost: 500, emoji: "☕" },
  { name: "편의점 삼각김밥", cost: 1200, emoji: "🍙" },
  { name: "아메리카노", cost: 4500, emoji: "☕" },
  { name: "점심 김치찌개", cost: 8000, emoji: "🍲" },
  { name: "치킨 한 마리", cost: 20000, emoji: "🍗" },
  { name: "피자 한 판", cost: 25000, emoji: "🍕" },
  { name: "영화 티켓", cost: 15000, emoji: "🎬" },
  { name: "택시 기본요금", cost: 4800, emoji: "🚕" },
  { name: "스타벅스 텀블러", cost: 35000, emoji: "🥤" },
  { name: "에어팟", cost: 250000, emoji: "🎧" },
  { name: "닌텐도 스위치", cost: 360000, emoji: "🎮" },
  { name: "제주도 왕복 항공권", cost: 150000, emoji: "✈️" },
  { name: "아이패드", cost: 600000, emoji: "📱" },
  { name: "맥북 에어", cost: 1500000, emoji: "💻" },
  { name: "하와이 여행", cost: 3000000, emoji: "🏝️" }
]
```

---

## 9. localStorage 스키마

```javascript
// key: "meetingcost_settings"
{
  attendees: 5,           // number, 1~100
  hourlyRate: 35000,      // number, 1 이상
  currency: "₩",          // string, "₩" | "$" | "€"
  theme: "dark"           // string, "dark" | "light"
}

// key: "meetingcost_history"
[
  {
    id: "1712456789000",  // timestamp string
    date: "2026-04-07",
    duration: 2827,       // seconds
    attendees: 8,
    hourlyRate: 35000,
    totalCost: 548600,
    currency: "₩"
  }
]
```
