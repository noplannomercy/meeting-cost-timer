# History Delete + Meeting Memo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add swipe-to-delete on history items (with undo toast) and meeting memo input (modal on stop + inline edit in history).

**Architecture:** Extends existing history.js with remove/undo, swipe gesture handlers (touch + mouse), and memo fields. Modal HTML added to index.html. Reset flow in timer.js changed to dispatch a new event that app.js intercepts to show the memo modal before saving the record.

**Tech Stack:** Vanilla JS (ES5, IIFE), CSS Custom Properties, CustomEvent

---

## File Map

| File | Changes | Task |
|------|---------|------|
| `css/style.css` | Swipe delete styles, modal styles, history expand styles | Task 1 |
| `index.html` | Memo modal HTML structure | Task 2 |
| `js/history.js` | remove(), undo, swipe handlers, memo display, inline edit, expanded view | Task 3, 4, 5 |
| `js/app.js` | Memo modal logic, Reset flow change (stop → modal → save) | Task 4 |
| `js/timer.js` | No changes (Reset already calls stop() then reset(), stop dispatches timer:stop) | — |

---

### Task 1: CSS — Swipe Delete + Modal + History Expand Styles

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: Add swipe delete styles**

Add to the end of `css/style.css`, before the closing comment:

```css
/* ============================================
   Swipe Delete
   ============================================ */

.history-item {
  position: relative;
  overflow: hidden;
  touch-action: pan-y;
  transition: transform 300ms ease-out, opacity 300ms ease-out;
}

.history-item--swiping {
  transition: none;
}

.history-item--removing {
  transform: translateX(-100%);
  opacity: 0;
}

.history-item__delete-bg {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  background-color: var(--stage-danger);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 20px;
  color: var(--btn-primary-text);
  font-weight: 600;
  z-index: 0;
}

.history-item__content {
  position: relative;
  z-index: 1;
  background-color: var(--surface);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
}
```

- [ ] **Step 2: Add modal styles**

```css
/* ============================================
   Modal
   ============================================ */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  transition: opacity 300ms ease-out;
}

.modal-overlay--visible {
  opacity: 1;
}

.modal {
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
}

.modal__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 16px;
}

.modal__actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  justify-content: flex-end;
}

.btn--text {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 8px 16px;
  font-size: 14px;
}

.btn--text:hover {
  color: var(--text);
}
```

- [ ] **Step 3: Add history expand + memo display styles**

```css
/* ============================================
   History Expand + Memo
   ============================================ */

.history-item__title {
  font-weight: 500;
  color: var(--text);
  font-size: 13px;
  margin-top: 4px;
}

.history-item__memo-section {
  display: none;
  padding: 12px 20px;
  background-color: var(--surface-hover);
  border-top: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-muted);
}

.history-item--expanded .history-item__memo-section {
  display: block;
}

.history-item__memo-edit {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.history-item__memo-edit .input {
  font-size: 13px;
  padding: 8px;
}

.history-item__memo-save {
  align-self: flex-end;
}
```

- [ ] **Step 4: Commit**

```bash
git add css/style.css
git commit -m "feat: add CSS for swipe delete, modal, and history expand"
```

---

### Task 2: HTML — Memo Modal Structure

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add memo modal before toast container**

In `index.html`, add the modal markup right before the `<!-- Toast container -->` comment:

```html
  <!-- Memo Modal -->
  <div class="modal-overlay" id="memo-modal" style="display:none;">
    <div class="modal">
      <div class="modal__title">회의 메모</div>
      <input class="input" type="text" id="memo-title" placeholder="회의 제목" maxlength="50">
      <textarea class="input" id="memo-content" placeholder="메모" rows="3" maxlength="200"></textarea>
      <div class="modal__actions">
        <button class="btn btn--text" id="memo-skip">건너뛰기</button>
        <button class="btn btn--primary" id="memo-save">저장</button>
      </div>
    </div>
  </div>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add memo modal HTML structure"
```

---

### Task 3: History — Swipe Delete + Remove/Undo

**Files:**
- Modify: `js/history.js`

- [ ] **Step 1: Add remove() and _undoDelete() to history.js**

After the existing `add()` function (line 171), add:

