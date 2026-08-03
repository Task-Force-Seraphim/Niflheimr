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

  const aIntelClient = {
    sEndpoint: 'https://niflheimr.netlify.app/api/report',
    sDataUrl: 'https://niflheimr.netlify.app/data.json',
    nRateLimitMs: 60000,
    aLastReportTimes: [],

    fCanSend() {
      const nNow = Date.now();
      this.aLastReportTimes = this.aLastReportTimes.filter(nTime => nNow - nTime < this.nRateLimitMs);
      return this.aLastReportTimes.length < 10;
    },

    fSendReport(oReport) {
      if (!oStateRef || !oStateRef.bShareEnabled) {
        if (fLogRef) fLogRef('Report not sent – sharing disabled', 'info');
        return Promise.resolve({ sStatus: 'disabled' });
      }
      if (!this.fCanSend()) {
        if (fLogRef) fLogRef('Rate limit reached – report not sent', 'warning');
        return Promise.resolve({ sStatus: 'rate_limited' });
      }

      return new Promise((resolve) => {
        aBrowser.runtime.sendMessage({
          sAction: 'showTerminal',
          oPayload: oReport
        }).catch(() => {});

        const oListener = (oMessage) => {
          if (oMessage.sAction === 'terminalConfirmed') {
            aBrowser.runtime.onMessage.removeListener(oListener);
            fetch(this.sEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Niflheim/1.0'
              },
              body: JSON.stringify(oReport),
              credentials: 'omit'
            })
              .then((oResponse) => {
                this.aLastReportTimes.push(Date.now());
                if (oResponse.ok) {
                  if (fLogRef) fLogRef('Report sent successfully', 'success');
                  resolve({ sStatus: 'ok' });
                } else {
                  if (fLogRef) fLogRef('Report failed: ' + oResponse.status, 'error');
                  resolve({ sStatus: 'error', sDetail: oResponse.statusText });
                }
              })
              .catch((oErr) => {
                if (fLogRef) fLogRef('Report network error: ' + oErr.message, 'error');
                resolve({ sStatus: 'error', sDetail: oErr.message });
              });
          }
          if (oMessage.sAction === 'terminalCancelled') {
            aBrowser.runtime.onMessage.removeListener(oListener);
            if (fLogRef) fLogRef('Report cancelled by user', 'info');
            resolve({ sStatus: 'cancelled' });
          }
        };
        aBrowser.runtime.onMessage.addListener(oListener);

        setTimeout(() => {
          aBrowser.runtime.onMessage.removeListener(oListener);
          resolve({ sStatus: 'timeout' });
        }, 60000);
      });
    },

    fFetchBlocklist() {
      return fetch(this.sDataUrl, { credentials: 'omit' })
        .then((oResponse) => {
          if (oResponse.status === 404) {
            if (fLogRef) fLogRef('Blocklist endpoint not found (404) – using empty list', 'debug');
            return [];
          }
          if (!oResponse.ok) throw new Error('HTTP ' + oResponse.status);
          return oResponse.json();
        })
        .then((aData) => {
          if (Array.isArray(aData) && aData.length === 0) {
            if (oStateRef) {
              oStateRef.aBlocklist = [];
              oStateRef.nLastFetch = Date.now();
            }
            return aData;
          }
          if (!Array.isArray(aData)) throw new Error('Invalid data format');
          if (oStateRef) {
            oStateRef.aBlocklist = aData;
            oStateRef.nLastFetch = Date.now();
          }
          if (fLogRef) fLogRef('Blocklist updated with ' + aData.length + ' entries', 'success');
          return aData;
        })
        .catch((oErr) => {
          if (fLogRef) fLogRef('Blocklist fetch failed: ' + oErr.message, 'error');
          return [];
        });
    },

    fScheduleUpdate() {
      if (!oStateRef) return;
      const nNow = Date.now();
      let nInterval = 86400000;
      if (oStateRef.sUpdateFrequency === 'weekly') nInterval = 604800000;
      else if (oStateRef.sUpdateFrequency === 'monthly') nInterval = 2592000000;
      const nNext = oStateRef.nLastFetch + nInterval;
      if (nNow >= nNext) {
        this.fFetchBlocklist().catch(() => {});
      }
      setTimeout(() => this.fScheduleUpdate(), 3600000);
    }
  };

  globalThis.fIntelClientInit = fInit;
  globalThis.aIntelClient = aIntelClient;
})();