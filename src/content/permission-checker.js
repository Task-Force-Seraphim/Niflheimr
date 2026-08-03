(function () {
  'use strict';

  async function fCheckPermissions() {
    const oPerms = {};
    const aPermissions = [
      'geolocation', 'microphone', 'camera', 'notifications',
      'persistent-storage', 'push', 'midi', 'clipboard-read',
      'clipboard-write', 'display-capture', 'background-sync',
      'accelerometer', 'gyroscope', 'magnetometer', 'ambient-light-sensor',
      'speaker-selection', 'window-management', 'storage-access',
      'top-level-storage-access', 'idle-detection', 'system-wake-lock'
    ];
    for (const sPerm of aPermissions) {
      try {
        const oStatus = await navigator.permissions.query({ name: sPerm });
        oPerms[sPerm] = oStatus.state === 'granted';
      } catch (_) {
        oPerms[sPerm] = false;
      }
    }
    return oPerms;
  }

  window.fCheckPermissions = fCheckPermissions;
})();