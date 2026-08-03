/* global crypto, TextEncoder */

(function () {
  'use strict';

  async function fSha512(sInput) {
    const oEncoder = new TextEncoder();
    const oData = oEncoder.encode(sInput);
    const oBuffer = await crypto.subtle.digest('SHA-512', oData);
    const aBytes = new Uint8Array(oBuffer);
    let sHex = '';
    for (let i = 0; i < aBytes.length; i++) {
      sHex += aBytes[i].toString(16).padStart(2, '0');
    }
    return sHex;
  }

  async function fSha256(sInput) {
    const oEncoder = new TextEncoder();
    const oData = oEncoder.encode(sInput);
    const oBuffer = await crypto.subtle.digest('SHA-256', oData);
    const aBytes = new Uint8Array(oBuffer);
    let sHex = '';
    for (let i = 0; i < aBytes.length; i++) {
      sHex += aBytes[i].toString(16).padStart(2, '0');
    }
    return sHex;
  }

  function fSimpleHash(sInput) {
    let nHash = 0;
    for (let i = 0; i < sInput.length; i++) {
      nHash = ((nHash << 5) - nHash) + sInput.charCodeAt(i);
      nHash |= 0;
    }
    return Math.abs(nHash);
  }

  function fBase64Encode(sInput) {
    return btoa(unescape(encodeURIComponent(sInput)));
  }

  function fBase64Decode(sInput) {
    return decodeURIComponent(escape(atob(sInput)));
  }

  // Generate a random alphanumeric string of given length
  function fRandomString(nLength) {
    let sResult = '';
    const sChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < nLength; i++) {
      sResult += sChars.charAt(Math.floor(Math.random() * sChars.length));
    }
    return sResult;
  }

  // HMAC-SHA256 (if needed)
  async function fHmacSha256(sKey, sData) {
    const oEncoder = new TextEncoder();
    const oKeyData = oEncoder.encode(sKey);
    const oMessage = oEncoder.encode(sData);
    const oKey = await crypto.subtle.importKey(
      'raw',
      oKeyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const oSignature = await crypto.subtle.sign('HMAC', oKey, oMessage);
    const aBytes = new Uint8Array(oSignature);
    let sHex = '';
    for (let i = 0; i < aBytes.length; i++) {
      sHex += aBytes[i].toString(16).padStart(2, '0');
    }
    return sHex;
  }

  // Expose
  window.fSha512 = fSha512;
  window.fSha256 = fSha256;
  window.fSimpleHash = fSimpleHash;
  window.fBase64Encode = fBase64Encode;
  window.fBase64Decode = fBase64Decode;
  window.fRandomString = fRandomString;
  window.fHmacSha256 = fHmacSha256;
})();