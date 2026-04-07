var MeetingCost = MeetingCost || {};

MeetingCost.Emotion = (function () {
  'use strict';

  var STAGES = [
    { id: 'calm',   max: 900,        color: '#3FB950', emoji: '😌', message: '순조롭습니다' },
    { id: 'warn',   max: 1800,       color: '#D29922', emoji: '😐', message: '슬슬 길어지네요' },
    { id: 'alert',  max: 3600,       color: '#DB6D28', emoji: '😰', message: '이쯤이면...' },
    { id: 'danger', max: Infinity,   color: '#F85149', emoji: '🔥', message: '회의의 늪' }
  ];

  var _currentStageIndex = 0;

  var _emojiEl   = null;
  var _messageEl = null;
  var _dots      = null;

  function _getStageIndexForElapsed(elapsed) {
    var i;
    for (i = 0; i < STAGES.length; i++) {
      if (elapsed < STAGES[i].max) {
        return i;
      }
    }
    return STAGES.length - 1;
  }

  function _applyStage(index) {
    var stage = STAGES[index];

    // Update body class
    var body = document.body;
    var i;
    for (i = 0; i < STAGES.length; i++) {
      body.classList.remove('stage-' + STAGES[i].id);
    }
    body.classList.add('stage-' + stage.id);

    // Update emoji and message
    if (_emojiEl) {
      _emojiEl.textContent = stage.emoji;
    }
    if (_messageEl) {
      _messageEl.textContent = stage.message;
    }

    // Update stage dots
    if (_dots) {
      for (i = 0; i < _dots.length; i++) {
        if (i === index) {
          _dots[i].classList.add('active');
        } else {
          _dots[i].classList.remove('active');
        }
      }
    }

    _currentStageIndex = index;
  }

  function _onTick(evt) {
    var elapsed = evt.detail && evt.detail.elapsed ? evt.detail.elapsed : 0;
    var newIndex = _getStageIndexForElapsed(elapsed);
    if (newIndex !== _currentStageIndex) {
      _applyStage(newIndex);
    }
  }

  function _onReset() {
    _applyStage(0);
  }

  function init() {
    _emojiEl   = document.getElementById('emotion-emoji');
    _messageEl = document.getElementById('emotion-message');
    _dots      = document.querySelectorAll('.stage-dot');

    _applyStage(0);

    document.addEventListener('timer:tick',  _onTick);
    document.addEventListener('timer:reset', _onReset);
  }

  function getCurrentStage() {
    return STAGES[_currentStageIndex];
  }

  return {
    init:            init,
    getCurrentStage: getCurrentStage
  };
})();
