/* global chrome, browser */

console.log('NIFLHEIM CONTENT: detector.js loaded');

(function () {
  'use strict';

  console.log('NIFLHEIM CONTENT: detector.js IIFE running');

  const aBrowser = typeof browser !== 'undefined' ? browser : chrome;

  // Start with fallback hardcoded list
  let aTrackerRules = [
    { pattern: 'google-analytics\\.com', company: 'Google' },
    { pattern: 'googletagmanager\\.com', company: 'Google' },
    { pattern: 'facebook\\.com\\/tr', company: 'Facebook' },
    { pattern: 'doubleclick\\.net', company: 'Google' },
    { pattern: 'twitter\\.com\\/analytics', company: 'Twitter' },
    { pattern: 'linkedin\\.com\\/analytics', company: 'LinkedIn' }
  ];
  let aCookieProviders = ['Google', 'Facebook', 'Twitter', 'LinkedIn'];

  function fLoadTrackerRules() {
    console.log('NIFLHEIM CONTENT: fLoadTrackerRules starting');
    fetch(aBrowser.runtime.getURL('data/trackers.json'), { credentials: 'omit' })
      .then((oResponse) => {
        if (!oResponse.ok) throw new Error('HTTP ' + oResponse.status);
        return oResponse.json();
      })
      .then((oData) => {
        if (oData.trackers) aTrackerRules = oData.trackers;
        if (oData.cookie_providers) aCookieProviders = oData.cookie_providers;
        console.log('NIFLHEIM CONTENT: Loaded ' + aTrackerRules.length + ' tracker rules from JSON');
      })
      .catch((oErr) => {
        console.warn('NIFLHEIM CONTENT: Failed to load trackers.json, using fallback:', oErr);
      });
  }

  function fDetectSurveillance() {
    console.log('NIFLHEIM CONTENT: Running surveillance detection on ' + window.location.hostname);
    const oResult = {
      aTrackers: [],
      bFrost: false,
      aCookieCompanies: []
    };

    const aScripts = document.querySelectorAll('script[src]');
    console.log('NIFLHEIM CONTENT: found ' + aScripts.length + ' script tags');
    aScripts.forEach((oScript) => {
      const sSrc = oScript.src || '';
      for (const oRule of aTrackerRules) {
        try {
          if (new RegExp(oRule.pattern, 'i').test(sSrc)) {
            if (!oResult.aTrackers.includes(oRule.company)) {
              oResult.aTrackers.push(oRule.company);
            }
            if (!oResult.aCookieCompanies.includes(oRule.company)) {
              oResult.aCookieCompanies.push(oRule.company);
            }
            break;
          }
        } catch (_) { /* ignore regex errors */ }
      }
    });

    try {
      const sBodyText = document.body ? document.body.innerText : '';
      for (const sProvider of aCookieProviders) {
        if (sBodyText.includes(sProvider) && !oResult.aCookieCompanies.includes(sProvider)) {
          oResult.aCookieCompanies.push(sProvider);
        }
      }
    } catch (_) { /* ignore */ }

    navigator.storage.estimate().then((oEst) => {
      const nUsage = oEst.usage || 0;
      if (nUsage > 512 * 1024 * 1024) {
        oResult.bFrost = true;
        aBrowser.runtime.sendMessage({
          sAction: 'logActivity',
          sMessage: 'FROST detected on ' + window.location.hostname + ' (OPFS: ' + (nUsage / (1024 * 1024)).toFixed(2) + ' MB)',
          sType: 'warning'
        }).catch(() => {});
      }
    }).catch(() => {});

    console.log('NIFLHEIM CONTENT: Detection result for ' + window.location.hostname, oResult);
    return oResult;
  }

  window.fDetectSurveillance = fDetectSurveillance;
  console.log('NIFLHEIM CONTENT: fDetectSurveillance assigned to window');

  fLoadTrackerRules();

  console.log('NIFLHEIM CONTENT: detector.js finished');
})();