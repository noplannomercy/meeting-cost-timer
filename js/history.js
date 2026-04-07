var MeetingCost = MeetingCost || {};

MeetingCost.History = (function () {
  'use strict';

  var STORAGE_KEY = 'meetingcost_history';

  var _records = [];

  var _listEl  = null;
  var _emptyEl = null;
  var _totalEl = null;

  // -----------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------

  var _DAYS = ['일', '월', '화', '수', '목', '금', '토'];

  function _formatDate(dateStr) {
    // dateStr: "YYYY-MM-DD"
    var parts = dateStr.split('-');
    var d = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
    );
    return dateStr + ' (' + _DAYS[d.getDay()] + ')';
  }

  function _formatDuration(seconds) {
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = seconds % 60;
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    if (h > 0) {
      return h + 'h ' + pad(m) + 'm ' + pad(s) + 's';
    }
    return pad(m) + 'm ' + pad(s) + 's';
  }

  function _costClass(duration) {
    if (duration < 900)  return 'cost--calm';
    if (duration < 1800) return 'cost--warn';
    if (duration < 3600) return 'cost--alert';
    return 'cost--danger';
  }

  function _todayStr() {
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth() + 1;
    var d = now.getDate();
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return y + '-' + pad(m) + '-' + pad(d);
  }

  // -----------------------------------------------------------
  // Storage
  // -----------------------------------------------------------

  function _load() {
    _records = MeetingCost.Storage.get(STORAGE_KEY, []);
    if (!Array.isArray(_records)) {
      _records = [];
    }
  }

  function _save() {
    MeetingCost.Storage.setWithRetry(STORAGE_KEY, _records, function () {
      // retryFn: remove the oldest record (last in array, since we store newest-first)
      if (_records.length > 0) {
        _records.pop();
      }
    });
  }

  // -----------------------------------------------------------
  // Render
  // -----------------------------------------------------------

  function render() {
    if (!_listEl) return;

    // Clear existing items (keep the empty-state div)
    var children = _listEl.childNodes;
    var toRemove = [];
    var i;
    for (i = 0; i < children.length; i++) {
      if (children[i] !== _emptyEl) {
        toRemove.push(children[i]);
      }
    }
    for (i = 0; i < toRemove.length; i++) {
      _listEl.removeChild(toRemove[i]);
    }

    if (_records.length === 0) {
      if (_emptyEl) { _emptyEl.style.display = ''; }
      if (_totalEl) { _totalEl.textContent = ''; }
      return;
    }

    if (_emptyEl) { _emptyEl.style.display = 'none'; }

    // Total cost sum + mixed currency check
    var totalSum = 0;
    var firstCurrency = _records[0].currency || '';
    var mixedCurrency = false;
    for (i = 0; i < _records.length; i++) {
      totalSum += _records[i].totalCost;
      if ((_records[i].currency || '') !== firstCurrency) {
        mixedCurrency = true;
      }
    }
    var displayCurrency = mixedCurrency ? '?' : firstCurrency;
    if (_totalEl) {
      _totalEl.textContent = '합계: ' + displayCurrency +
        MeetingCost.Cost.formatCost(totalSum);
    }

    // Render items (newest-first, records[0] is newest)
    for (i = 0; i < _records.length; i++) {
      var rec = _records[i];

      var item = document.createElement('div');
      item.className = 'history-item';

      // Left: date + meta
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

      // Right: cost
      var right = document.createElement('div');
      right.className = 'history-item__cost ' + _costClass(rec.duration);
      right.textContent = (rec.currency || '') + MeetingCost.Cost.formatCost(rec.totalCost);

      item.appendChild(left);
      item.appendChild(right);

      _listEl.appendChild(item);
    }
  }

  // -----------------------------------------------------------
  // Public API
  // -----------------------------------------------------------

  function getAll() {
    return _records;
  }

  function add(record) {
    _records.unshift(record); // newest first
    _save();
    render();
  }

  function _onTimerStop(evt) {
    var elapsed = (evt.detail && typeof evt.detail.elapsed === 'number') ? evt.detail.elapsed : 0;
    if (elapsed < 1) return;  // Don't save zero-duration meetings

    var record = {
      id:         String(Date.now()),
      date:       _todayStr(),
      duration:   elapsed,
      attendees:  MeetingCost.Settings.getAttendees(),
      hourlyRate: MeetingCost.Settings.getHourlyRate(),
      totalCost:  MeetingCost.Cost.getTotalCost(),
      currency:   MeetingCost.Settings.getCurrency()
    };

    add(record);

    // Notify stats module
    document.dispatchEvent(new CustomEvent('history:updated'));
  }

  function init() {
    _listEl  = document.getElementById('history-list');
    _emptyEl = document.getElementById('history-empty');
    _totalEl = document.getElementById('history-total');

    _load();
    render();

    document.addEventListener('timer:stop', _onTimerStop);
  }

  return {
    init:   init,
    getAll: getAll,
    add:    add,
    render: render
  };
})();
