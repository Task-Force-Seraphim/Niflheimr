console.log('NIFLHEIM POPUP: script loaded');

(function () {
  'use strict';

  const aBrowser = (typeof browser !== 'undefined') ? browser : chrome;

  // DOM refs
  const oProtectionToggle = document.getElementById('bProtectionEnabled');
  const oThreadCountSlider = document.getElementById('nThreadCount');
  const oThreadCountDisplay = document.getElementById('nThreadCountDisplay');
  const oUpdateFrequencySelect = document.getElementById('sUpdateFrequency');
  const oShareRadios = document.querySelectorAll('input[name="bShareEnabled"]');
  const oCountrySelect = document.getElementById('sCountry');
  const oLogContainer = document.getElementById('aActivityLog');
  const oFetchBlocklistBtn = document.getElementById('bFetchBlocklist');
  const oPoisonTabBtn = document.getElementById('bPoisonTab');

  // ---------- Load state from storage (individual keys) ----------
  function fLoadStateFromStorage() {
    return new Promise((resolve) => {
      aBrowser.storage.local.get([
        'bProtectionEnabled',
        'nThreadCount',
        'sUpdateFrequency',
        'bShareEnabled',
        'aActivityLog',
        'sCountry'
      ], (oResult) => {
        if (aBrowser.runtime.lastError) {
          // Fallback defaults on error
          resolve({
            bProtectionEnabled: true,
            nThreadCount: 4,
            sUpdateFrequency: 'daily',
            bShareEnabled: false,
            aActivityLog: [],
            sCountry: 'us'
          });
          return;
        }

        resolve({
          bProtectionEnabled: oResult.bProtectionEnabled !== undefined ? oResult.bProtectionEnabled : true,
          nThreadCount: oResult.nThreadCount || 4,
          sUpdateFrequency: oResult.sUpdateFrequency || 'daily',
          bShareEnabled: oResult.bShareEnabled || false,
          aActivityLog: oResult.aActivityLog || [],
          sCountry: oResult.sCountry || 'us'
        });
      });
    });
  }

  // ---------- Render activity log ----------
  function fRenderLog(aEntries) {
    oLogContainer.innerHTML = '';
    if (!aEntries || aEntries.length === 0) {
      const oPlaceholder = document.createElement('div');
      oPlaceholder.className = 'oLogEntry oLogPlaceholder';
      oPlaceholder.textContent = 'No activity yet';
      oLogContainer.appendChild(oPlaceholder);
      return;
    }
    // Show newest first 
    for (const oEntry of aEntries) {
      const oDiv = document.createElement('div');
      const sType = oEntry.sType || 'info';
      oDiv.className = 'oLogEntry oLog' + sType.charAt(0).toUpperCase() + sType.slice(1);
      const sTime = oEntry.sTimestamp ? new Date(oEntry.sTimestamp).toLocaleTimeString() : '';
      oDiv.textContent = '[' + sTime + '] ' + (oEntry.sMessage || '');
      oLogContainer.appendChild(oDiv);
    }
  }

  // ---------- Apply state to UI ----------
  function fApplyState(oState) {
    oProtectionToggle.checked = oState.bProtectionEnabled || false;
    const nThreads = oState.nThreadCount || 4;
    oThreadCountSlider.value = nThreads;
    oThreadCountDisplay.textContent = nThreads;
    oUpdateFrequencySelect.value = oState.sUpdateFrequency || 'daily';
    const bShare = oState.bShareEnabled || false;
    for (const oRadio of oShareRadios) {
      oRadio.checked = (oRadio.value === 'true') === bShare;
    }
    oCountrySelect.value = oState.sCountry || 'us';
    if (oState.aActivityLog) fRenderLog(oState.aActivityLog);
  }

  // ---------- Set a preference (send to background, fallback to storage) ----------
  function fSetPreference(sKey, oValue) {
    // Try background first
    aBrowser.runtime.sendMessage({
      sAction: 'setPreference',
      sKey: sKey,
      oValue: oValue
    }, (oResponse) => {
      if (aBrowser.runtime.lastError) {
        console.warn('NIFLHEIM POPUP: background failed, saving directly to storage', aBrowser.runtime.lastError);
        // Directly save individual key
        const oUpdate = {};
        oUpdate[sKey] = oValue;
        aBrowser.storage.local.set(oUpdate, () => {
          // Also update local UI (this is alr done by event handlers)
        });
      }
    });
  }

  // ---------- Add a log message (send to background, update local log) ----------
  function fLogMessage(sMessage, sType) {
    aBrowser.runtime.sendMessage({
      sAction: 'logActivity',
      sMessage: sMessage,
      sType: sType || 'info'
    });
    // Immediately update local log by reloading from storage
    fLoadStateFromStorage().then((oState) => {
      fRenderLog(oState.aActivityLog || []);
    });
  }

  // ---------- Event Listeners ----------
  oProtectionToggle.addEventListener('change', function () {
    fSetPreference('bProtectionEnabled', this.checked);
  });

  oThreadCountSlider.addEventListener('input', function () {
    const nVal = parseInt(this.value, 10);
    oThreadCountDisplay.textContent = nVal;
    fSetPreference('nThreadCount', nVal);
  });

  oUpdateFrequencySelect.addEventListener('change', function () {
    fSetPreference('sUpdateFrequency', this.value);
  });

  for (const oRadio of oShareRadios) {
    oRadio.addEventListener('change', function () {
      if (this.checked) {
        fSetPreference('bShareEnabled', this.value === 'true');
      }
    });
  }

  oCountrySelect.addEventListener('change', function () {
    fSetPreference('sCountry', this.value);
  });

  oFetchBlocklistBtn.addEventListener('click', function () {
    fLogMessage('Blocklist update requested', 'info');
    // Also trigger background fetch
    aBrowser.runtime.sendMessage({ sAction: 'fetchBlocklist' }).catch(() => {});
  });

  oPoisonTabBtn.addEventListener('click', function () {
    fLogMessage('Poison current tab requested', 'info');
    // Get current tab and send poison command
    aBrowser.tabs.query({ active: true, currentWindow: true }, (aTabs) => {
      if (aTabs.length > 0) {
        const nTabId = aTabs[0].id;
        const sDomain = new URL(aTabs[0].url).hostname;
        aBrowser.runtime.sendMessage({
          sAction: 'poisonTab',
          nTabId: nTabId,
          sDomain: sDomain
        }).catch(() => {});
      }
    });
  });

  // ---------- Listen for log updates from background ----------
  aBrowser.runtime.onMessage.addListener((oMessage) => {
    if (oMessage.sAction === 'logUpdate') {
      // Reload entire log from storage
      fLoadStateFromStorage().then((oState) => {
        fRenderLog(oState.aActivityLog || []);
      });
      return true;
    }
    return false;
  });

  // ---------- Initialisation ----------
  fLoadStateFromStorage().then((oState) => {
    fApplyState(oState);
    console.log('NIFLHEIM POPUP: loaded');
  });

})();