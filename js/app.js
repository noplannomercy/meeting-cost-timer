var MeetingCost = MeetingCost || {};

MeetingCost.App = (function () {
  'use strict';

  // -----------------------------------------------------------
  // Tab Navigation
  // -----------------------------------------------------------

  function _initTabs() {
    var tabs = document.querySelectorAll('.tab');
    var contents = document.querySelectorAll('.tab-content');
    var i;

    for (i = 0; i < tabs.length; i++) {
      (function (tab) {
        tab.addEventListener('click', function () {
          var targetId = 'tab-' + tab.getAttribute('data-tab');
          var j;

          // Deactivate all tabs and contents
          for (j = 0; j < tabs.length; j++) {
            tabs[j].classList.remove('active');
          }
          for (j = 0; j < contents.length; j++) {
            contents[j].classList.remove('active');
          }

          // Activate clicked tab and target content
          tab.classList.add('active');
          var target = document.getElementById(targetId);
          if (target) {
            target.classList.add('active');
          }

          // Refresh stats sparkline on tab switch (canvas may need resize)
          if (tab.getAttribute('data-tab') === 'stats') {
            MeetingCost.Stats.refresh();
          }
        });
      })(tabs[i]);
    }
  }

  // -----------------------------------------------------------
  // Theme Toggle
  // -----------------------------------------------------------

  function _initThemeToggle() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var html = document.documentElement;
      var current = html.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';

      html.setAttribute('data-theme', next);
      btn.textContent = next === 'dark' ? '🌙' : '☀️';
      MeetingCost.Settings.setTheme(next);
    });
  }

  // -----------------------------------------------------------
  // Toast System
  // -----------------------------------------------------------

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

  // -----------------------------------------------------------
  // Apply saved theme on boot
  // -----------------------------------------------------------

  function _applyTheme() {
    var theme = MeetingCost.Settings.getTheme
      ? MeetingCost.Settings.getTheme()
      : 'dark';
    var html = document.documentElement;
    html.setAttribute('data-theme', theme);

    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
  }

  // -----------------------------------------------------------
  // Memo Modal
  // -----------------------------------------------------------

  var _pendingRecord = null;

  function _todayStr() {
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth() + 1;
    var d = now.getDate();
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return y + '-' + pad(m) + '-' + pad(d);
  }

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
      modal.offsetHeight; // trigger reflow
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

  // -----------------------------------------------------------
  // Boot sequence
  // -----------------------------------------------------------

  function init() {
    // 1. Storage is already IIFE-initialized at parse time

    // 2. Load saved settings first (needed for theme)
    MeetingCost.Settings.init();

    // 3. Apply saved theme to <html data-theme="...">
    _applyTheme();

    // 4. Init timer — wire buttons (don't start)
    MeetingCost.Timer.init();

    // 5. Init cost — wire odometer
    MeetingCost.Cost.init();

    // 6. Init emotion — wire stage indicators
    MeetingCost.Emotion.init();

    // 7. Init comparisons — wire comparison card
    MeetingCost.Comparisons.init();

    // 8. Init history — render saved history
    MeetingCost.History.init();

    // 9. Init stats — render stats
    MeetingCost.Stats.init();

    // 10. Wire tab navigation
    _initTabs();

    // 11. Wire theme toggle
    _initThemeToggle();

    // 12. Wire toast system
    _initToast();

    // 13. Wire memo modal
    _initMemoModal();
  }

  // -----------------------------------------------------------
  // DOMContentLoaded entry point
  // -----------------------------------------------------------

  document.addEventListener('DOMContentLoaded', function () {
    init();
  });

  return {
    init: init
  };
})();
