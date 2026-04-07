var MeetingCost = MeetingCost || {};

MeetingCost.Cost = (function () {
  'use strict';

  // --- Internal state ---
  var _totalCost    = 0;
  var _attendees    = 5;
  var _hourlyRate   = 35000;
  var _currency     = '₩';
  var _hasOdometer  = false;

  // --- DOM refs ---
  var _costDisplay  = null;
  var _costCurrency = null;
  var _wrapper      = null;

  // -----------------------------------------------------------
  // formatCost — static formatter, thousand separators, no symbol
  // -----------------------------------------------------------

  function formatCost(value) {
    if (value < 0) value = 0;
    var n = Math.round(value);
    var str = '' + n;
    var result = '';
    var count = 0;
    var i;
    for (i = str.length - 1; i >= 0; i--) {
      if (count > 0 && count % 3 === 0) {
        result = ',' + result;
      }
      result = str[i] + result;
      count++;
    }
    return result;
  }

  // -----------------------------------------------------------
  // _readSettings — read current values from DOM inputs
  // -----------------------------------------------------------

  function _readSettings() {
    var attendeesEl = document.getElementById('input-attendees');
    var rateEl      = document.getElementById('input-rate');
    var currencyEl  = document.getElementById('input-currency');

    var a = attendeesEl ? parseFloat(attendeesEl.value) : NaN;
    var r = rateEl      ? parseFloat(rateEl.value)      : NaN;

    _attendees  = isNaN(a) ? 5     : a;
    _hourlyRate = isNaN(r) ? 35000 : r;
    _currency   = (currencyEl && currencyEl.value) ? currencyEl.value : '₩';
  }

  // -----------------------------------------------------------
  // _updateCurrencyDisplay — set #cost-currency textContent
  // -----------------------------------------------------------

  function _updateCurrencyDisplay() {
    if (_costCurrency) {
      _costCurrency.textContent = _currency;
    }
  }

  // -----------------------------------------------------------
  // _updateResponsiveClass — large number font adjustment
  // -----------------------------------------------------------

  function _updateResponsiveClass(value) {
    if (!_wrapper) return;
    if (value >= 10000000) {
      _wrapper.classList.add('cost-display--large');
    } else {
      _wrapper.classList.remove('cost-display--large');
    }
  }

  // -----------------------------------------------------------
  // _renderCost — update the odometer element
  // -----------------------------------------------------------

  function _renderCost(value) {
    if (!_costDisplay) return;

    if (_hasOdometer) {
      // Odometer.js watches MutationObserver for value changes
      _costDisplay.textContent = value;
    } else {
      _costDisplay.textContent = formatCost(value);
    }
  }

  // -----------------------------------------------------------
  // Event handlers
  // -----------------------------------------------------------

  function _onTick(evt) {
    var elapsed = evt.detail && evt.detail.elapsed ? evt.detail.elapsed : 0;
    _totalCost = Math.round(_attendees * (_hourlyRate / 3600) * elapsed);
    _renderCost(_totalCost);
    _updateResponsiveClass(_totalCost);
  }

  function _onReset() {
    _totalCost = 0;
    _renderCost(_totalCost);
    _updateResponsiveClass(_totalCost);
  }

  function _onSettingsChange(evt) {
    if (evt && evt.detail) {
      if (evt.detail.attendees !== undefined) {
        _attendees = isNaN(evt.detail.attendees) ? 5 : evt.detail.attendees;
      }
      if (evt.detail.hourlyRate !== undefined) {
        _hourlyRate = isNaN(evt.detail.hourlyRate) ? 35000 : evt.detail.hourlyRate;
      }
      if (evt.detail.currency !== undefined) {
        _currency = evt.detail.currency || '₩';
      }
    } else {
      _readSettings();
    }
    _updateCurrencyDisplay();
  }

  // -----------------------------------------------------------
  // Public API
  // -----------------------------------------------------------

  function getTotalCost() {
    return _totalCost;
  }

  function init() {
    // Resolve DOM refs
    _costDisplay  = document.getElementById('cost-display');
    _costCurrency = document.getElementById('cost-currency');
    _wrapper      = _costDisplay ? _costDisplay.closest('.cost-display-wrapper') : null;

    // Detect Odometer.js
    _hasOdometer = typeof window.Odometer !== 'undefined';

    // Read initial settings from DOM
    _readSettings();
    _updateCurrencyDisplay();

    // Wire event listeners
    document.addEventListener('timer:tick',      _onTick);
    document.addEventListener('timer:reset',     _onReset);
    document.addEventListener('settings:change', _onSettingsChange);

    // Initial render (settings:change event from Settings.init() will sync values)
    _renderCost(_totalCost);
    _updateResponsiveClass(_totalCost);
  }

  return {
    init:       init,
    getTotalCost: getTotalCost,
    formatCost:   formatCost
  };
})();
