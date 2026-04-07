# Meeting Cost Timer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a meeting cost timer web app with odometer animation, emotion stages, fun comparisons, history, and stats.

**Architecture:** Vanilla JS (ES5, IIFE) with MeetingCost global namespace. Modules communicate via CustomEvent. Split Panel layout on desktop, stacked on mobile. Odometer.js vendored for number animation.

**Tech Stack:** HTML5, CSS3 Custom Properties, Vanilla JS (ES5), Canvas (sparkline), localStorage, Odometer.js (MIT)

---

## File Map

| File | Responsibility | Created in |
|------|---------------|------------|
| `index.html` | HTML structure, script loading, all 3 tab views | Task 1 |
| `css/style.css` | Full styles: theme, layout, components, responsive, animations | Task 2 |
| `css/odometer-theme.css` | Odometer custom theme matching DESIGN.md | Task 2 |
| `vendor/odometer.min.js` | Odometer.js library (vendored) | Task 1 |
| `js/storage.js` | localStorage wrapper with error handling | Task 3 |
| `js/timer.js` | Timer engine (Date.now based, state machine) | Task 4 |
| `js/cost.js` | Cost calculation + odometer integration | Task 5 |
| `js/emotion.js` | Emotion stage state machine | Task 6 |
| `js/comparisons.js` | Fun comparison data + display logic | Task 7 |
| `js/settings.js` | Settings management + validation | Task 8 |
| `js/history.js` | History CRUD + list rendering | Task 9 |
| `js/stats.js` | Statistics + Canvas sparkline | Task 10 |
| `js/app.js` | Init, tab routing, event binding, theme toggle | Task 11 |

---

### Task 0: Spike — Odometer.js file:// Compatibility

**Files:**
- Create: `vendor/odometer.min.js`
- Create: `spike-odometer.html` (temporary)

- [ ] **Step 1: Download Odometer.js**

Download Odometer.js and its default theme CSS. Save to `vendor/odometer.min.js`.

```bash
curl -o vendor/odometer.min.js https://github.hubspot.com/odometer/odometer.min.js
```

If curl fails (no network or 404), search for an alternative CDN source or use the npm package:
```bash
npm pack odometer && tar -xf odometer-*.tgz && cp package/odometer.min.js vendor/ && rm -rf package odometer-*.tgz
```

- [ ] **Step 2: Create spike test file**

Create `spike-odometer.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    .odometer { font-size: 48px; font-family: monospace; }
  </style>
  <script src="vendor/odometer.min.js"></script>
</head>
<body>
  <div id="cost" class="odometer">0</div>
  <button onclick="document.getElementById('cost').innerHTML = 548600">
    Test Odometer
  </button>
  <p>Open this file via file:// protocol. Click the button. If numbers spin, PASS.</p>
</body>
</html>
```

- [ ] **Step 3: Test in browser**

Open `spike-odometer.html` via file:// in Chrome and Firefox. Click button.
- PASS: Numbers animate with spinning transition → proceed with Odometer.js
- FAIL: Numbers jump without animation → implement CSS-only odometer fallback in Task 5

- [ ] **Step 4: Clean up spike**

```bash
rm spike-odometer.html
```

- [ ] **Step 5: Commit vendor file**

```bash
git add vendor/
git commit -m "chore: vendor Odometer.js for number animation"
```

---

