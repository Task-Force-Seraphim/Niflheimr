/* global chrome, browser */

console.log('NIFLHEIM BACKGROUND: jotnar-sentinel.js loaded');

(function () {
  'use strict';

  console.log('NIFLHEIM BACKGROUND: jotnar-sentinel IIFE');

  const aBrowser = typeof browser !== 'undefined' ? browser : chrome;

  let oStateRef = null;
  let fLogRef = null;

  function fInit(oState, fLog) {
    console.log('NIFLHEIM BACKGROUND: jotnar-sentinel fInit');
    oStateRef = oState;
    fLogRef = fLog;
  }

  function fHandleDetection(oDetection) {
    console.log('NIFLHEIM BACKGROUND: jotnar-sentinel fHandleDetection', oDetection);
    if (!oStateRef || !oStateRef.bProtectionEnabled) {
      if (fLogRef) fLogRef('Detection received but protection disabled', 'debug');
      return;
    }

    const sDomain = oDetection.sDomain || 'unknown';
    const aTrackers = oDetection.aTrackers || [];
    const bFrost = !!oDetection.bFrost;
    const aFingerprinting = oDetection.aFingerprinting || [];
    const aCookieCompanies = oDetection.aCookieCompanies || [];

    let sMessage = 'Surveillance detected on ' + sDomain;
    if (aTrackers.length > 0) {
      sMessage += ' Trackers: ' + aTrackers.join(', ');
    }
    if (bFrost) {
      sMessage += ' FROST detected!';
    }
    if (aFingerprinting.length > 0) {
      sMessage += ' Fingerprinting: ' + aFingerprinting.join(', ');
    }
    if (fLogRef) fLogRef(sMessage, 'warning');

    aBrowser.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon.png',
      title: 'Niflheim: Surveillance Alert',
      message: sMessage
    }).catch(() => {});

    aBrowser.tabs.query({ active: true, currentWindow: true }, (aTabs) => {
      if (aTabs.length > 0) {
        console.log('NIFLHEIM BACKGROUND: sending showDetectionAlert to tab', aTabs[0].id);
        aBrowser.tabs.sendMessage(aTabs[0].id, {
          sAction: 'showDetectionAlert',
          sDomain: sDomain,
          aTrackers: aTrackers,
          bFrost: bFrost,
          aFingerprinting: aFingerprinting
        }).catch((err) => console.warn('NIFLHEIM BACKGROUND: failed to send alert to tab', err));
      }
    });

    if (oStateRef.bShareEnabled) {
      const oReport = {
        domain: sDomain,                         
        trackers: aTrackers,
        cookie_companies: aCookieCompanies,
        frost_detected: bFrost,
        fingerprinting: aFingerprinting,
        permissions: oDetection.oPermissions || {},
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      aBrowser.runtime.sendMessage({
        sAction: 'sendReport',
        oReport: oReport
      }).catch(() => {});
    }
  }

  function fRegister() {
    console.log('NIFLHEIM BACKGROUND: jotnar-sentinel fRegister');
    aBrowser.runtime.onMessage.addListener((oMessage, oSender, fSendResponse) => {
      if (oMessage.sAction === 'detectionReport') {
        console.log('NIFLHEIM BACKGROUND: received detectionReport', oMessage.oDetection);
        fHandleDetection(oMessage.oDetection);
        fSendResponse({ bSuccess: true });
        return true;
      }
      return false;
    });
  }

  globalThis.fJotnarSentinelInit = fInit;
  globalThis.fJotnarSentinelRegister = fRegister;
  console.log('NIFLHEIM BACKGROUND: jotnar-sentinel exposed');
})();