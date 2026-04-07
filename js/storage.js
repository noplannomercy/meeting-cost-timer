var MeetingCost = MeetingCost || {};

MeetingCost.Storage = (function() {
  'use strict';

  var _available = null;

  function isAvailable() {
    if (_available !== null) return _available;
    try {
      var test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      _available = true;
    } catch (e) {
      _available = false;
    }
    return _available;
  }

  function get(key, defaultValue) {
    if (!isAvailable()) return defaultValue;
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[Storage] Parse error for key "' + key + '", resetting to default.', e);
      _showToast('데이터 복구됨');
      remove(key);
      return defaultValue;
    }
  }

  function set(key, value) {
    if (!isAvailable()) {
      _showToast('저장 불가 — 브라우저 설정을 확인하세요');
      return false;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        _showToast('저장 공간 부족');
        return false;
      }
      console.warn('[Storage] Write error for key "' + key + '".', e);
      return false;
    }
  }

  function setWithRetry(key, value, retryFn) {
    if (set(key, value)) return true;
    if (typeof retryFn === 'function') {
      retryFn();
      return set(key, value);
    }
    return false;
  }

  function remove(key) {
    if (!isAvailable()) return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // silent
    }
  }

  function _showToast(message) {
    document.dispatchEvent(new CustomEvent('toast:show', {
      detail: { message: message }
    }));
  }

  return {
    isAvailable: isAvailable,
    get: get,
    set: set,
    setWithRetry: setWithRetry,
    remove: remove
  };
})();