### Task 1: HTML Shell + Project Structure

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p css js vendor
```

- [ ] **Step 2: Write index.html**

```html
<!DOCTYPE html>
<html lang="ko" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>몇 분이나 됐지?</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/odometer-theme.css">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <!-- Header -->
  <header class="header">
    <h1 class="header__title">몇 분이나 됐지?</h1>
    <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme">🌙</button>
  </header>

  <!-- Main content -->
  <main class="main">
    <!-- Timer Tab -->
    <section id="tab-timer" class="tab-content active">
      <div class="timer-layout">
        <!-- Left: Timer + Cost -->
        <div class="timer-panel">
          <div class="stage-indicators" id="stage-indicators">
            <span class="stage-dot stage-dot--calm active" data-stage="calm"></span>
            <span class="stage-dot stage-dot--warn" data-stage="warn"></span>
            <span class="stage-dot stage-dot--alert" data-stage="alert"></span>
            <span class="stage-dot stage-dot--danger" data-stage="danger"></span>
          </div>

          <div class="emotion-display" id="emotion-display">
            <span class="emotion-display__emoji" id="emotion-emoji">😌</span>
            <span class="emotion-display__message" id="emotion-message">순조롭습니다</span>
          </div>

          <div class="timer-display" id="timer-display">00:00:00</div>

          <div class="cost-display-wrapper">
            <span class="cost-currency" id="cost-currency">₩</span>
            <div class="cost-display odometer" id="cost-display">0</div>
          </div>

          <div class="controls">
            <button id="btn-start" class="btn btn--primary">▶ Start</button>
            <button id="btn-pause" class="btn btn--primary" style="display:none;">⏸ Pause</button>
            <button id="btn-reset" class="btn btn--secondary">Reset</button>
          </div>
        </div>

        <!-- Right: Settings + Comparison -->
        <div class="settings-panel">
          <div class="settings-section">
            <div class="settings-title">Settings</div>
            <div class="input-group">
              <label class="input-label" for="input-attendees">👥 Attendees</label>
              <input class="input" type="number" id="input-attendees" value="5" min="1" max="100">
              <span class="input-error" id="error-attendees"></span>
            </div>
            <div class="input-group">
              <label class="input-label" for="input-rate">💰 Hourly Rate</label>
              <input class="input" type="number" id="input-rate" value="35000" min="1">
              <span class="input-error" id="error-rate"></span>
            </div>
            <div class="input-group">
              <label class="input-label" for="input-currency">💱 Currency</label>
              <select class="input" id="input-currency">
                <option value="₩" selected>₩ (KRW)</option>
                <option value="$">$ (USD)</option>
                <option value="€">€ (EUR)</option>
              </select>
            </div>
          </div>

          <div class="comparison-card" id="comparison-card">
            <span class="comparison-card__emoji" id="comparison-emoji">☕</span>
            <span class="comparison-card__text">
              이 회의 비용 = <span class="comparison-card__highlight" id="comparison-text">커피 0잔</span>
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- History Tab -->
    <section id="tab-history" class="tab-content">
      <div class="history-header">
        <h2 class="section-title">Meeting History</h2>
        <span class="history-total" id="history-total"></span>
      </div>
      <div class="history-list" id="history-list">
        <div class="empty-state" id="history-empty">아직 회의 기록이 없습니다</div>
      </div>
    </section>

    <!-- Stats Tab -->
    <section id="tab-stats" class="tab-content">
      <h2 class="section-title">Statistics</h2>
      <div class="stats-grid" id="stats-grid">
        <div class="stat-card">
          <div class="stat-card__label">총 회의 수</div>
          <div class="stat-card__value" id="stat-count">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">총 비용</div>
          <div class="stat-card__value" id="stat-total-cost">₩0</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">평균 시간</div>
          <div class="stat-card__value" id="stat-avg-time">00:00</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">평균 비용</div>
          <div class="stat-card__value" id="stat-avg-cost">₩0</div>
        </div>
      </div>
      <div class="sparkline-wrapper">
        <div class="sparkline-label">최근 회의 비용 추이</div>
        <canvas id="sparkline-canvas" width="600" height="120"></canvas>
        <div class="empty-state" id="stats-empty" style="display:none;">데이터가 부족합니다</div>
      </div>
    </section>
  </main>

  <!-- Tab Navigation -->
  <nav class="tab-nav">
    <button class="tab active" data-tab="timer">⏱ Timer</button>
    <button class="tab" data-tab="history">📋 History</button>
    <button class="tab" data-tab="stats">📊 Stats</button>
  </nav>

  <!-- Toast container -->
  <div class="toast-container" id="toast-container"></div>

  <!-- Scripts (load order matters) -->
  <script src="vendor/odometer.min.js"></script>
  <script src="js/storage.js"></script>
  <script src="js/timer.js"></script>
  <script src="js/cost.js"></script>
  <script src="js/emotion.js"></script>
  <script src="js/comparisons.js"></script>
  <script src="js/settings.js"></script>
  <script src="js/history.js"></script>
  <script src="js/stats.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 3: Verify HTML opens in browser**

