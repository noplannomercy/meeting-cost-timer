var MeetingCost = MeetingCost || {};

MeetingCost.Comparisons = (function () {
  'use strict';

  var ITEMS = [
    { name: '자판기 커피',       cost: 500,     emoji: '☕' },
    { name: '편의점 삼각김밥',   cost: 1200,    emoji: '🍙' },
    { name: '아메리카노',        cost: 4500,    emoji: '☕' },
    { name: '택시 기본요금',     cost: 4800,    emoji: '🚕' },
    { name: '점심 김치찌개',     cost: 8000,    emoji: '🍲' },
    { name: '영화 티켓',        cost: 15000,   emoji: '🎬' },
    { name: '치킨 한 마리',     cost: 20000,   emoji: '🍗' },
    { name: '피자 한 판',       cost: 25000,   emoji: '🍕' },
    { name: '스타벅스 텀블러',   cost: 35000,   emoji: '🥤' },
    { name: '제주도 왕복 항공권', cost: 150000,  emoji: '✈️' },
    { name: '에어팟',           cost: 250000,  emoji: '🎧' },
    { name: '닌텐도 스위치',     cost: 360000,  emoji: '🎮' },
    { name: '아이패드',         cost: 600000,  emoji: '📱' },
    { name: '맥북 에어',        cost: 1500000, emoji: '💻' },
    { name: '하와이 여행',       cost: 3000000, emoji: '🏝️' }
  ];

  var _lastItemIndex = -1;

  var _cardEl      = null;
  var _emojiEl     = null;
  var _textEl      = null;
  var _slideTimer  = null;

  function _findBestItemIndex(totalCost) {
    var best = -1;
    var i;
    for (i = 0; i < ITEMS.length; i++) {
      if (totalCost >= ITEMS[i].cost) {
        best = i;
      }
    }
    return best;
  }

  function _updateCard(itemIndex, totalCost) {
    var item = ITEMS[itemIndex];
    var count = Math.floor(totalCost / item.cost);

    if (_emojiEl) {
      _emojiEl.textContent = item.emoji;
    }
    if (_textEl) {
      _textEl.textContent = item.name + ' ' + count + '개';
    }
  }

  function _triggerSlideIn() {
    if (!_cardEl) return;
    _cardEl.classList.add('slide-in');
    if (_slideTimer) {
      clearTimeout(_slideTimer);
    }
    _slideTimer = setTimeout(function () {
      if (_cardEl) {
        _cardEl.classList.remove('slide-in');
      }
      _slideTimer = null;
    }, 300);
  }

  function _onTick() {
    var totalCost = MeetingCost.Cost.getTotalCost();
    var newIndex = _findBestItemIndex(totalCost);

    if (newIndex === -1) {
      return;
    }

    if (newIndex !== _lastItemIndex) {
      _updateCard(newIndex, totalCost);
      _triggerSlideIn();
      _lastItemIndex = newIndex;
    } else {
      _updateCard(newIndex, totalCost);
    }
  }

  function _onReset() {
    _lastItemIndex = -1;

    if (_emojiEl) {
      _emojiEl.textContent = '☕';
    }
    if (_textEl) {
      _textEl.textContent = '커피 0잔';
    }
    if (_cardEl) {
      _cardEl.classList.remove('slide-in');
    }
    if (_slideTimer) {
      clearTimeout(_slideTimer);
      _slideTimer = null;
    }
  }

  function init() {
    _cardEl  = document.getElementById('comparison-card');
    _emojiEl = document.getElementById('comparison-emoji');
    _textEl  = document.getElementById('comparison-text');

    document.addEventListener('timer:tick',  _onTick);
    document.addEventListener('timer:reset', _onReset);
  }

  return {
    init: init
  };
})();
