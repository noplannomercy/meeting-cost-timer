var MeetingCost = MeetingCost || {};

MeetingCost.Timer = (function () {
  'use strict';

  // --- State machine states ---
  var STATE_IDLE    = 'IDLE';
  var STATE_RUNNING = 'RUNNING';
  var STATE_PAUSED  = 'PAUSED';

  // --- Internal state ---
  var _state          = STATE_IDLE;
  var _intervalId     = null;
  var _startTime      = 0;   // Date.now() at start (or resume-adjusted)
  var _pausedAt       = 0;   // Date.now() when paused
  var _pausedDuration = 0;   // total ms spent paused
  var _elapsed        = 0;   // seconds

  // --- DOM refs (resolved once in init) ---
  var _display    = null;
  var _btnStart   = null;
  var _btnPause   = null;
  var _btnReset   = null;

  // -----------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------

  function _pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function _formatElapsed(seconds) {
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = seconds % 60;
    return _pad(h) + ':' + _pad(m) + ':' + _pad(s);
  }

  function _updateDisplay() {
    if (_display) {
      _display.textContent = _formatElapsed(_elapsed);
    }
  }

  function _updateButtons() {
    if (!_btnStart || !_btnPause) return;
    if (_state === STATE_RUNNING) {
      _btnStart.style.display = 'none';
      _btnPause.style.display = '';
    } else {
      // IDLE or PAUSED
      _btnStart.style.display = '';
      _btnPause.style.display = 'none';
    }
  }

  function _dispatch(eventName, detail) {
    var evt;
    if (detail !== undefined) {
      evt = new CustomEvent(eventName, { detail: detail });
    } else {
      evt = new CustomEvent(eventName);
    }
    document.dispatchEvent(evt);
  }

  // -----------------------------------------------------------
  // Tick — called every 1 s by setInterval
  // -----------------------------------------------------------

  function _tick() {
    _elapsed = Math.floor((Date.now() - _startTime - _pausedDuration) / 1000);
    _updateDisplay();
    _dispatch('timer:tick', { elapsed: _elapsed, running: true });
  }

  // -----------------------------------------------------------
  // Public API
  // -----------------------------------------------------------

  function start() {
    if (_state === STATE_RUNNING) return; // double-click guard

    if (_state === STATE_IDLE) {
      _startTime      = Date.now();
      _pausedDuration = 0;
      _elapsed        = 0;
    } else if (_state === STATE_PAUSED) {
      // resume: add the time spent paused to the running total
      _pausedDuration += Date.now() - _pausedAt;
    }

    _state = STATE_RUNNING;
    _updateDisplay();
    _updateButtons();

    _intervalId = setInterval(_tick, 1000);
  }

  function pause() {
    if (_state !== STATE_RUNNING) return;

    clearInterval(_intervalId);
    _intervalId = null;
    _pausedAt   = Date.now();
    _state      = STATE_PAUSED;

    _updateButtons();
  }

  // resume is an alias for start() — the state machine handles it
  function resume() {
    start();
  }

  function stop() {
    if (_state === STATE_IDLE) return;

    clearInterval(_intervalId);
    _intervalId = null;

    // Final elapsed snapshot
    if (_state === STATE_RUNNING) {
      _elapsed = Math.floor((Date.now() - _startTime - _pausedDuration) / 1000);
    }
    // If PAUSED, _elapsed already holds the correct value

    var finalElapsed = _elapsed;

    _state          = STATE_IDLE;
    _elapsed        = 0;
    _startTime      = 0;
    _pausedAt       = 0;
    _pausedDuration = 0;

    _updateDisplay();
    _updateButtons();

    _dispatch('timer:stop', { elapsed: finalElapsed });
  }

  function reset() {
    clearInterval(_intervalId);
    _intervalId     = null;
    _state          = STATE_IDLE;
    _elapsed        = 0;
    _startTime      = 0;
    _pausedAt       = 0;
    _pausedDuration = 0;

    _updateDisplay();
    _updateButtons();

    _dispatch('timer:reset');
  }

  function getElapsed() {
    return _elapsed;
  }

  function isRunning() {
    return _state === STATE_RUNNING;
  }

  // -----------------------------------------------------------
  // init — wire DOM elements and button handlers
  // -----------------------------------------------------------

  function init() {
    _display  = document.getElementById('timer-display');
    _btnStart = document.getElementById('btn-start');
    _btnPause = document.getElementById('btn-pause');
    _btnReset = document.getElementById('btn-reset');

    if (_btnStart) {
      _btnStart.addEventListener('click', function () {
        if (_state === STATE_IDLE) {
          start();
        } else if (_state === STATE_PAUSED) {
          resume();
        }
      });
    }

    if (_btnPause) {
      _btnPause.addEventListener('click', function () {
        pause();
      });
    }

    if (_btnReset) {
      _btnReset.addEventListener('click', function () {
        if (_state === STATE_RUNNING || _state === STATE_PAUSED) {
          clearInterval(_intervalId);
          _intervalId = null;

          if (_state === STATE_RUNNING) {
            _elapsed = Math.floor((Date.now() - _startTime - _pausedDuration) / 1000);
          }

          var finalElapsed = _elapsed;

          if (finalElapsed >= 1) {
            _dispatch('memo:request', { elapsed: finalElapsed });
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

    // Auto-pause when tab/device sleeps to prevent inflated times
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && _state === STATE_RUNNING) {
        pause();
      }
    });

    // Set initial display and button state
    _updateDisplay();
    _updateButtons();
  }

  // -----------------------------------------------------------
  // Public interface
  // -----------------------------------------------------------

  return {
    init:       init,
    start:      start,
    pause:      pause,
    resume:     resume,
    stop:       stop,
    reset:      reset,
    getElapsed: getElapsed,
    isRunning:  isRunning
  };
})();