Open `index.html` via file://. Should show empty structure with no JS errors (scripts don't exist yet, errors expected but page renders).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add HTML shell with all tab views and structure"
```

---

### Task 2: CSS — Full Styling + Themes + Responsive

**Files:**
- Create: `css/style.css`
- Create: `css/odometer-theme.css`

- [ ] **Step 1: Write odometer-theme.css**

Custom Odometer theme matching DESIGN.md (dark background, JetBrains Mono, orange accent). Base on Odometer's "default" theme but override colors and fonts.

```css
/* Odometer theme - Meeting Cost Timer */
.odometer.odometer-auto-theme,
.odometer.odometer-theme-default {
  display: inline-block;
  vertical-align: middle;
  position: relative;
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.odometer.odometer-auto-theme .odometer-digit,
.odometer.odometer-theme-default .odometer-digit {
  display: inline-block;
  vertical-align: middle;
  position: relative;
}
.odometer.odometer-auto-theme .odometer-digit .odometer-digit-spacer,
.odometer.odometer-theme-default .odometer-digit .odometer-digit-spacer {
  display: inline-block;
  vertical-align: middle;
  visibility: hidden;
}
.odometer.odometer-auto-theme .odometer-digit .odometer-digit-inner,
.odometer.odometer-theme-default .odometer-digit .odometer-digit-inner {
  text-align: left;
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}
.odometer.odometer-auto-theme .odometer-digit .odometer-ribbon,
.odometer.odometer-theme-default .odometer-digit .odometer-ribbon {
  display: block;
}
.odometer.odometer-auto-theme .odometer-digit .odometer-ribbon-inner,
.odometer.odometer-theme-default .odometer-digit .odometer-ribbon-inner {
  display: block;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}
.odometer.odometer-auto-theme .odometer-digit .odometer-value,
.odometer.odometer-theme-default .odometer-digit .odometer-value {
  display: block;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}
.odometer.odometer-auto-theme .odometer-digit .odometer-value.odometer-last-value,
.odometer.odometer-theme-default .odometer-digit .odometer-value.odometer-last-value {
  position: absolute;
}
.odometer.odometer-auto-theme.odometer-animating-up .odometer-ribbon-inner,
.odometer.odometer-theme-default.odometer-animating-up .odometer-ribbon-inner {
  -webkit-transition: -webkit-transform 1s;
  transition: transform 1s;
}
.odometer.odometer-auto-theme.odometer-animating-down .odometer-ribbon-inner,
.odometer.odometer-theme-default.odometer-animating-down .odometer-ribbon-inner {
  -webkit-transition: -webkit-transform 1s;
  transition: transform 1s;
}
.odometer.odometer-auto-theme .odometer-formatting-mark,
.odometer.odometer-theme-default .odometer-formatting-mark {
  display: inline-block;
  vertical-align: middle;
}
```

- [ ] **Step 2: Write style.css**

Write the complete `css/style.css` with all DESIGN.md tokens:
- CSS Custom Properties (dark + light themes, full palette from DESIGN.md)
- Base resets and typography (Geist, DM Sans, JetBrains Mono)
- Header, tab navigation (bottom fixed, active indicator)
- Timer panel: stage indicators, timer display, cost display (responsive font), controls
- Settings panel: input groups, validation error states, currency select
- Comparison card with slide-in animation
- Split panel layout (desktop >768px) → stacked (mobile)
- History list items with emotion color coding
- Stats grid (2x2) + sparkline wrapper
- Toast notifications
- Emotion stage body classes (.stage-calm, .stage-warn, .stage-alert, .stage-danger) with background tint transitions
- Motion: all transitions per DESIGN.md (300ms ease-out for enters, 150ms for tabs)
- Responsive font for cost display (clamp or vw-based scaling for large numbers)

The CSS file will be substantial (~400 lines). Include every component's styling. No placeholders.

- [ ] **Step 3: Verify styling in browser**

Open `index.html` via file://. Dark theme should render correctly with proper colors, fonts, layout. Split panel on desktop, stacked on mobile (resize to check).

- [ ] **Step 4: Commit**

```bash
git add css/
git commit -m "feat: add complete CSS with themes, layout, and responsive design"
```

---

### Task 3: Storage Module

**Files:**
- Create: `js/storage.js`

- [ ] **Step 1: Write storage.js**

```javascript
var MeetingCost = MeetingCost || {};

MeetingCost.Storage = (function() {
  'use strict';

  var _available = null;

  function isAvailable() {
    if (_available !== null) return _available;
    try {
      var test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      _available = true;
    } catch (e) {
      _available = false;
    }
    return _available;
  }

  function get(key, defaultValue) {
    if (!isAvailable()) return defaultValue;
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[Storage] Parse error for key "' + key + '", resetting to default.', e);
      _showToast('데이터 복구됨');
      remove(key);
      return defaultValue;
    }
  }

  function set(key, value) {
    if (!isAvailable()) {
      _showToast('저장 불가 — 브라우저 설정을 확인하세요');
      return false;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        _showToast('저장 공간 부족');
        return false;
      }
      console.warn('[Storage] Write error for key "' + key + '".', e);
      return false;
    }
  }

  function setWithRetry(key, value, retryFn) {
    if (set(key, value)) return true;
    if (typeof retryFn === 'function') {
      retryFn();
      return set(key, value);
    }
    return false;
  }

  function remove(key) {
    if (!isAvailable()) return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // silent
    }
  }

  function _showToast(message) {
    document.dispatchEvent(new CustomEvent('toast:show', {
      detail: { message: message }
    }));
  }

  return {
    isAvailable: isAvailable,
    get: get,
    set: set,
    setWithRetry: setWithRetry,
    remove: remove
  };
})();
```

- [ ] **Step 2: Verify no JS errors**

Open `index.html`, check console. `MeetingCost.Storage` should exist.

- [ ] **Step 3: Commit**

```bash
git add js/storage.js
git commit -m "feat: add localStorage wrapper with error handling"
```

---

### Task 4: Timer Engine

**Files:**
- Create: `js/timer.js`

- [ ] **Step 1: Write timer.js**

Implement the timer state machine (IDLE/RUNNING/PAUSED) using Date.now() for accuracy. requestAnimationFrame for UI updates. Dispatch `timer:tick`, `timer:stop`, `timer:reset` custom events.

Key details:
- `_startTime = Date.now()` on start
- `_pausedAt` tracks when paused, `_pausedDuration` accumulates total paused time
- `_elapsed = Date.now() - _startTime - _pausedDuration` (in ms)
- Dispatch `timer:tick` with `{ elapsed: seconds, running: true }` each rAF frame
- On stop: dispatch `timer:stop` with `{ elapsed: seconds }`
- On reset: dispatch `timer:reset`, reset all state
- Format elapsed as HH:MM:SS, update `#timer-display` textContent
- double-click prevention: start() is no-op if state is RUNNING
- Button visibility: show Start when IDLE/PAUSED, show Pause when RUNNING

