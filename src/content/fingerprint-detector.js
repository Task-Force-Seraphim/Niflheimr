(function () {
  'use strict';

  function fDetectFingerprinting() {
    const aDetected = [];

    // Canvas fingerprinting
    const oOrigGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (sType) {
      if (sType === '2d' || sType === 'webgl' || sType === 'experimental-webgl') {
        aDetected.push(sType === '2d' ? 'canvas' : 'WebGL');
      }
      return oOrigGetContext.apply(this, arguments);
    };
    const oOrigToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function () {
      aDetected.push('canvas');
      return oOrigToDataURL.apply(this, arguments);
    };

    // Audio fingerprinting
    const oOrigAudioContext = window.AudioContext;
    if (oOrigAudioContext) {
      window.AudioContext = function () {
        aDetected.push('audio');
        return new oOrigAudioContext(...arguments);
      };
    }
    const oOrigWebkitAudio = window.webkitAudioContext;
    if (oOrigWebkitAudio) {
      window.webkitAudioContext = function () {
        aDetected.push('audio');
        return new oOrigWebkitAudio(...arguments);
      };
    }

    // Font fingerprinting (CSS @font-face)
    try {
      const aSheets = document.styleSheets;
      for (const oSheet of aSheets) {
        const aRules = oSheet.cssRules || [];
        for (const oRule of aRules) {
          if (oRule.type === CSSRule.FONT_FACE_RULE) {
            aDetected.push('fonts');
            break;
          }
        }
        if (aDetected.includes('fonts')) break;
      }
    } catch (_) { /* cross-origin */ }

    // Screen properties
    const oScreen = window.screen;
    const oScreenProxy = new Proxy(oScreen, {
      get: function (oTarget, sProp) {
        if (typeof oTarget[sProp] !== 'function') {
          aDetected.push('screen');
        }
        return oTarget[sProp];
      }
    });
    try {
      Object.defineProperty(window, 'screen', {
        get: function () {
          aDetected.push('screen');
          return oScreen;
        },
        configurable: true,
        enumerable: true
      });
    } catch (_) { /* ignore */ }

    // Navigator properties (userAgent, platform, etc.)
    const oNavigator = navigator;
    const oNavProxy = new Proxy(oNavigator, {
      get: function (oTarget, sProp) {
        if (typeof oTarget[sProp] !== 'function' && !sProp.startsWith('_')) {
          aDetected.push('navigator');
        }
        return oTarget[sProp];
      }
    });
    try {
      Object.defineProperty(window, 'navigator', {
        get: function () {
          aDetected.push('navigator');
          return oNavProxy;
        },
        configurable: true,
        enumerable: true
      });
    } catch (_) { /* ignore */ }

    // WebRTC (RTCPeerConnection)
    if (window.RTCPeerConnection || window.webkitRTCPeerConnection) {
      const oOrigRTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
      const oNewRTCPeerConnection = function () {
        aDetected.push('webrtc');
        return new oOrigRTCPeerConnection(...arguments);
      };
      if (window.RTCPeerConnection) window.RTCPeerConnection = oNewRTCPeerConnection;
      if (window.webkitRTCPeerConnection) window.webkitRTCPeerConnection = oNewRTCPeerConnection;
    }

    // Battery API
    if (navigator.getBattery) {
      const oOrigGetBattery = navigator.getBattery;
      navigator.getBattery = function () {
        aDetected.push('battery');
        return oOrigGetBattery.apply(this, arguments);
      };
    }

    // MediaDevices (enumerateDevices)
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      const oOrigEnumerate = navigator.mediaDevices.enumerateDevices;
      navigator.mediaDevices.enumerateDevices = function () {
        aDetected.push('media_devices');
        return oOrigEnumerate.apply(this, arguments);
      };
    }

    // Touch events
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      const oOrigAddEventListener = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function (sType) {
        if (sType === 'touchstart' || sType === 'touchmove' || sType === 'touchend') {
          aDetected.push('touch');
        }
        return oOrigAddEventListener.apply(this, arguments);
      };
    }

    return [...new Set(aDetected)];
  }

  window.fDetectFingerprinting = fDetectFingerprinting;
})();