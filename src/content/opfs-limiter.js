/* global chrome, browser */

(function () {
  'use strict';

  const aBrowser = typeof browser !== 'undefined' ? browser : chrome;
  const nMaxSizeBytes = 512 * 1024 * 1024;

  function fApplyOPFSLimiter() {
    const oOriginalGetDirectory = navigator.storage.getDirectory;

    navigator.storage.getDirectory = function () {
      return oOriginalGetDirectory.call(this).then((oRoot) => {
        return new Proxy(oRoot, {
          get: function (oTarget, sProp) {
            const oOriginal = oTarget[sProp];
            if (typeof oOriginal === 'function') {
              if (sProp === 'getFileHandle' || sProp === 'getDirectoryHandle') {
                return function (...aArgs) {
                  return oOriginal.apply(oTarget, aArgs).then((oHandle) => {
                    if (oHandle.kind === 'file') {
                      return fWrapFileHandle(oHandle);
                    }
                    return oHandle;
                  });
                };
              }
              if (sProp === 'remove') {
                return function (...aArgs) {
                  return oOriginal.apply(oTarget, aArgs);
                };
              }
              return oOriginal.bind(oTarget);
            }
            return oOriginal;
          }
        });
      });
    };

    function fWrapFileHandle(oFileHandle) {
      return new Proxy(oFileHandle, {
        get: function (oTarget, sProp) {
          const oOriginal = oTarget[sProp];
          if (typeof oOriginal === 'function' && (sProp === 'createWritable' || sProp === 'createSyncAccessHandle')) {
            return function (...aArgs) {
              return fCheckAndEnforceLimit().then(() => {
                return oOriginal.apply(oTarget, aArgs);
              });
            };
          }
          if (typeof oOriginal === 'function') {
            return oOriginal.bind(oTarget);
          }
          return oOriginal;
        }
      });
    }

    async function fCheckAndEnforceLimit() {
      try {
        const oEstimate = await navigator.storage.estimate();
        const nUsage = oEstimate.usage || 0;
        if (nUsage > nMaxSizeBytes) {
          aBrowser.runtime.sendMessage({
            sAction: 'logActivity',
            sMessage: 'OPFS usage exceeded limit on ' + window.location.hostname,
            sType: 'warning'
          }).catch(() => {});
          // Delete oldest files (implemented via recursive walk)
          await fDeleteOldestFiles(nUsage - nMaxSizeBytes);
        }
      } catch (_) { /* ignore */ }
    }

    async function fDeleteOldestFiles(nBytesToFree) {
      const oRoot = await navigator.storage.getDirectory();
      const aFiles = await fCollectAllFiles(oRoot);
      aFiles.sort((a, b) => a.nLastModified - b.nLastModified);
      let nFreed = 0;
      for (const oFile of aFiles) {
        if (nFreed >= nBytesToFree) break;
        try {
          const nSize = oFile.oHandle.size || 0;
          await oFile.oHandle.remove();
          nFreed += nSize;
        } catch (_) { /* continue */ }
      }
    }

    async function fCollectAllFiles(oDirHandle, aAccum = []) {
      const aEntries = [];
      for await (const [sName, oHandle] of oDirHandle.entries()) {
        if (oHandle.kind === 'file') {
          try {
            const oFile = await oHandle.getFile();
            aAccum.push({ oHandle, nLastModified: oFile.lastModified || 0 });
          } catch (_) { /* ignore */ }
        } else if (oHandle.kind === 'directory') {
          await fCollectAllFiles(oHandle, aAccum);
        }
      }
      return aAccum;
    }
  }

  window.fApplyOPFSLimiter = fApplyOPFSLimiter;
})();