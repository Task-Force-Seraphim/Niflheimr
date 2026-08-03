/* global chrome, browser */

(function () {
  'use strict';

  const aBrowser = typeof browser !== 'undefined' ? browser : chrome;
  const nMaxDepth = 3;

  function fStartLinkWalking(oIdentity, nDepth = 0) {
    if (nDepth > nMaxDepth) return;
    const aLinks = document.querySelectorAll('a[href]');
    const aUrls = [];
    aLinks.forEach((oLink) => {
      const sHref = oLink.href;
      if (sHref && sHref.startsWith('http')) {
        aUrls.push(sHref);
      }
    });
    const aUnique = [...new Set(aUrls)];
    let nIndex = 0;

    function fProcessNext() {
      if (nIndex >= aUnique.length) return;
      const sUrl = aUnique[nIndex++];
      fetch(sUrl, {
        mode: 'no-cors',
        credentials: 'omit',
        headers: { 'User-Agent': 'Niflheim/1.0' }
      }).catch(() => {});
      setTimeout(fProcessNext, 1000);
    }
    fProcessNext();

    aBrowser.runtime.sendMessage({
      sAction: 'logActivity',
      sMessage: 'Link walking started on ' + window.location.hostname + ' (' + aUnique.length + ' links)',
      sType: 'info'
    }).catch(() => {});
  }

  window.fStartLinkWalking = fStartLinkWalking;
})();