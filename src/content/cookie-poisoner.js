/* global chrome, browser */

(function () {
  'use strict';

  const aBrowser = typeof browser !== 'undefined' ? browser : chrome;

  function fPoisonCookies() {
    const aCookies = document.cookie.split(';');
    if (aCookies.length === 0) return Promise.resolve();

    aCookies.forEach((sCookie) => {
      const sTrimmed = sCookie.trim();
      if (!sTrimmed) return;
      const nEquals = sTrimmed.indexOf('=');
      if (nEquals === -1) return;
      const sName = sTrimmed.substring(0, nEquals).trim();
      const sValue = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      document.cookie = sName + '=' + sValue + '; path=/; max-age=3600';
    });

    aBrowser.runtime.sendMessage({
      sAction: 'logActivity',
      sMessage: 'Poisoned ' + aCookies.length + ' cookies on ' + window.location.hostname,
      sType: 'info'
    }).catch(() => {});

    return Promise.resolve();
  }

  window.fPoisonCookies = fPoisonCookies;
})();