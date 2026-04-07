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
    document.addEventListener('toast:show', function (evt) {
      var container = document.getElementById('toast-container');
      if (!container) return;

      var message = evt.detail && evt.detail.message ? evt.detail.message : '';

      var toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      container.appendChild(toast);

      setTimeout(function () {
        toast.classList.add('toast--exit');
        setTimeout(function () {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
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
