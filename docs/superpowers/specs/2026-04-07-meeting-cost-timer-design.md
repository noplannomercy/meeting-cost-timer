# Spec: "몇 분이나 됐지?" Meeting Cost Timer

> Date: 2026-04-07
> Status: DRAFT
> Sources: SRS.md, DESIGN.md, office-hours design doc, plan-ceo-review

---

## Overview

회의 시간이 길어질수록 실시간 비용을 보여주는 웹앱.
택시 미터기처럼 돈이 올라가는 시각적 긴장감이 핵심.
GitHub 포트폴리오용 데모.

## Architecture

### Stack
- 바닐라 JS (ES5, IIFE 패턴)
- CSS3 + CSS Custom Properties (테마)
- HTML5 Canvas (스파크라인)
- localStorage (persistence)
- Odometer.js (벤더링, MIT)

### Global Namespace
단일 전역 객체 `MeetingCost`에 모든 모듈을 등록.

```javascript
var MeetingCost = MeetingCost || {};
// Each module: MeetingCost.Timer, MeetingCost.Cost, etc.
```

### File Structure
```
index.html
css/
  style.css              — 레이아웃, 컴포넌트, 반응형, 테마
  odometer-theme.css     — 오도미터 커스텀 테마
js/
  storage.js             — localStorage 래퍼 (try/catch, quota 처리)
  timer.js               — 타이머 엔진 (Date.now 기반)
  cost.js                — 비용 계산 + 오도미터 연동
  emotion.js             — 감정 단계 상태머신
  comparisons.js         — 재미 비교 데이터 + 표시
  settings.js            — 설정 관리 (참석자, 시급, 통화)
  history.js             — 히스토리 CRUD
  stats.js               — 통계 + Canvas 스파크라인
  app.js                 — 초기화, 탭 라우팅, 이벤트 바인딩
vendor/
  odometer.min.js        — Odometer.js (MIT)
```

Script 로딩 순서 (index.html):
```
vendor/odometer.min.js → storage.js → timer.js → cost.js →
emotion.js → comparisons.js → settings.js → history.js →
stats.js → app.js
```

### Module Communication
모듈 간 통신은 커스텀 이벤트로 느슨하게 연결:

```javascript
// timer.js가 매 프레임마다 발행
document.dispatchEvent(new CustomEvent('timer:tick', {
  detail: { elapsed: 1427, running: true }
}));

// cost.js, emotion.js, comparisons.js가 구독
document.addEventListener('timer:tick', function(e) { ... });

// timer.js가 정지 시 발행
document.dispatchEvent(new CustomEvent('timer:stop', {
  detail: { elapsed: 1427, totalCost: 548600 }
}));

// history.js가 구독하여 자동 저장
document.addEventListener('timer:stop', function(e) { ... });
```

주요 이벤트:
- `timer:tick` — 매 프레임 (elapsed, running)
- `timer:stop` — 정지 (elapsed, totalCost)
- `timer:reset` — 리셋
- `settings:change` — 설정 변경 (attendees, hourlyRate, currency)
- `theme:change` — 테마 변경 (theme)

---

## Components

### 1. Timer Engine (`timer.js`)

Date.now() 기반으로 경과 시간을 추적. requestAnimationFrame으로 UI 업데이트하되, 실제 시간은 Date.now() 차이로 계산하여 탭 비활성 시에도 정확.

```
State machine:
  IDLE → [start] → RUNNING → [pause] → PAUSED → [resume] → RUNNING
                  → [stop]  → IDLE
                  → [reset] → IDLE
  PAUSED → [reset] → IDLE
```

- `startTime`: Date.now() at start
- `pausedDuration`: 누적 일시정지 시간
- `elapsed`: Date.now() - startTime - pausedDuration
- double-click 방지: running 상태에서 start 무시

### 2. Cost Calculator (`cost.js`)

```
totalCost = attendees × (hourlyRate / 3600) × elapsedSeconds
```

