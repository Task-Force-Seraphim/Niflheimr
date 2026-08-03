/* global chrome, browser */

(function () {
  'use strict';

  function fPoisonForms(oIdentity) {
    const aForms = document.querySelectorAll('form');
    if (aForms.length === 0) return Promise.resolve();

    const aPromises = [];
    aForms.forEach((oForm) => {
      if (Math.random() > 0.7) return;

      const aInputs = oForm.querySelectorAll('input, textarea, select');
      aInputs.forEach((oField) => {
        const sType = oField.type || '';
        const sName = (oField.name || '').toLowerCase();
        const sId = (oField.id || '').toLowerCase();
        const sClass = (oField.className || '').toLowerCase();

        // Compose a string for matching
        const sCombined = sName + ' ' + sId + ' ' + sClass;

        if (/email/.test(sCombined)) {
          oField.value = oIdentity.email || 'user@example.com';
        } else if (/name|fullname|firstname|lastname/.test(sCombined)) {
          oField.value = oIdentity.name || 'John Doe';
        } else if (/phone|tel|mobile/.test(sCombined)) {
          oField.value = oIdentity.phone || '+1 555-123-4567';
        } else if (/address|street/.test(sCombined)) {
          oField.value = (oIdentity.address && oIdentity.address.street) || '123 Main St';
        } else if (/city/.test(sCombined)) {
          oField.value = (oIdentity.address && oIdentity.address.city) || 'Springfield';
        } else if (/state/.test(sCombined)) {
          oField.value = (oIdentity.address && (oIdentity.address.state_name || oIdentity.address.state_abbreviation)) || 'IL';
        } else if (/zip|postal|postcode/.test(sCombined)) {
          oField.value = (oIdentity.address && oIdentity.address.zip) || '62701';
        } else if (/country/.test(sCombined)) {
          oField.value = (oIdentity.address && oIdentity.address.country) || 'United States';
        } else if (/dob|birthdate|birthday/.test(sCombined)) {
          oField.value = (oIdentity.dob && oIdentity.dob.date) || '1990-01-01';
        } else if (/creditcard|ccnum|cardnumber/.test(sCombined)) {
          oField.value = (oIdentity.credit_card && oIdentity.credit_card.number) || '4111111111111111';
        } else if (/cvv|cvc|security/.test(sCombined)) {
          oField.value = (oIdentity.credit_card && oIdentity.credit_card.cvv) || '123';
        } else if (/expiry|expiration|expdate/.test(sCombined)) {
          oField.value = (oIdentity.credit_card && oIdentity.credit_card.expiry) || '12/25';
        } else if (/password|pass|pwd/.test(sCombined)) {
          oField.value = oIdentity.password || 'Niflheim' + Math.random().toString(36).substring(2, 8);
        } else if (sType === 'textarea') {
          oField.value = 'This is a sample message from Niflheim.';
        } else if (sType === 'checkbox' || sType === 'radio') {
          if (Math.random() > 0.5) oField.checked = true;
        } else if (sType === 'select-one') {
          const aOptions = oField.options;
          if (aOptions.length > 0) {
            const nIndex = Math.floor(Math.random() * aOptions.length);
            oField.selectedIndex = nIndex;
          }
        } else {
          if (sType === 'text' || sType === 'search' || sType === 'url') {
            oField.value = oIdentity.name || 'John Doe';
          }
        }
        const oEvent = new Event('change', { bubbles: true });
        oField.dispatchEvent(oEvent);
      });

      const oSubmitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const bDefault = oForm.dispatchEvent(oSubmitEvent);
      if (bDefault) {
        const oFormData = new FormData(oForm);
        fetch(oForm.action || window.location.href, {
          method: oForm.method || 'POST',
          body: oFormData,
          credentials: 'omit',
          mode: 'no-cors'
        }).catch(() => {});
      }
    });

    return Promise.resolve();
  }

  window.fPoisonForms = fPoisonForms;
})();