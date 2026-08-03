/* global chrome, browser */

(function () {
  'use strict';

  const aBrowser = typeof browser !== 'undefined' ? browser : chrome;

  let oStateRef = null;
  let fLogRef = null;

  function fInit(oState, fLog) {
    oStateRef = oState;
    fLogRef = fLog;
  }

  function fPoisonTab(nTabId, sDomain, oOptions = {}) {
    if (!oStateRef || !oStateRef.bProtectionEnabled) {
      if (fLogRef) fLogRef('Poisoning skipped – protection disabled', 'info');
      return;
    }
    const nThreads = oStateRef.nThreadCount || 4;
    const sCountry = oStateRef.sCountry || 'us';

    globalThis.fGetIdentitiesForDomain(sDomain, nThreads, sCountry)
      .then((aIdentities) => {
        for (let i = 0; i < nThreads; i++) {
          const oIdentity = aIdentities[i % aIdentities.length];
          globalThis.aThreadPool.fEnqueue({
            fn: () => {
              return fRunPoisonTasks(nTabId, oIdentity, sDomain);
            }
          });
        }
        if (fLogRef) fLogRef('Poisoning started on ' + sDomain + ' with ' + nThreads + ' threads', 'info');
      })
      .catch((oErr) => {
        if (fLogRef) fLogRef('Failed to get identities: ' + oErr.message, 'error');
      });
  }

  async function fRunPoisonTasks(nTabId, oIdentity, sDomain) {
    try {
      const oResponse = await aBrowser.tabs.sendMessage(nTabId, {
        sAction: 'poison',
        oIdentity,
        sDomain
      });
      if (fLogRef) fLogRef('Poison task completed for ' + sDomain + ' with identity ' + oIdentity.email, 'success');
      return oResponse;
    } catch (oErr) {
      if (fLogRef) fLogRef('Poison task failed: ' + oErr.message, 'error');
      throw oErr;
    }
  }

  globalThis.fPoisoningManagerInit = fInit;
  globalThis.fPoisonTab = fPoisonTab;
})();