Full IIFE module on `MeetingCost.Timer` with `start()`, `pause()`, `resume()`, `stop()`, `reset()`, `getElapsed()`, `isRunning()`.

- [ ] **Step 2: Verify timer in browser**

Open `index.html`. Start button should begin counting. Timer display should update. Pause/resume should work. Console should show no errors.

- [ ] **Step 3: Commit**

```bash
git add js/timer.js
git commit -m "feat: add timer engine with Date.now-based accuracy"
```

---

### Task 5: Cost Calculator + Odometer

**Files:**
- Create: `js/cost.js`

- [ ] **Step 1: Write cost.js**

Listen to `timer:tick`, calculate `totalCost = attendees * (hourlyRate / 3600) * elapsed`. Update Odometer element. Handle Odometer.js not loaded (fallback to textContent). Format with thousand separators. Responsive font: if value >= 10000000, add `.cost-display--large` class.

Expose `MeetingCost.Cost` with `getTotalCost()`, `formatCost(value, currency)`.

Listen to `settings:change` to pick up attendees/hourlyRate/currency changes.
Listen to `timer:reset` to reset cost to 0.

- [ ] **Step 2: Verify cost in browser**

Start timer. Cost should animate upward with odometer spinning. Currency symbol should match settings.

- [ ] **Step 3: Commit**

```bash
git add js/cost.js
git commit -m "feat: add cost calculator with odometer animation"
```

---

### Task 6: Emotion Stage

**Files:**
- Create: `js/emotion.js`

- [ ] **Step 1: Write emotion.js**

Emotion state machine with 4 stages. Listen to `timer:tick`, check elapsed against thresholds (900, 1800, 3600 seconds). On stage change: update body class, update emoji/message, update dot indicators. Only update DOM when stage actually changes (avoid per-frame DOM writes).

Stages array:
```javascript
var STAGES = [
  { id: 'calm',   max: 900,  color: '#3FB950', emoji: '😌', message: '순조롭습니다' },
  { id: 'warn',   max: 1800, color: '#D29922', emoji: '😐', message: '슬슬 길어지네요' },
  { id: 'alert',  max: 3600, color: '#DB6D28', emoji: '😰', message: '이쯤이면...' },
  { id: 'danger', max: Infinity, color: '#F85149', emoji: '🔥', message: '회의의 늪' }
];
```

