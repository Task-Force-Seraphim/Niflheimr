/* global chrome, browser, document */

console.log('NIFLHEIM ALERTS: alerts.js loaded');

(function () {
  'use strict';

  console.log('NIFLHEIM ALERTS: IIFE running');

  const aBrowser = typeof browser !== 'undefined' ? browser : chrome;

  let oAlertContainer = null;

  const sAlertStyles = `
    <style id="niflheim-alert-styles">
      #niflheim-alert-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 2147483647;
        max-width: 380px;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      }
      .niflheim-alert {
        background: #162230;
        color: #e0f0ff;
        border-left: 4px solid #00d4ff;
        border-radius: 8px;
        padding: 14px 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        line-height: 1.5;
        pointer-events: auto;
        animation: niflheim-slide-in 0.3s ease-out;
        transition: opacity 0.3s;
      }
      .niflheim-alert-warning {
        border-left-color: #ffd43b;
      }
      .niflheim-alert-danger {
        border-left-color: #ff6b6b;
      }
      .niflheim-alert-success {
        border-left-color: #51cf66;
      }
      .niflheim-alert-title {
        font-weight: 700;
        font-size: 14px;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .niflheim-alert-title .niflheim-alert-icon {
        font-size: 18px;
      }
      .niflheim-alert-message {
        color: #7b9cb5;
        font-size: 12px;
        word-wrap: break-word;
      }
      .niflheim-alert-actions {
        margin-top: 10px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .niflheim-alert-button {
        padding: 4px 14px;
        border: none;
        border-radius: 4px;
        font-weight: 600;
        font-size: 12px;
        cursor: pointer;
        transition: background 0.2s;
        background: #00d4ff;
        color: #0b1219;
      }
      .niflheim-alert-button:hover {
        background: #00b8e6;
      }
      .niflheim-alert-button-secondary {
        background: transparent;
        color: #7b9cb5;
        border: 1px solid #7b9cb5;
      }
      .niflheim-alert-button-secondary:hover {
        background: #7b9cb522;
      }
      @keyframes niflheim-slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes niflheim-fade-out {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }
      .niflheim-alert-fade-out {
        animation: niflheim-fade-out 0.3s ease-in forwards;
      }
    </style>
  `;

  function fEnsureContainer() {
    if (oAlertContainer) return oAlertContainer;
    if (!document.querySelector('#niflheim-alert-styles')) {
      const oStyleDiv = document.createElement('div');
      oStyleDiv.innerHTML = sAlertStyles;
      document.head.appendChild(oStyleDiv.firstElementChild);
    }
    oAlertContainer = document.createElement('div');
    oAlertContainer.id = 'niflheim-alert-container';
    document.body.appendChild(oAlertContainer);
    console.log('NIFLHEIM ALERTS: container created');
    return oAlertContainer;
  }

  function fShowAlert(sTitle, sMessage, sType, aActions) {
    console.log('NIFLHEIM ALERTS: fShowAlert', sTitle);
    const oContainer = fEnsureContainer();
    const oAlert = document.createElement('div');
    oAlert.className = 'niflheim-alert';
    if (sType === 'warning') oAlert.classList.add('niflheim-alert-warning');
    else if (sType === 'danger') oAlert.classList.add('niflheim-alert-danger');
    else if (sType === 'success') oAlert.classList.add('niflheim-alert-success');

    let sIcon = 'ℹ️';
    if (sType === 'warning') sIcon = '⚠️';
    else if (sType === 'danger') sIcon = '🚨';
    else if (sType === 'success') sIcon = '✅';

    let sActionsHtml = '';
    if (aActions && aActions.length > 0) {
      sActionsHtml = '<div class="niflheim-alert-actions">';
      for (const oAction of aActions) {
        const sClass = oAction.bPrimary ? 'niflheim-alert-button' : 'niflheim-alert-button niflheim-alert-button-secondary';
        sActionsHtml += `<button class="${sClass}" data-action="${oAction.sId}">${oAction.sLabel}</button>`;
      }
      sActionsHtml += '</div>';
    }

    oAlert.innerHTML = `
      <div class="niflheim-alert-title">
        <span class="niflheim-alert-icon">${sIcon}</span>
        ${sTitle}
      </div>
      <div class="niflheim-alert-message">${sMessage}</div>
      ${sActionsHtml}
    `;

    if (aActions && aActions.length > 0) {
      const aButtons = oAlert.querySelectorAll('.niflheim-alert-button');
      aButtons.forEach((oBtn, nIndex) => {
        oBtn.addEventListener('click', function () {
          const oAction = aActions[nIndex];
          if (oAction && typeof oAction.fn === 'function') {
            oAction.fn();
          }
          fDismissAlert(oAlert);
        });
      });
    }

    oContainer.appendChild(oAlert);
    console.log('NIFLHEIM ALERTS: alert appended');

    if (sType !== 'danger') {
      const nTimeout = setTimeout(() => {
        fDismissAlert(oAlert);
      }, 30000);
      oAlert._nTimeout = nTimeout;
    }

    return oAlert;
  }

  function fDismissAlert(oAlert) {
    if (oAlert._nTimeout) {
      clearTimeout(oAlert._nTimeout);
    }
    oAlert.classList.add('niflheim-alert-fade-out');
    setTimeout(() => {
      if (oAlert.parentNode) {
        oAlert.parentNode.removeChild(oAlert);
      }
    }, 350);
  }

  function fShowDetectionAlert(sDomain, aTrackers, bFrost, aFingerprinting) {
    console.log('NIFLHEIM ALERTS: fShowDetectionAlert', sDomain);
    let sMessage = 'Surveillance detected on ' + sDomain;
    if (aTrackers && aTrackers.length > 0) {
      sMessage += '<br>Trackers: ' + aTrackers.join(', ');
    }
    if (bFrost) {
      sMessage += '<br>FROST attack detected!';
    }
    if (aFingerprinting && aFingerprinting.length > 0) {
      sMessage += '<br>Fingerprinting: ' + aFingerprinting.join(', ');
    }

    const aActions = [
      {
        sId: 'dismiss',
        sLabel: 'Dismiss',
        bPrimary: false,
        fn: function () {}
      },
      {
        sId: 'report',
        sLabel: 'Report',
        bPrimary: true,
        fn: function () {
          aBrowser.runtime.sendMessage({
            sAction: 'logActivity',
            sMessage: 'User reported detection on ' + sDomain,
            sType: 'info'
          }).catch(() => {});
        }
      }
    ];

    fShowAlert('Niflheim Alert', sMessage, 'danger', aActions);
  }

  function fShowPhishingAlert(sDomain) {
    const aActions = [
      {
        sId: 'dismiss',
        sLabel: 'Dismiss',
        bPrimary: false,
        fn: function () {}
      },
      {
        sId: 'block',
        sLabel: 'Block',
        bPrimary: true,
        fn: function () {
          aBrowser.runtime.sendMessage({
            sAction: 'logActivity',
            sMessage: 'User blocked phishing site: ' + sDomain,
            sType: 'warning'
          }).catch(() => {});
        }
      }
    ];
    fShowAlert('Phishing Warning', 'This site (' + sDomain + ') may be a phishing attempt.', 'danger', aActions);
  }

  function fShowMalwareAlert(sDomain) {
    const aActions = [
      {
        sId: 'dismiss',
        sLabel: 'Dismiss',
        bPrimary: false,
        fn: function () {}
      },
      {
        sId: 'report',
        sLabel: 'Report',
        bPrimary: true,
        fn: function () {
          aBrowser.runtime.sendMessage({
            sAction: 'logActivity',
            sMessage: 'User reported malware on ' + sDomain,
            sType: 'warning'
          }).catch(() => {});
        }
      }
    ];
    fShowAlert('Malware Warning', 'This site (' + sDomain + ') may contain malware.', 'danger', aActions);
  }

  window.fShowAlert = fShowAlert;
  window.fShowDetectionAlert = fShowDetectionAlert;
  window.fShowPhishingAlert = fShowPhishingAlert;
  window.fShowMalwareAlert = fShowMalwareAlert;

  aBrowser.runtime.onMessage.addListener((oMessage) => {
    if (oMessage.sAction === 'showDetectionAlert') {
      console.log('NIFLHEIM ALERTS: received showDetectionAlert');
      fShowDetectionAlert(
        oMessage.sDomain,
        oMessage.aTrackers || [],
        oMessage.bFrost || false,
        oMessage.aFingerprinting || []
      );
      return true;
    }
    if (oMessage.sAction === 'showPhishingAlert') {
      fShowPhishingAlert(oMessage.sDomain);
      return true;
    }
    if (oMessage.sAction === 'showMalwareAlert') {
      fShowMalwareAlert(oMessage.sDomain);
      return true;
    }
    if (oMessage.sAction === 'showAlert') {
      fShowAlert(oMessage.sTitle, oMessage.sMessage, oMessage.sType || 'info', oMessage.aActions || []);
      return true;
    }
    return false;
  });

  console.log('NIFLHEIM ALERTS: loaded and ready');
})();