```javascript
  function remove(id) {
    var idx = -1;
    for (var i = 0; i < _records.length; i++) {
      if (_records[i].id === id) { idx = i; break; }
    }
    if (idx === -1) return null;

    var removed = _records.splice(idx, 1)[0];
    _save();
    render();
    document.dispatchEvent(new CustomEvent('history:updated'));
    return removed;
  }

  function _undoDelete(record) {
    // Re-insert at correct position (by id/timestamp, newest first)
    var inserted = false;
    for (var i = 0; i < _records.length; i++) {
      if (parseInt(record.id, 10) > parseInt(_records[i].id, 10)) {
        _records.splice(i, 0, record);
        inserted = true;
        break;
      }
    }
    if (!inserted) { _records.push(record); }
    _save();
    render();
    document.dispatchEvent(new CustomEvent('history:updated'));
  }
```

- [ ] **Step 2: Update render() to wrap content in swipeable structure**

Replace the render loop body (lines 126-156) with a version that wraps each item in a delete-bg + content structure, and adds a `data-id` attribute:

```javascript
    // Render items (newest-first, records[0] is newest)
    for (i = 0; i < _records.length; i++) {
      var rec = _records[i];

      var item = document.createElement('div');
      item.className = 'history-item';
      item.setAttribute('data-id', rec.id);

      // Delete background (revealed on swipe)
      var deleteBg = document.createElement('div');
      deleteBg.className = 'history-item__delete-bg';
      deleteBg.textContent = '삭제';

      // Content wrapper
      var content = document.createElement('div');
      content.className = 'history-item__content';

      // Left: date + meta + title
      var left = document.createElement('div');
      left.className = 'history-item__left';

      var dateEl = document.createElement('div');
      dateEl.className = 'history-item__date';
      dateEl.textContent = _formatDate(rec.date);

      var metaEl = document.createElement('div');
      metaEl.className = 'history-item__meta';
      metaEl.textContent = rec.attendees + ' attendees, ' + _formatDuration(rec.duration);

      left.appendChild(dateEl);
      left.appendChild(metaEl);

      // Show title if exists
      if (rec.title) {
        var titleEl = document.createElement('div');
        titleEl.className = 'history-item__title';
        titleEl.textContent = rec.title;
        left.appendChild(titleEl);
      }

      // Right: cost
      var right = document.createElement('div');
      right.className = 'history-item__cost ' + _costClass(rec.duration);
      right.textContent = (rec.currency || '') + MeetingCost.Cost.formatCost(rec.totalCost);

      content.appendChild(left);
      content.appendChild(right);

      // Memo section (expandable)
      var memoSection = document.createElement('div');
      memoSection.className = 'history-item__memo-section';
      memoSection.textContent = rec.memo || '메모 없음';

      item.appendChild(deleteBg);
      item.appendChild(content);
      item.appendChild(memoSection);

      _listEl.appendChild(item);
    }

    _attachSwipeHandlers();
    _attachExpandHandlers();
```

- [ ] **Step 3: Add swipe gesture handlers**

Add after the render function:

```javascript
  function _attachSwipeHandlers() {
    var items = _listEl.querySelectorAll('.history-item');
    for (var i = 0; i < items.length; i++) {
      (function(item) {
        var startX = 0, startY = 0, currentX = 0, swiping = false;
        var contentEl = item.querySelector('.history-item__content');

        function onStart(e) {
          var point = e.touches ? e.touches[0] : e;
          startX = point.clientX;
          startY = point.clientY;
          swiping = false;
          item.classList.remove('history-item--swiping');
        }

        function onMove(e) {
          var point = e.touches ? e.touches[0] : e;
          var dx = point.clientX - startX;
          var dy = point.clientY - startY;

          // Only swipe left, and only if horizontal > vertical
          if (!swiping && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
            swiping = true;
            item.classList.add('history-item--swiping');
          }

          if (swiping && dx < 0) {
            if (e.cancelable) { e.preventDefault(); }
            currentX = dx;
            contentEl.style.transform = 'translateX(' + dx + 'px)';
          }
        }

        function onEnd() {
          if (!swiping) return;
          item.classList.remove('history-item--swiping');

          if (currentX < -60) {
            // Swipe threshold met — delete
            item.classList.add('history-item--removing');
            var id = item.getAttribute('data-id');
            setTimeout(function() {
              var removed = remove(id);
              if (removed) {
                _showUndoToast(removed);
              }
            }, 300);
          } else {
            // Snap back
            contentEl.style.transform = '';
          }
          currentX = 0;
          swiping = false;
        }

        contentEl.addEventListener('touchstart', onStart, { passive: true });
        contentEl.addEventListener('touchmove', onMove, { passive: false });
        contentEl.addEventListener('touchend', onEnd);
        contentEl.addEventListener('mousedown', onStart);
        contentEl.addEventListener('mousemove', onMove);
        contentEl.addEventListener('mouseup', onEnd);
        contentEl.addEventListener('mouseleave', onEnd);
      })(items[i]);
    }
  }

  function _showUndoToast(record) {
    document.dispatchEvent(new CustomEvent('toast:show-undo', {
      detail: {
        message: '삭제됨',
        onUndo: function() { _undoDelete(record); }
      }
    }));
  }
```

