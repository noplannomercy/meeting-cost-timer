var MeetingCost = MeetingCost || {};

MeetingCost.Stats = (function () {
  'use strict';

  var ACCENT_COLOR      = '#FF6B35';
  var ACCENT_FILL_COLOR = 'rgba(255,107,53,0.15)';
  var SPARKLINE_MAX     = 20;
  var CANVAS_HEIGHT     = 120;
  var PADDING           = 12;

  var _countEl     = null;
  var _totalCostEl = null;
  var _avgTimeEl   = null;
  var _avgCostEl   = null;
  var _canvas      = null;
  var _emptyEl     = null;

  // -----------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------

  function _padTwo(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function _formatAvgDuration(seconds) {
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return _padTwo(m) + ':' + _padTwo(s);
  }

  // -----------------------------------------------------------
  // Canvas sparkline
  // -----------------------------------------------------------

  function _drawSparkline(records) {
    if (!_canvas) return;

    var ctx = _canvas.getContext('2d');
    var w = _canvas.offsetWidth || _canvas.width;
    _canvas.width = w;
    _canvas.height = CANVAS_HEIGHT;

    ctx.clearRect(0, 0, w, CANVAS_HEIGHT);

    var count = records.length;

    if (count === 0) {
      if (_emptyEl) { _emptyEl.style.display = ''; }
      _canvas.style.display = 'none';
      return;
    }

    if (_emptyEl) { _emptyEl.style.display = 'none'; }
    _canvas.style.display = '';

    var data = records.slice(-SPARKLINE_MAX);
    // data[0] is oldest (left), data[data.length-1] is newest (right)
    // History stores newest-first so we need to reverse
    data = data.slice().reverse();

    var n = data.length;

    if (n === 1) {
      // Single dot in center
      var cx = w / 2;
      var cy = CANVAS_HEIGHT / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
      ctx.fillStyle = ACCENT_COLOR;
      ctx.fill();
      return;
    }

    // Compute min/max cost
    var minCost = data[0].totalCost;
    var maxCost = data[0].totalCost;
    var i;
    for (i = 1; i < n; i++) {
      if (data[i].totalCost < minCost) { minCost = data[i].totalCost; }
      if (data[i].totalCost > maxCost) { maxCost = data[i].totalCost; }
    }

    // Avoid division by zero when all values equal
    var range = maxCost - minCost;
    if (range === 0) { range = 1; }

    var drawW = w - PADDING * 2;
    var drawH = CANVAS_HEIGHT - PADDING * 2;

    function xAt(idx) {
      return PADDING + (idx / (n - 1)) * drawW;
    }

    function yAt(cost) {
      // Invert: high cost => low y
      return PADDING + (1 - (cost - minCost) / range) * drawH;
    }

    // Build point coords
    var pts = [];
    for (i = 0; i < n; i++) {
      pts.push({ x: xAt(i), y: yAt(data[i].totalCost) });
    }

    // Fill area below polyline
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (i = 1; i < n; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.lineTo(pts[n - 1].x, CANVAS_HEIGHT - PADDING);
    ctx.lineTo(pts[0].x, CANVAS_HEIGHT - PADDING);
    ctx.closePath();
    ctx.fillStyle = ACCENT_FILL_COLOR;
    ctx.fill();

    // Draw polyline
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (i = 1; i < n; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = ACCENT_COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw dots
    for (i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = ACCENT_COLOR;
      ctx.fill();
    }
  }

  // -----------------------------------------------------------
  // Public API
  // -----------------------------------------------------------

  function refresh() {
    var records = MeetingCost.History.getAll();
    var count   = records.length;
    var currency = MeetingCost.Settings.getCurrency();

    var totalCost    = 0;
    var totalSeconds = 0;
    var i;

    for (i = 0; i < count; i++) {
      totalCost    += records[i].totalCost;
      totalSeconds += records[i].duration;
    }

    var avgDuration = count > 0 ? Math.round(totalSeconds / count) : 0;
    var avgCost     = count > 0 ? Math.round(totalCost    / count) : 0;

    if (_countEl) {
      _countEl.textContent = String(count);
    }
    if (_totalCostEl) {
      _totalCostEl.textContent = currency + MeetingCost.Cost.formatCost(totalCost);
    }
    if (_avgTimeEl) {
      _avgTimeEl.textContent = _formatAvgDuration(avgDuration);
    }
    if (_avgCostEl) {
      _avgCostEl.textContent = currency + MeetingCost.Cost.formatCost(avgCost);
    }

    _drawSparkline(records);
  }

  function init() {
    _countEl     = document.getElementById('stat-count');
    _totalCostEl = document.getElementById('stat-total-cost');
    _avgTimeEl   = document.getElementById('stat-avg-time');
    _avgCostEl   = document.getElementById('stat-avg-cost');
    _canvas      = document.getElementById('sparkline-canvas');
    _emptyEl     = document.getElementById('stats-empty');

    refresh();

    document.addEventListener('timer:stop',      refresh);
    document.addEventListener('history:updated', refresh);
  }

  return {
    init:    init,
    refresh: refresh
  };
})();