Listen to `timer:reset` to reset to calm stage.

- [ ] **Step 2: Verify in browser**

Start timer. After 15 min equivalent (or temporarily lower thresholds to test), background tint and emoji should change.

- [ ] **Step 3: Commit**

```bash
git add js/emotion.js
git commit -m "feat: add emotion stage state machine with color transitions"
```

---

### Task 7: Fun Comparisons

**Files:**
- Create: `js/comparisons.js`

- [ ] **Step 1: Write comparisons.js**

Hardcoded 15 comparison items sorted by cost ascending. Listen to `timer:tick`, get totalCost from `MeetingCost.Cost.getTotalCost()`. Find the highest item where `totalCost >= item.cost`. Calculate count `Math.floor(totalCost / item.cost)`. Update comparison card with slide-in animation when item changes. Listen to `timer:reset` to reset card.

Items array (from SRS Section 8):
```javascript
var ITEMS = [
  { name: '자판기 커피', cost: 500, emoji: '☕' },
  { name: '편의점 삼각김밥', cost: 1200, emoji: '🍙' },
  { name: '아메리카노', cost: 4500, emoji: '☕' },
  { name: '택시 기본요금', cost: 4800, emoji: '🚕' },
  { name: '점심 김치찌개', cost: 8000, emoji: '🍲' },
  { name: '영화 티켓', cost: 15000, emoji: '🎬' },
  { name: '치킨 한 마리', cost: 20000, emoji: '🍗' },
  { name: '피자 한 판', cost: 25000, emoji: '🍕' },
  { name: '스타벅스 텀블러', cost: 35000, emoji: '🥤' },
  { name: '제주도 왕복 항공권', cost: 150000, emoji: '✈️' },
  { name: '에어팟', cost: 250000, emoji: '🎧' },
  { name: '닌텐도 스위치', cost: 360000, emoji: '🎮' },
  { name: '아이패드', cost: 600000, emoji: '📱' },
  { name: '맥북 에어', cost: 1500000, emoji: '💻' },
  { name: '하와이 여행', cost: 3000000, emoji: '🏝️' }
];
```

- [ ] **Step 2: Verify in browser**

Start timer. As cost crosses comparison thresholds, card should update with slide animation.

- [ ] **Step 3: Commit**

```bash
git add js/comparisons.js
git commit -m "feat: add fun comparison cards with slide-in animation"
```

---

### Task 8: Settings

**Files:**
- Create: `js/settings.js`

- [ ] **Step 1: Write settings.js**

Manage attendees, hourlyRate, currency settings. Load from Storage on init, save on change. Validate inputs: attendees (integer 1-100), hourlyRate (integer >= 1). Show red border + error message on invalid. Dispatch `settings:change` event on valid change. Wire up input elements with `input` event listeners.

Expose `MeetingCost.Settings` with `getAttendees()`, `getHourlyRate()`, `getCurrency()`.

Default values: `{ attendees: 5, hourlyRate: 35000, currency: '₩', theme: 'dark' }`.

- [ ] **Step 2: Verify in browser**

Change attendees/rate inputs. Cost calculation should update immediately. Invalid values show red border.

- [ ] **Step 3: Commit**

```bash
git add js/settings.js
git commit -m "feat: add settings management with validation"
```

---

### Task 9: History

**Files:**
- Create: `js/history.js`

- [ ] **Step 1: Write history.js**

Listen to `timer:stop` event. Create record `{ id, date, duration, attendees, hourlyRate, totalCost, currency }`. Save to Storage with retry (delete oldest on quota error). Render history list sorted newest-first. Color-code each item by duration using emotion stage colors. Show empty state when 0 records. Update history total display.

Expose `MeetingCost.History` with `getAll()`, `add(record)`, `clear()`.

- [ ] **Step 2: Verify in browser**

Start timer, wait a few seconds, stop. Switch to History tab. Record should appear. Repeat. List should be newest-first.

- [ ] **Step 3: Commit**

```bash
git add js/history.js
git commit -m "feat: add meeting history with auto-save and list view"
```

---

### Task 10: Statistics + Sparkline

**Files:**
- Create: `js/stats.js`

- [ ] **Step 1: Write stats.js**

Calculate summary stats from History data: total count, total cost, avg duration (MM:SS), avg cost. Draw Canvas sparkline: x=meeting index (last 20), y=cost. Handle 0 records (show empty state), 1 record (single dot). Refresh on tab switch to Stats and on `timer:stop`.