- [ ] **Step 4: Add expand/collapse handlers for memo viewing**

```javascript
  function _attachExpandHandlers() {
    var items = _listEl.querySelectorAll('.history-item');
    for (var i = 0; i < items.length; i++) {
      (function(item) {
        var content = item.querySelector('.history-item__content');
        content.addEventListener('click', function(e) {
          // Don't expand if swiping
          if (item.classList.contains('history-item--swiping')) return;
          item.classList.toggle('history-item--expanded');
        });
      })(items[i]);
    }
  }
```

- [ ] **Step 5: Add update() function for memo editing**

```javascript
  function update(id, fields) {
    for (var i = 0; i < _records.length; i++) {
      if (_records[i].id === id) {
        if (fields.title !== undefined) { _records[i].title = fields.title; }
        if (fields.memo !== undefined) { _records[i].memo = fields.memo; }
        break;
      }
    }
    _save();
    render();
  }
```

- [ ] **Step 6: Update the return object to expose new functions**

Change the return block:

```javascript
  return {
    init:   init,
    getAll: getAll,
    add:    add,
    remove: remove,
    update: update,
    render: render
  };
```

- [ ] **Step 7: Commit**

```bash
git add js/history.js
git commit -m "feat: add swipe delete with undo and expandable memo in history"
```

---

### Task 4: App — Memo Modal + Undo Toast + Reset Flow

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Add undo toast handler to _initToast()**

Replace the existing `_initToast()` function with a version that handles both regular toasts and undo toasts:

```javascript
  function _initToast() {
    var container = document.getElementById('toast-container');

    document.addEventListener('toast:show', function (evt) {
      if (!container) return;
      var message = evt.detail && evt.detail.message ? evt.detail.message : '';

      var toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      container.appendChild(toast);

      setTimeout(function () {
        toast.classList.add('toast--dismiss');
        setTimeout(function () {
          if (toast.parentNode) { toast.parentNode.removeChild(toast); }
        }, 300);
      }, 3000);
    });

    document.addEventListener('toast:show-undo', function (evt) {
      if (!container) return;
      var detail = evt.detail || {};
      var message = detail.message || '';
      var onUndo = detail.onUndo;

      var toast = document.createElement('div');
      toast.className = 'toast toast--undo';

      var textSpan = document.createElement('span');
      textSpan.textContent = message;
      toast.appendChild(textSpan);

      var undoBtn = document.createElement('button');
      undoBtn.className = 'toast__undo-btn';
      undoBtn.textContent = '되돌리기';
      undoBtn.addEventListener('click', function () {
        if (typeof onUndo === 'function') { onUndo(); }
        if (toast.parentNode) { toast.parentNode.removeChild(toast); }
      });
      toast.appendChild(undoBtn);
      container.appendChild(toast);

      setTimeout(function () {
        toast.classList.add('toast--dismiss');
        setTimeout(function () {
          if (toast.parentNode) { toast.parentNode.removeChild(toast); }
        }, 300);
      }, 3000);
    });
  }
```

- [ ] **Step 2: Add memo modal logic**

Add a new function `_initMemoModal()` to app.js:

