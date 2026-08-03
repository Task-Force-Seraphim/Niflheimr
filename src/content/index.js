/* global chrome, browser */

console.log('NIFLHEIM CONTENT: index.js loaded');

(function () {
  'use strict';

  console.log('NIFLHEIM CONTENT: index.js IIFE running');

  const aBrowser = typeof browser !== 'undefined' ? browser : chrome;
  let bProtectionEnabled = true;
  let bDetectionSent = false;

  function fLoadProtectionState() {
    console.log('NIFLHEIM CONTENT: fLoadProtectionState called');
    aBrowser.runtime.sendMessage({ sAction: 'getState' }, (oResponse) => {
      if (aBrowser.runtime.lastError) {
        console.warn('NIFLHEIM CONTENT: Could not connect to background. Retrying in 2s.', aBrowser.runtime.lastError);
        setTimeout(fLoadProtectionState, 2000);
        return;
      }
      console.log('NIFLHEIM CONTENT: got state response', oResponse);
      if (oResponse && oResponse.bProtectionEnabled !== undefined) {
        bProtectionEnabled = oResponse.bProtectionEnabled;
        if (!bProtectionEnabled) {
          console.log('NIFLHEIM CONTENT: Protection disabled by user');
          return;
        }
        console.log('NIFLHEIM CONTENT: Protection enabled, applying jitter and OPFS limiter');
        if (typeof window.fApplyTimerJitter === 'function') {
          console.log('NIFLHEIM CONTENT: applying timer jitter');
          window.fApplyTimerJitter();
        } else {
          console.warn('NIFLHEIM CONTENT: fApplyTimerJitter not found');
        }
        if (typeof window.fApplyOPFSLimiter === 'function') {
          console.log('NIFLHEIM CONTENT: applying OPFS limiter');
          window.fApplyOPFSLimiter();
        } else {
          console.warn('NIFLHEIM CONTENT: fApplyOPFSLimiter not found');
        }

        // Wait for all scripts to load, then run detection
        if (document.readyState === 'complete') {
          setTimeout(fRunInitialDetection, 500);
        } else {
          window.addEventListener('load', function () {
            setTimeout(fRunInitialDetection, 500);
          });
        }
      } else {
        console.warn('NIFLHEIM CONTENT: invalid state response');
      }
    });
  }

  function fRunInitialDetection() {
    console.log('NIFLHEIM CONTENT: fRunInitialDetection');
    if (!bProtectionEnabled || bDetectionSent) return;

    // --- Only run in top frame and once per page session ---
    if (window.top !== window.self) {
      console.log('NIFLHEIM CONTENT: Not top frame, skipping detection');
      return;
    }
    const sCacheKey = 'niflheim_detected_' + window.location.hostname;
    if (sessionStorage.getItem(sCacheKey)) {
      console.log('NIFLHEIM CONTENT: Detection already ran for this page');
      return;
    }
    sessionStorage.setItem(sCacheKey, 'true');
    // -----------------------------------------------------------

    bDetectionSent = true;

    const oDetection = {
      sDomain: window.location.hostname,
      aTrackers: [],
      bFrost: false,
      aFingerprinting: [],
      oPermissions: {},
      aCookieCompanies: []
    };

    let bHasDetectors = false;

    if (typeof window.fDetectSurveillance === 'function') {
      bHasDetectors = true;
      console.log('NIFLHEIM CONTENT: calling fDetectSurveillance');
      try {
        const oResult = window.fDetectSurveillance();
        if (oResult) {
          oDetection.aTrackers = oResult.aTrackers || [];
          oDetection.bFrost = oResult.bFrost || false;
          oDetection.aCookieCompanies = oResult.aCookieCompanies || [];
        }
      } catch (oErr) {
        console.warn('NIFLHEIM CONTENT: fDetectSurveillance error:', oErr);
      }
    } else {
      console.warn('NIFLHEIM CONTENT: fDetectSurveillance not available yet. Will retry in 2s.');
      setTimeout(fRunInitialDetection, 2000);
      return;
    }

    if (typeof window.fDetectFingerprinting === 'function') {
      bHasDetectors = true;
      console.log('NIFLHEIM CONTENT: calling fDetectFingerprinting');
      try {
        oDetection.aFingerprinting = window.fDetectFingerprinting() || [];
      } catch (oErr) {
        console.warn('NIFLHEIM CONTENT: fDetectFingerprinting error:', oErr);
      }
    }

    if (typeof window.fCheckPermissions === 'function') {
      bHasDetectors = true;
      console.log('NIFLHEIM CONTENT: calling fCheckPermissions');
      window.fCheckPermissions().then((oPerms) => {
        oDetection.oPermissions = oPerms;
        fSendDetection(oDetection);
      }).catch((oErr) => {
        console.warn('NIFLHEIM CONTENT: fCheckPermissions error:', oErr);
        fSendDetection(oDetection);
      });
    } else {
      if (bHasDetectors) {
        fSendDetection(oDetection);
      } else {
        console.warn('NIFLHEIM CONTENT: No detection functions available.');
      }
    }
  }

  function fSendDetection(oDetection) {
    console.log('NIFLHEIM CONTENT: fSendDetection', oDetection);
    const bHasDetections =
      (oDetection.aTrackers && oDetection.aTrackers.length > 0) ||
      oDetection.bFrost ||
      (oDetection.aFingerprinting && oDetection.aFingerprinting.length > 0);

    if (!bHasDetections) {
      console.log('NIFLHEIM CONTENT: No detections on ' + oDetection.sDomain);
      return;
    }

    console.log('NIFLHEIM CONTENT: Detection found on ' + oDetection.sDomain, oDetection);

    // Send to background
    aBrowser.runtime.sendMessage({
      sAction: 'detectionReport',
      oDetection
    }, (oResponse) => {
      if (aBrowser.runtime.lastError) {
        console.warn('NIFLHEIM CONTENT: Failed to send detection:', aBrowser.runtime.lastError);
      } else {
        console.log('NIFLHEIM CONTENT: Detection report sent successfully');
      }
    });

    // Show alert directly in page (if alerts.js is loaded)
    if (typeof window.fShowDetectionAlert === 'function') {
      console.log('NIFLHEIM CONTENT: showing alert directly');
      try {
        window.fShowDetectionAlert(
          oDetection.sDomain,
          oDetection.aTrackers || [],
          oDetection.bFrost || false,
          oDetection.aFingerprinting || []
        );
      } catch (oErr) {
        console.warn('NIFLHEIM CONTENT: fShowDetectionAlert error:', oErr);
      }
    } else {
      console.log('NIFLHEIM CONTENT: alerts.js not loaded, injecting');
      fInjectAlerts().then(() => {
        if (typeof window.fShowDetectionAlert === 'function') {
          window.fShowDetectionAlert(
            oDetection.sDomain,
            oDetection.aTrackers || [],
            oDetection.bFrost || false,
            oDetection.aFingerprinting || []
          );
        }
      }).catch((oErr) => console.warn('Failed to inject alerts:', oErr));
    }
  }

  function fInjectAlerts() {
    return new Promise((resolve, reject) => {
      const sUrl = aBrowser.runtime.getURL('src/ui/alerts.js');
      console.log('NIFLHEIM CONTENT: injecting alerts from ' + sUrl);
      const oScript = document.createElement('script');
      oScript.src = sUrl;
      oScript.onload = () => {
        console.log('NIFLHEIM CONTENT: alerts.js injected');
        resolve();
      };
      oScript.onerror = (err) => {
        console.error('NIFLHEIM CONTENT: failed to load alerts.js', err);
        reject(err);
      };
      document.head.appendChild(oScript);
    });
  }

  // Listen for poisoning messages
  aBrowser.runtime.onMessage.addListener((oMessage, oSender, fSendResponse) => {
    console.log('NIFLHEIM CONTENT: received message', oMessage);
    if (oMessage.sAction === 'poison') {
      const oIdentity = oMessage.oIdentity;
      if (!bProtectionEnabled) {
        fSendResponse({ bSuccess: false, sError: 'Protection disabled' });
        return true;
      }
      const aPromises = [];
      if (typeof window.fPoisonForms === 'function') {
        aPromises.push(window.fPoisonForms(oIdentity));
      }
      if (typeof window.fPoisonCookies === 'function') {
        aPromises.push(window.fPoisonCookies());
      }
      if (typeof window.fStartLinkWalking === 'function') {
        window.fStartLinkWalking(oIdentity);
      }
      Promise.all(aPromises)
        .then(() => fSendResponse({ bSuccess: true }))
        .catch((oErr) => fSendResponse({ bSuccess: false, sError: oErr.message }));
      return true;
    }
    return false;
  });

  // Init
  console.log('NIFLHEIM CONTENT: initialising');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fLoadProtectionState);
  } else {
    fLoadProtectionState();
  }
})();