Canvas drawing: clear canvas, draw polyline with accent color (#FF6B35), fill area below with accent-glow, draw dots at data points.

Expose `MeetingCost.Stats` with `refresh()`.

- [ ] **Step 2: Verify in browser**

Add a few history records (start/stop timer multiple times). Switch to Stats tab. Summary numbers and sparkline should render.

- [ ] **Step 3: Commit**

```bash
git add js/stats.js
git commit -m "feat: add statistics dashboard with canvas sparkline"
```

---

### Task 11: App Init + Tab Routing + Theme Toggle

**Files:**
- Create: `js/app.js`

- [ ] **Step 1: Write app.js**

Initialize all modules. Wire up:
- Tab navigation: click handlers, show/hide tab-content sections, active class toggle, crossfade
- Theme toggle: swap `data-theme` on `<html>`, save to Storage, update toggle button icon (🌙/☀️)
- Start/Pause/Reset button click handlers delegating to `MeetingCost.Timer`
- Toast system: listen to `toast:show`, create/animate/remove toast elements

Boot sequence:
1. `MeetingCost.Storage` (already IIFE-initialized)
2. Load saved theme, apply to `<html data-theme>`
3. `MeetingCost.Settings.init()` — load saved settings, wire inputs
4. `MeetingCost.Timer.init()` — wire buttons
5. `MeetingCost.Cost.init()` — wire odometer
6. `MeetingCost.Emotion.init()` — wire stage indicators
7. `MeetingCost.Comparisons.init()` — wire comparison card
8. `MeetingCost.History.init()` — render saved history
9. `MeetingCost.Stats.init()` — render stats
10. Wire tab nav + theme toggle

- [ ] **Step 2: Full integration test in browser**

Open `index.html` via file://. Test complete flow:
1. Start timer → cost animates, emotion changes
2. Change settings → cost updates immediately
3. Stop → record saved to history
4. Switch tabs → history shows, stats shows
5. Toggle theme → dark/light switch
6. Reload page → settings and history persist

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: add app init, tab routing, and theme toggle"
```

---

### Task 12: Polish + Final Verification

**Files:**
- Modify: various files for edge cases and polish

- [ ] **Step 1: Edge case fixes**

Review and fix:
- Cost display responsive font for large numbers
- Empty states rendering correctly
- Mobile layout stacking correctly at <768px
- Toast notifications appearing and auto-dismissing
- Comparison card initial state (hidden until first threshold crossed)

- [ ] **Step 2: Cross-browser verification**

Test in:
- Chrome (file://)
- Firefox (file://)
- Edge (file://)
- Mobile viewport (Chrome DevTools device mode)

- [ ] **Step 3: Add .gitignore**

```
.superpowers/
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "polish: edge cases, cross-browser fixes, gitignore"
```

---

## Execution Summary

| Task | Component | Files | Depends on |
|------|-----------|-------|------------|
| 0 | Spike: Odometer.js | vendor/ | — |
| 1 | HTML Shell | index.html | — |
| 2 | CSS Styling | css/ | Task 1 |
| 3 | Storage | js/storage.js | Task 1 |
| 4 | Timer | js/timer.js | Task 3 |
| 5 | Cost | js/cost.js | Task 4 |
| 6 | Emotion | js/emotion.js | Task 4 |
| 7 | Comparisons | js/comparisons.js | Task 5 |
| 8 | Settings | js/settings.js | Task 3 |
| 9 | History | js/history.js | Tasks 4, 3 |
| 10 | Stats | js/stats.js | Task 9 |
| 11 | App Init | js/app.js | All above |
| 12 | Polish | various | Task 11 |

**Critical path:** 0 → 1 → 2 → 3 → 4 → 5 → 11
**Parallel possible:** Tasks 6, 7, 8 can run in parallel after Task 4/5.

## ENG REVIEW NOTE (2026-04-07)

**Change from review:** Task 4 (Timer) — `requestAnimationFrame` 대신 `setInterval(1000)` + `Date.now()` 보정 사용. 초당 60회 이벤트 → 1회로 감소. Odometer.js가 자체 보간하므로 부드러움 유지.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | CLEAR | mode: HOLD_SCOPE, 0 critical gaps |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 1 issue (tick rate), 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |

**VERDICT:** CEO + ENG CLEARED — ready to implement.