- 원 단위 반올림 (Math.round)
- Odometer.js에 값 전달하여 숫자 스피닝 애니메이션
- 통화 기호 (₩/$/€)는 settings에서 가져옴
- 반응형 폰트: 비용이 ₩10,000,000 이상이면 font-size를 vw 기반으로 축소

### 3. Emotion Stage (`emotion.js`)

고정 임계값 상태머신:

| 범위 | 색상 | 이모지 | 메시지 | CSS class |
|------|------|--------|--------|-----------|
| 0~15분 | #3FB950 | 😌 | 순조롭습니다 | .stage-calm |
| 15~30분 | #D29922 | 😐 | 슬슬 길어지네요 | .stage-warn |
| 30~60분 | #DB6D28 | 😰 | 이쯤이면... | .stage-alert |
| 60분+ | #F85149 | 🔥 | 회의의 늪 | .stage-danger |

- 배경색 전환: CSS transition 300ms on body background
- 도트 인디케이터: 4개 도트, 활성 도트에 box-shadow glow
- timer:tick 이벤트 구독, 단계 변경 시에만 DOM 업데이트

### 4. Fun Comparisons (`comparisons.js`)

하드코딩된 15개 비교 항목 배열 (가격 오름차순 정렬).

표시 로직:
- timer:tick마다 현재 비용과 비교 배열 스캔
- 비용이 항목 가격을 넘을 때 → 해당 항목으로 카드 업데이트
- "이 회의 비용 = 커피 N잔 ☕" 형식
- N = Math.floor(totalCost / item.cost)
- 새 항목 전환 시 슬라이드인 애니메이션 (translateY + opacity, 300ms ease-out)

### 5. Settings (`settings.js`)

| 설정 | 기본값 | 범위 | 검증 |
|------|--------|------|------|
| attendees | 5 | 1~100 정수 | NaN/음수/0 → 거부 + 빨간 테두리 |
| hourlyRate | 35000 | 1 이상 정수 | NaN/음수/0 → 거부 + 빨간 테두리 |
| currency | "₩" | ₩/$/€ | select 요소 |
| theme | "dark" | dark/light | toggle |

- 변경 즉시 localStorage 저장 + settings:change 이벤트 발행
- 타이머 실행 중에도 설정 변경 가능 (즉시 반영)

### 6. History (`history.js`)

localStorage 배열에 저장. 각 항목:
```javascript
{
  id: String(Date.now()),
  date: "2026-04-07",
  duration: 1427,        // seconds
  attendees: 8,
  hourlyRate: 35000,
  totalCost: 548600,
  currency: "₩"
}
```

- timer:stop 이벤트 구독하여 자동 저장
- 최신순 정렬
- 비용에 따라 감정 단계 색상으로 표시 (30분 기준이 아닌 비용/참석자/시급 역산)
- 빈 상태: "아직 회의 기록이 없습니다"
- quota 초과 시 가장 오래된 항목 삭제 후 재시도

### 7. Statistics (`stats.js`)

요약 수치:
- 총 회의 수
- 총 비용 (통화 포맷)
- 평균 회의 시간 (MM:SS)
- 평균 비용 (통화 포맷)

Canvas 스파크라인:
- x축: 회의 인덱스 (최근 20건)
- y축: 비용
- 정적 표시 (인터랙션 없음)
- 데이터 1건: 점 하나
- 데이터 0건: "데이터가 부족합니다"

### 8. Tab Navigation (`app.js`)

3개 탭: Timer / History / Stats
- 하단 고정 탭 바
- 활성 탭: 액센트 색상 + 하단 2px 인디케이터
- 탭 전환 시 타이머 상태 유지 (DOM show/hide, 파괴하지 않음)
- opacity crossfade 150ms

---

## Layout

### Desktop (>768px): Split Panel
```
┌──────────────────────────────────────────┐
│  몇 분이나 됐지?              [🌙 toggle] │
├────────────────────────┬─────────────────┤
│                        │   SETTINGS      │
│   [stage indicators]   │   👥 Attendees  │
│   00:23:47             │   [  8  ]       │
│   ₩548,600             │   💰 Rate       │
│   [Pause] [Reset]      │   [35,000]      │
│                        │   💱 Currency    │
│                        │   [₩ ▼]         │
│                        ├─────────────────┤
│                        │  ☕ = 커피 109잔 │
├────────────────────────┴─────────────────┤
│  ⏱ Timer    📋 History    📊 Stats       │
└──────────────────────────────────────────┘
```

