/* global chrome, browser, importScripts */

console.log('NIFLHEIM BACKGROUND: script started');
try {
  (function () {
    'use strict';

    console.log('NIFLHEIM BACKGROUND: entering IIFE');

    try {
      importScripts(
        'thread-pool.js',
        'identity-store.js',
        'poisoning-manager.js',
        'jotnar-sentinel.js',
        'intel-client.js'
      );
      console.log('NIFLHEIM BACKGROUND: importScripts done');
    } catch (oErr) {
      console.error('NIFLHEIM BACKGROUND: importScripts failed', oErr);
      return;
    }

    const aBrowser = typeof browser !== 'undefined' ? browser : chrome;

    const oState = {
      bProtectionEnabled: true,
      nThreadCount: 4,
      sUpdateFrequency: 'daily',
      bShareEnabled: false,
      aActivityLog: [],
      oIdentities: {},
      aBlocklist: [],
      nLastFetch: 0,
      sCountry: 'us'
    };

    function fLog(sMessage, sType = 'info') {
      console.log('[Niflheim] ' + sType.toUpperCase() + ': ' + sMessage);
      const oEntry = {
        sTimestamp: new Date().toISOString(),
        sMessage,
        sType
      };
      oState.aActivityLog.unshift(oEntry);
      if (oState.aActivityLog.length > 100) oState.aActivityLog = oState.aActivityLog.slice(0, 100);
      fSaveState().catch(() => {});
      aBrowser.runtime.sendMessage({ sAction: 'logUpdate', oEntry }).catch(() => {});
    }

    function fSaveState() {
      return new Promise((resolve) => {
        try {
          aBrowser.storage.local.set({
            bProtectionEnabled: oState.bProtectionEnabled,
            nThreadCount: oState.nThreadCount,
            sUpdateFrequency: oState.sUpdateFrequency,
            bShareEnabled: oState.bShareEnabled,
            aActivityLog: oState.aActivityLog,
            oIdentities: oState.oIdentities,
            aBlocklist: oState.aBlocklist,
            nLastFetch: oState.nLastFetch,
            sCountry: oState.sCountry
          }, () => resolve());
        } catch (oErr) {
          console.error('NIFLHEIM BACKGROUND: fSaveState error', oErr);
          resolve();
        }
      });
    }

    function fLoadState() {
      return new Promise((resolve) => {
        try {
          aBrowser.storage.local.get([
            'bProtectionEnabled', 'nThreadCount', 'sUpdateFrequency',
            'bShareEnabled', 'aActivityLog', 'oIdentities', 'aBlocklist', 'nLastFetch', 'sCountry'
          ], (oResult) => {
            if (!aBrowser.runtime.lastError) {
              if (oResult.bProtectionEnabled !== undefined) oState.bProtectionEnabled = oResult.bProtectionEnabled;
              if (oResult.nThreadCount !== undefined) oState.nThreadCount = Math.min(Math.max(oResult.nThreadCount, 1), 8);
              if (oResult.sUpdateFrequency) oState.sUpdateFrequency = oResult.sUpdateFrequency;
              if (oResult.bShareEnabled !== undefined) oState.bShareEnabled = oResult.bShareEnabled;
              if (oResult.aActivityLog) oState.aActivityLog = oResult.aActivityLog;
              if (oResult.oIdentities) oState.oIdentities = oResult.oIdentities;
              if (oResult.aBlocklist) oState.aBlocklist = oResult.aBlocklist;
              if (oResult.nLastFetch) oState.nLastFetch = oResult.nLastFetch;
              if (oResult.sCountry) oState.sCountry = oResult.sCountry;
            }
            resolve();
          });
        } catch (oErr) {
          console.error('NIFLHEIM BACKGROUND: fLoadState error', oErr);
          resolve();
        }
      });
    }

    function fInitModules() {
      console.log('NIFLHEIM BACKGROUND: fInitModules');
      try {
        if (globalThis.fThreadPoolInit) {
          console.log('NIFLHEIM BACKGROUND: calling fThreadPoolInit');
          globalThis.fThreadPoolInit(oState, fLog);
        } else {
          console.warn('NIFLHEIM BACKGROUND: fThreadPoolInit not found');
        }
        if (globalThis.fIdentityStoreInit) {
          console.log('NIFLHEIM BACKGROUND: calling fIdentityStoreInit');
          globalThis.fIdentityStoreInit(oState, fLog);
        } else {
          console.warn('NIFLHEIM BACKGROUND: fIdentityStoreInit not found');
        }
        if (globalThis.fPoisoningManagerInit) {
          console.log('NIFLHEIM BACKGROUND: calling fPoisoningManagerInit');
          globalThis.fPoisoningManagerInit(oState, fLog);
        } else {
          console.warn('NIFLHEIM BACKGROUND: fPoisoningManagerInit not found');
        }
        if (globalThis.fJotnarSentinelInit) {
          console.log('NIFLHEIM BACKGROUND: calling fJotnarSentinelInit');
          globalThis.fJotnarSentinelInit(oState, fLog);
        } else {
          console.warn('NIFLHEIM BACKGROUND: fJotnarSentinelInit not found');
        }
        if (globalThis.fIntelClientInit) {
          console.log('NIFLHEIM BACKGROUND: calling fIntelClientInit');
          globalThis.fIntelClientInit(oState, fLog);
        } else {
          console.warn('NIFLHEIM BACKGROUND: fIntelClientInit not found');
        }

        if (globalThis.aThreadPool) {
          console.log('NIFLHEIM BACKGROUND: setting thread pool max');
          globalThis.aThreadPool.nMaxThreads = oState.nThreadCount;
        }

        if (globalThis.fJotnarSentinelRegister) {
          console.log('NIFLHEIM BACKGROUND: calling fJotnarSentinelRegister');
          globalThis.fJotnarSentinelRegister();
        }

        if (globalThis.aIntelClient) {
          console.log('NIFLHEIM BACKGROUND: scheduling intel update');
          globalThis.aIntelClient.fScheduleUpdate();
        }

        if (globalThis.fLoadLocalProfiles) {
          console.log('NIFLHEIM BACKGROUND: loading local profiles');
          globalThis.fLoadLocalProfiles().catch(() => {});
        }
      } catch (oErr) {
        console.error('NIFLHEIM BACKGROUND: fInitModules error', oErr);
      }
    }

    function fHandleMessage(oMessage, oSender, fSendResponse) {
      const sAction = oMessage.sAction;
      console.log('NIFLHEIM BACKGROUND: received message ' + sAction);
      try {
        switch (sAction) {
          case 'getState':
            fSendResponse({
              bProtectionEnabled: oState.bProtectionEnabled,
              nThreadCount: oState.nThreadCount,
              sUpdateFrequency: oState.sUpdateFrequency,
              bShareEnabled: oState.bShareEnabled,
              aActivityLog: oState.aActivityLog.slice(0, 20),
              sCountry: oState.sCountry
            });
            break;

          case 'setPreference': {
            const { sKey, oValue } = oMessage;
            console.log('NIFLHEIM BACKGROUND: setPreference', sKey, oValue);
            if (sKey === 'bProtectionEnabled') {
              oState.bProtectionEnabled = !!oValue;
              fLog('Protection ' + (oState.bProtectionEnabled ? 'enabled' : 'disabled'), 'info');
            } else if (sKey === 'nThreadCount') {
              const nVal = parseInt(oValue, 10);
              if (nVal >= 1 && nVal <= 8) {
                oState.nThreadCount = nVal;
                if (globalThis.aThreadPool) globalThis.aThreadPool.fResize(nVal);
                fLog('Thread count set to ' + nVal, 'info');
              }
            } else if (sKey === 'sUpdateFrequency') {
              if (['daily', 'weekly', 'monthly'].includes(oValue)) {
                oState.sUpdateFrequency = oValue;
                fLog('Update frequency set to ' + oValue, 'info');
              }
            } else if (sKey === 'bShareEnabled') {
              oState.bShareEnabled = !!oValue;
              fLog('Sharing ' + (oState.bShareEnabled ? 'enabled' : 'disabled'), 'info');
            } else if (sKey === 'sCountry') {
              if (typeof oValue === 'string' && oValue.length === 2) {
                oState.sCountry = oValue;
                fLog('Country set to ' + oValue, 'info');
              }
            }
            fSaveState().catch(() => {});
            fSendResponse({ bSuccess: true });
            break;
          }

          case 'logActivity':
            fLog(oMessage.sMessage, oMessage.sType || 'info');
            fSendResponse({ bSuccess: true });
            break;

          case 'sendReport':
            if (globalThis.aIntelClient) {
              globalThis.aIntelClient.fSendReport(oMessage.oReport)
                .then((oResult) => fSendResponse(oResult))
                .catch((oErr) => fSendResponse({ sStatus: 'error', sDetail: oErr.message }));
            } else {
              fSendResponse({ sStatus: 'error', sDetail: 'Intel client not ready' });
            }
            return true;

          case 'fetchBlocklist':
            if (globalThis.aIntelClient) {
              globalThis.aIntelClient.fFetchBlocklist()
                .then(() => fSendResponse({ bSuccess: true }))
                .catch((oErr) => fSendResponse({ bSuccess: false, sError: oErr.message }));
            } else {
              fSendResponse({ bSuccess: false, sError: 'Intel client not ready' });
            }
            return true;

          case 'poisonTab': {
            const nTabId = oMessage.nTabId;
            const sDomain = oMessage.sDomain;
            if (globalThis.fPoisonTab) {
              globalThis.fPoisonTab(nTabId, sDomain);
              fSendResponse({ bSuccess: true });
            } else {
              fSendResponse({ bSuccess: false, sError: 'Poisoning manager not ready' });
            }
            break;
          }

          case 'terminalConfirmed':
            fLog('Report confirmed by user', 'success');
            fSendResponse({ bSuccess: true });
            break;

          case 'terminalCancelled':
            fLog('Report cancelled by user', 'info');
            fSendResponse({ bSuccess: true });
            break;

          default:
            fSendResponse({ bSuccess: false, sError: 'Unknown action: ' + sAction });
        }
      } catch (oErr) {
        console.error('NIFLHEIM BACKGROUND: error handling message', oErr);
        if (fSendResponse) fSendResponse({ bSuccess: false, sError: oErr.message });
      }
      return false;
    }

    async function fInit() {
      console.log('NIFLHEIM BACKGROUND: fInit started');
      try {
        await fLoadState();
        console.log('NIFLHEIM BACKGROUND: state loaded');
        fInitModules();
        console.log('NIFLHEIM BACKGROUND: modules initialised');
        aBrowser.runtime.onMessage.addListener(fHandleMessage);
        console.log('NIFLHEIM BACKGROUND: message listener added');

        // --- Automatically wipe activity log when browser closes ---
        aBrowser.runtime.onSuspend.addListener(() => {
          oState.aActivityLog = [];
          fSaveState().catch(() => {});
          console.log('Niflheim: Activity log wiped on browser shutdown');
        });
        // ---------------------------------------------------------

        fLog('Niflheim background initialised', 'info');
        console.log('NIFLHEIM BACKGROUND: init complete');
      } catch (oErr) {
        console.error('NIFLHEIM BACKGROUND: fInit error', oErr);
      }
    }

    fInit().catch((oErr) => {
      console.error('NIFLHEIM BACKGROUND: top-level init error', oErr);
    });

  })();
} catch (oGlobalErr) {
  console.error('NIFLHEIM BACKGROUND: global error', oGlobalErr);
}