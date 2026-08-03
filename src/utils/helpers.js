(function () {
  'use strict';

  function fSleep(nMs) {
    return new Promise((resolve) => setTimeout(resolve, nMs));
  }

  function fRandomInt(nMin, nMax) {
    return Math.floor(Math.random() * (nMax - nMin + 1)) + nMin;
  }

  function fPickRandom(aArray) {
    if (!aArray || aArray.length === 0) return null;
    return aArray[fRandomInt(0, aArray.length - 1)];
  }

  function fTruncateString(sStr, nMaxLen) {
    if (sStr.length <= nMaxLen) return sStr;
    return sStr.substring(0, nMaxLen - 3) + '...';
  }

  function fSanitizeDomain(sDomain) {
    return sDomain.replace(/[^a-zA-Z0-9.-]/g, '').toLowerCase();
  }

  function fIsURL(sStr) {
    try {
      const oUrl = new URL(sStr);
      return oUrl.protocol === 'http:' || oUrl.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  function fGetHostname(sUrl) {
    try {
      return new URL(sUrl).hostname;
    } catch (_) {
      return '';
    }
  }

  function fFormatTimestamp(nTimestamp) {
    return new Date(nTimestamp).toISOString();
  }

  function fGenerateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function fDebounce(fn, nDelay) {
    let nTimer = null;
    return function (...aArgs) {
      if (nTimer) clearTimeout(nTimer);
      nTimer = setTimeout(() => {
        fn.apply(this, aArgs);
        nTimer = null;
      }, nDelay);
    };
  }

  function fThrottle(fn, nLimit) {
    let nLastCall = 0;
    return function (...aArgs) {
      const nNow = Date.now();
      if (nNow - nLastCall >= nLimit) {
        nLastCall = nNow;
        fn.apply(this, aArgs);
      }
    };
  }

  // Expose all functions
  window.fSleep = fSleep;
  window.fRandomInt = fRandomInt;
  window.fPickRandom = fPickRandom;
  window.fTruncateString = fTruncateString;
  window.fSanitizeDomain = fSanitizeDomain;
  window.fIsURL = fIsURL;
  window.fGetHostname = fGetHostname;
  window.fFormatTimestamp = fFormatTimestamp;
  window.fGenerateUUID = fGenerateUUID;
  window.fDebounce = fDebounce;
  window.fThrottle = fThrottle;
})();