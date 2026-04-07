var MeetingCost = MeetingCost || {};

MeetingCost.Settings = (function () {
  'use strict';

  var STORAGE_KEY = 'meetingcost_settings';

  var DEFAULTS = {
    attendees:   5,
    hourlyRate:  35000,
    currency:    '₩',
    theme:       'dark'
  };

  var _settings = {
    attendees:   DEFAULTS.attendees,
    hourlyRate:  DEFAULTS.hourlyRate,
    currency:    DEFAULTS.currency,
    theme:       DEFAULTS.theme
  };

  var _attendeesEl      = null;
  var _rateEl           = null;
  var _currencyEl       = null;
  var _errorAttendeesEl = null;
  var _errorRateEl      = null;

  // -----------------------------------------------------------
  // Persistence
  // -----------------------------------------------------------

  function _load() {
    var saved = MeetingCost.Storage.get(STORAGE_KEY, null);
    if (!saved) return;

    if (typeof saved.attendees  === 'number' && saved.attendees  >= 1 && saved.attendees  <= 100) {
      _settings.attendees = Math.floor(saved.attendees);
    }
    if (typeof saved.hourlyRate === 'number' && saved.hourlyRate >= 1) {
      _settings.hourlyRate = Math.floor(saved.hourlyRate);
    }
    if (typeof saved.currency === 'string' && saved.currency) {
      _settings.currency = saved.currency;
    }
    if (typeof saved.theme === 'string' && saved.theme) {
      _settings.theme = saved.theme;
    }
  }

  function _save() {
    MeetingCost.Storage.set(STORAGE_KEY, {
      attendees:  _settings.attendees,
      hourlyRate: _settings.hourlyRate,
      currency:   _settings.currency,
      theme:      _settings.theme
    });
  }

  // -----------------------------------------------------------
  // Dispatch
  // -----------------------------------------------------------

  function _dispatch() {
    document.dispatchEvent(new CustomEvent('settings:change', {
      detail: {
        attendees:  _settings.attendees,
        hourlyRate: _settings.hourlyRate,
        currency:   _settings.currency
      }
    }));
  }

  // -----------------------------------------------------------
  // Validation helpers
  // -----------------------------------------------------------

  function _setError(inputEl, errorEl, message) {
    if (inputEl) inputEl.classList.add('invalid');
    if (errorEl) errorEl.textContent = message;
  }

  function _clearError(inputEl, errorEl) {
    if (inputEl) inputEl.classList.remove('invalid');
    if (errorEl) errorEl.textContent = '';
  }

  // -----------------------------------------------------------
  // Input handlers
  // -----------------------------------------------------------

  function _onAttendeesInput() {
    var raw = _attendeesEl ? _attendeesEl.value : '';
    var val = parseInt(raw, 10);

    if (isNaN(val) || val < 1 || val > 100 || ('' + val) !== ('' + Math.floor(parseFloat(raw)))) {
      _setError(_attendeesEl, _errorAttendeesEl, '1~100 사이의 정수를 입력하세요');
      return;
    }

    _clearError(_attendeesEl, _errorAttendeesEl);
    _settings.attendees = val;
    _save();
    _dispatch();
  }

  function _onRateInput() {
    var raw = _rateEl ? _rateEl.value : '';
    var val = parseInt(raw, 10);

    if (isNaN(val) || val < 1 || ('' + val) !== ('' + Math.floor(parseFloat(raw)))) {
      _setError(_rateEl, _errorRateEl, '1 이상의 정수를 입력하세요');
      return;
    }

    _clearError(_rateEl, _errorRateEl);
    _settings.hourlyRate = val;
    _save();
    _dispatch();
  }

  function _onCurrencyChange() {
    var val = _currencyEl ? _currencyEl.value : '';
    if (!val) return;

    _settings.currency = val;
    _save();
    _dispatch();
  }

  // -----------------------------------------------------------
  // Apply loaded settings to DOM inputs
  // -----------------------------------------------------------

  function _applyToDOM() {
    if (_attendeesEl) {
      _attendeesEl.value = _settings.attendees;
    }
    if (_rateEl) {
      _rateEl.value = _settings.hourlyRate;
    }
    if (_currencyEl) {
      _currencyEl.value = _settings.currency;
    }
  }

  // -----------------------------------------------------------
  // Public API
  // -----------------------------------------------------------

  function getAttendees() {
    return _settings.attendees;
  }

  function getHourlyRate() {
    return _settings.hourlyRate;
  }

  function getCurrency() {
    return _settings.currency;
  }

  function getTheme() {
    return _settings.theme;
  }

  function setTheme(theme) {
    _settings.theme = theme;
    _save();
  }

  function init() {
    _attendeesEl      = document.getElementById('input-attendees');
    _rateEl           = document.getElementById('input-rate');
    _currencyEl       = document.getElementById('input-currency');
    _errorAttendeesEl = document.getElementById('error-attendees');
    _errorRateEl      = document.getElementById('error-rate');

    _load();
    _applyToDOM();

    if (_attendeesEl) {
      _attendeesEl.addEventListener('input', _onAttendeesInput);
    }
    if (_rateEl) {
      _rateEl.addEventListener('input', _onRateInput);
    }
    if (_currencyEl) {
      _currencyEl.addEventListener('change', _onCurrencyChange);
    }

    // Dispatch initial settings so Cost and others sync up
    _dispatch();
  }

  return {
    init:         init,
    getAttendees: getAttendees,
    getHourlyRate: getHourlyRate,
    getCurrency:  getCurrency,
    getTheme:     getTheme,
    setTheme:     setTheme
  };
})();
