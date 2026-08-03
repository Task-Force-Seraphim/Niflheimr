(function () {
  'use strict';

  function fApplyTimerJitter() {
    const oOriginalPerfNow = performance.now;
    performance.now = function () {
      return oOriginalPerfNow.call(this) + Math.random() * 5;
    };

    const oOriginalDateNow = Date.now;
    Date.now = function () {
      return oOriginalDateNow.call(this) + Math.random() * 5;
    };
  }

  window.fApplyTimerJitter = fApplyTimerJitter;
})();