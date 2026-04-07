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
    if (_totalEl) {
      if (mixedCurrency) {
        _totalEl.textContent = '합계: (혼합 통화)';
      } else {
        _totalEl.textContent = '합계: ' + firstCurrency +
          MeetingCost.Cost.formatCost(totalSum);
      }
    }

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
  }

  // -----------------------------------------------------------
  // Swipe + Expand handlers
  // -----------------------------------------------------------

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
            item.classList.add('history-item--removing');
            var id = item.getAttribute('data-id');
            setTimeout(function() {
              var removed = remove(id);
              if (removed) {
                _showUndoToast(removed);
              }
            }, 300);
          } else {
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

  function _attachExpandHandlers() {
    var items = _listEl.querySelectorAll('.history-item');
    for (var i = 0; i < items.length; i++) {
      (function(item) {
        var content = item.querySelector('.history-item__content');
        content.addEventListener('click', function() {
          if (item.classList.contains('history-item--swiping')) return;
          item.classList.toggle('history-item--expanded');
        });
      })(items[i]);
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
    remove: remove,
    update: update,
    render: render
  };
})();
