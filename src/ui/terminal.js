/* global chrome, browser, document, window */

(function () {
  'use strict';

  const aBrowser = typeof browser !== 'undefined' ? browser : chrome;

  let oPendingReport = null;
  let fResolvePending = null;
  let fRejectPending = null;

  const oTerminalEl = document.getElementById('oTerminal');
  const oJsonEl = document.getElementById('oTerminalJson');
  const oStatusEl = document.getElementById('oTerminalStatus');
  const bCloseBtn = document.getElementById('bTerminalClose');
  const bCancelBtn = document.getElementById('bTerminalCancel');
  const bConfirmBtn = document.getElementById('bTerminalConfirm');

  function fShow(oReport) {
    oPendingReport = oReport;
    oJsonEl.textContent = JSON.stringify(oReport, null, 2);
    oStatusEl.textContent = 'Review before sending';
    oStatusEl.className = 'oTerminalStatus';
    oTerminalEl.classList.remove('oTerminalHidden');
    document.body.style.display = 'flex';
    return new Promise((resolve, reject) => {
      fResolvePending = resolve;
      fRejectPending = reject;
    });
  }

  function fHide() {
    oTerminalEl.classList.add('oTerminalHidden');
    document.body.style.display = 'none';
    oPendingReport = null;
  }

  function fConfirm() {
    if (fResolvePending && oPendingReport) {
      fResolvePending({ bConfirmed: true, oReport: oPendingReport });
      fHide();
    }
  }

  function fCancel() {
    if (fRejectPending) {
      fRejectPending(new Error('User cancelled'));
      fHide();
    } else if (fResolvePending) {
      fResolvePending({ bConfirmed: false });
      fHide();
    } else {
      fHide();
    }
  }

  // Event listeners
  bCloseBtn.addEventListener('click', fCancel);
  bCancelBtn.addEventListener('click', fCancel);
  bConfirmBtn.addEventListener('click', fConfirm);

  // Keyboard shortcuts
  document.addEventListener('keydown', function (oEvent) {
    if (oEvent.key === 'Escape') {
      fCancel();
    }
    if (oEvent.key === 'Enter' && (oEvent.ctrlKey || oEvent.metaKey)) {
      fConfirm();
    }
  });

  // Listen for messages from background
  aBrowser.runtime.onMessage.addListener((oMessage) => {
    if (oMessage.sAction === 'showTerminal' && oMessage.oPayload) {
      fShow(oMessage.oPayload)
        .then((oResult) => {
          if (oResult.bConfirmed) {
            aBrowser.runtime.sendMessage({
              sAction: 'terminalConfirmed',
              oReport: oResult.oReport
            }).catch(() => {});
          } else {
            aBrowser.runtime.sendMessage({
              sAction: 'terminalCancelled'
            }).catch(() => {});
          }
        })
        .catch(() => {
          aBrowser.runtime.sendMessage({
            sAction: 'terminalCancelled'
          }).catch(() => {});
        });
      return true;
    }
    return false;
  });

  // Initially hide
  fHide();
})();