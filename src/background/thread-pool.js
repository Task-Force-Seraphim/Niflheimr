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

  const aThreadPool = {
    aWorkers: [],
    nMaxThreads: 4,
    aQueue: [],
    bRunning: false,

    fInit() {
      if (!oStateRef) return;
      this.nMaxThreads = oStateRef.nThreadCount || 4;
    },

    fEnqueue(oTask) {
      this.aQueue.push(oTask);
      if (!this.bRunning) this.fProcessQueue();
    },

    fProcessQueue() {
      if (this.aQueue.length === 0 || this.aWorkers.length >= this.nMaxThreads) {
        this.bRunning = false;
        return;
      }
      this.bRunning = true;
      const oTask = this.aQueue.shift();
      const oWorker = { bActive: true, fTask: oTask };
      this.aWorkers.push(oWorker);
      Promise.resolve(oTask.fn())
        .then(() => {
          const nIndex = this.aWorkers.indexOf(oWorker);
          if (nIndex !== -1) this.aWorkers.splice(nIndex, 1);
          this.fProcessQueue();
        })
        .catch((oErr) => {
          if (fLogRef) fLogRef('Thread task error: ' + oErr.message, 'error');
          const nIndex = this.aWorkers.indexOf(oWorker);
          if (nIndex !== -1) this.aWorkers.splice(nIndex, 1);
          this.fProcessQueue();
        });
    },

    fResize(nNewCount) {
      this.nMaxThreads = Math.min(Math.max(nNewCount, 1), 8);
      if (oStateRef) {
        oStateRef.nThreadCount = this.nMaxThreads;
      }
    }
  };

  globalThis.aThreadPool = aThreadPool;
  globalThis.fThreadPoolInit = fInit;
})();