### Mobile (<768px): Stacked Center
```
┌──────────────────────┐
│  몇 분이나 됐지?  [🌙]│
├──────────────────────┤
│  [stage indicators]  │
│     00:23:47         │
│     ₩548,600         │
│  👥 8  💰 ₩35,000/hr │
│  [Pause] [Reset]     │
│  ☕ = 커피 109잔      │
├──────────────────────┤
│ ⏱ Timer 📋 Hist 📊  │
└──────────────────────┘
```

Settings는 모바일에서 타이머 화면 내 인라인 표시 (참석자/시급 영역을 탭하면 input으로 전환).

---

## Data Flow

```
[User clicks Start]
       │
       ▼
  Timer.start()
       │
       ├──▶ timer:tick (every rAF frame)
       │         │
       │         ├──▶ Cost.update(elapsed) → Odometer.update(value)
       │         ├──▶ Emotion.check(elapsed) → DOM class swap
       │         └──▶ Comparisons.check(totalCost) → card update
       │
       ▼
  [User clicks Stop]
       │
       ▼
  Timer.stop()
       │
       └──▶ timer:stop
                │
                ├──▶ History.add(record) → Storage.save()
                └──▶ Stats.refresh() → Canvas redraw
```

---

## Error Handling

| Error | Trigger | Action | User Sees |
|-------|---------|--------|-----------|
| QuotaExceededError | localStorage full | 가장 오래된 히스토리 삭제 후 재시도 | "저장 공간 부족" 알림 |
| SecurityError | localStorage 비활성 | 메모리 전용 모드 (저장 안 됨) | "저장 불가" 알림 |
| SyntaxError | JSON 파싱 실패 | 초기값으로 리셋 | "데이터 복구됨" 알림 |
| Invalid input | NaN/음수/빈값 | 입력 거부 | 빨간 테두리 + 메시지 |
| Odometer.js 미로드 | file:// 호환 실패 | CSS-only 숫자 표시 fallback | 숫자는 보이되 애니메이션 없음 |

---

## Theme System

CSS Custom Properties 기반. `<html data-theme="dark|light">`.

```css
[data-theme="dark"] {
  --bg: #0D1117;
  --surface: #161B22;
  --text: #E6EDF3;
  --accent: #FF6B35;
  /* ... full palette from DESIGN.md */
}

[data-theme="light"] {
  --bg: #F6F8FA;
  --surface: #FFFFFF;
  --text: #1F2328;
  --accent: #FF6B35;  /* accent stays the same */
}
```

토글 시 `data-theme` 속성 변경 + localStorage 저장.
다크모드가 기본값.

---

## NOT in scope

- Wall-of-shame 리더보드
- 스크린샷 카드 내보내기
- 소리 효과
- 실시간 다인원 공유
- 회의록 자동 생성
- 직급별 차등 시급
- 자동화 테스트 프레임워크

---

## Success Criteria

- [ ] 타이머 시작/일시정지/정지/리셋 정확 동작
- [ ] 오도미터 숫자 스피닝 애니메이션
- [ ] 4단계 감정 색상 전환
- [ ] 재미 비교 카드 동적 표시
- [ ] 설정 저장/복원
- [ ] 히스토리 기록/조회
- [ ] 통계 + 스파크라인
- [ ] 다크/라이트 모드 토글
- [ ] file:// 정상 동작
- [ ] 모바일/데스크톱 반응형 (Split Panel ↔ Stacked)

---

## Spike (구현 전)

| ID | 내용 | 판단 기준 |
|----|------|----------|
| SPIKE-01 | Odometer.js file:// 호환 검증 | OK → 벤더링. 실패 → CSS-only fallback |