```javascript
  var _pendingRecord = null;

  function _initMemoModal() {
    var modal       = document.getElementById('memo-modal');
    var titleInput  = document.getElementById('memo-title');
    var contentInput = document.getElementById('memo-content');
    var saveBtn     = document.getElementById('memo-save');
    var skipBtn     = document.getElementById('memo-skip');

    function showModal() {
      if (!modal) return;
      titleInput.value = '';
      contentInput.value = '';
      modal.style.display = '';
      // Trigger reflow for transition
      modal.offsetHeight;
      modal.classList.add('modal-overlay--visible');
      titleInput.focus();
    }

    function hideModal() {
      if (!modal) return;
      modal.classList.remove('modal-overlay--visible');
      setTimeout(function() { modal.style.display = 'none'; }, 300);
    }

    function saveRecord(title, memo) {
      if (!_pendingRecord) return;
      _pendingRecord.title = title || '';
      _pendingRecord.memo  = memo || '';
      MeetingCost.History.add(_pendingRecord);
      document.dispatchEvent(new CustomEvent('history:updated'));
      _pendingRecord = null;
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        saveRecord(titleInput.value.trim(), contentInput.value.trim());
        hideModal();
        MeetingCost.Timer.reset();
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', function () {
        saveRecord('', '');
        hideModal();
        MeetingCost.Timer.reset();
      });
    }

    // Listen for memo:request from the new reset flow
    document.addEventListener('memo:request', function (evt) {
      var detail = evt.detail || {};
      _pendingRecord = {
        id:         String(Date.now()),
        date:       _todayStr(),
        duration:   detail.elapsed || 0,
        attendees:  MeetingCost.Settings.getAttendees(),
        hourlyRate: MeetingCost.Settings.getHourlyRate(),
        totalCost:  MeetingCost.Cost.getTotalCost(),
        currency:   MeetingCost.Settings.getCurrency(),
        title:      '',
        memo:       ''
      };
      showModal();
    });
  }

  function _todayStr() {
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth() + 1;
    var d = now.getDate();
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return y + '-' + pad(m) + '-' + pad(d);
  }
```

- [ ] **Step 3: Detach history.js from timer:stop, use memo flow instead**

In `js/history.js`, remove the `timer:stop` event listener from `init()`. Change line 201:

```javascript
    // OLD: document.addEventListener('timer:stop', _onTimerStop);
    // Memo modal now handles record creation via app.js
```

Also remove the `_onTimerStop` function (lines 173-191) since the record is now created in app.js.

- [ ] **Step 4: Update timer.js reset button handler to dispatch memo:request**

In `js/timer.js`, change the reset button handler (lines 192-198):

```javascript
    if (_btnReset) {
      _btnReset.addEventListener('click', function () {
        if (_state === STATE_RUNNING || _state === STATE_PAUSED) {
          // Stop the timer and get elapsed
          clearInterval(_intervalId);
          _intervalId = null;

          if (_state === STATE_RUNNING) {
            _elapsed = Math.floor((Date.now() - _startTime - _pausedDuration) / 1000);
          }

          var finalElapsed = _elapsed;

          if (finalElapsed >= 1) {
            // Dispatch memo request — app.js will show modal, then save + reset
            _dispatch('memo:request', { elapsed: finalElapsed });
            // Don't reset yet — modal handles it
            _state          = STATE_IDLE;
            _elapsed        = 0;
            _startTime      = 0;
            _pausedAt       = 0;
            _pausedDuration = 0;
            _updateDisplay();
            _updateButtons();
            return;
          }
        }
        reset();
      });
    }
```

- [ ] **Step 5: Add _initMemoModal() call to boot sequence**

In `app.js` `init()` function, add after the `_initToast()` call:

```javascript
    // 13. Wire memo modal
    _initMemoModal();
```

- [ ] **Step 6: Commit**

```bash
git add js/app.js js/history.js js/timer.js
git commit -m "feat: add memo modal on timer stop and undo toast support"
```

---

### Task 5: CSS — Undo Toast Button Style

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: Add undo toast styles**

```css
/* Undo toast */
.toast--undo {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
}

.toast__undo-btn {
  background: none;
  border: 1px solid var(--btn-primary-text);
  color: var(--btn-primary-text);
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}

.toast__undo-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
}
```

- [ ] **Step 2: Add input spacing for modal**

```css
.modal .input {
  margin-bottom: 8px;
}

.modal .input:last-of-type {
  margin-bottom: 0;
}
```

- [ ] **Step 3: Commit**

```bash
git add css/style.css
git commit -m "feat: add undo toast button and modal input styles"
```

---

## Execution Summary

| Task | Component | Files | Depends on |
|------|-----------|-------|------------|
| 1 | CSS styles | css/style.css | — |
| 2 | Modal HTML | index.html | — |
| 3 | History swipe/expand/update | js/history.js | Task 1 |
| 4 | App memo modal + reset flow | js/app.js, js/history.js, js/timer.js | Tasks 2, 3 |
| 5 | Undo toast CSS | css/style.css | Task 4 |

**Critical path:** 1 → 3 → 4 → 5
**Parallel possible:** Tasks 1 and 2 can run in parallel.
