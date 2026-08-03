/* global chrome, browser, fetch */

(function () {
  'use strict';

  const aBrowser = typeof browser !== 'undefined' ? browser : chrome;

  let oStateRef = null;
  let fLogRef = null;
  let aLocalProfiles = [];

  function fLoadLocalProfiles() {
    return fetch(aBrowser.runtime.getURL('data/identities.json'))
      .then((oResponse) => {
        if (!oResponse.ok) throw new Error('Failed to load identities.json');
        return oResponse.json();
      })
      .then((oData) => {
        aLocalProfiles = oData.profiles || [];
        if (fLogRef) fLogRef('Loaded ' + aLocalProfiles.length + ' local identity profiles', 'info');
        return aLocalProfiles;
      })
      .catch((oErr) => {
        if (fLogRef) fLogRef('Failed to load local identities: ' + oErr.message, 'warning');
        aLocalProfiles = [];
        return [];
      });
  }

  function fInit(oState, fLog) {
    oStateRef = oState;
    fLogRef = fLog;
    fLoadLocalProfiles().catch(() => {});
  }

  function fFetchFromRandomUser(sSeed) {
    const sUrl = 'https://randomuser.me/api/?nat=us' + (sSeed ? '&seed=' + encodeURIComponent(sSeed) : '');
    return fetch(sUrl, { credentials: 'omit' })
      .then((oResponse) => {
        if (!oResponse.ok) throw new Error('RandomUser API error: ' + oResponse.status);
        return oResponse.json();
      })
      .then((oData) => {
        const oUser = oData.results[0];
        if (!oUser) throw new Error('No user returned');
        return {
          name: oUser.name.first + ' ' + oUser.name.last,
          gender: oUser.gender,
          email: oUser.email,
          phone: oUser.phone,
          address: {
            street: oUser.location.street.number + ' ' + oUser.location.street.name,
            city: oUser.location.city,
            state_name: oUser.location.state,
            state_abbreviation: oUser.location.state.substring(0, 2).toUpperCase(),
            country: oUser.location.country,
            zip: oUser.location.postcode
          },
          dob: {
            date: oUser.dob.date.split('T')[0],
            age: oUser.dob.age
          },
          photo_url: oUser.picture.large,
          blood_type: '',
          credit_card: null,
          height: { cm: 170, feet: 5, inches: 7, m: 1.70 },
          weight: { kg: 70, lbs: 154 },
          national_id: oUser.id.value || ''
        };
      });
  }

  function fFetchFromFakeIdentityGenerator(sGender, sCountry) {
    const oBody = {
      gender: sGender,
      country: sCountry
    };
    return fetch('https://api.fakeidentitygenerator.com/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(oBody),
      credentials: 'omit'
    })
      .then((oResponse) => {
        if (!oResponse.ok) {
          if (oResponse.status === 429) throw new Error('Rate limit exceeded (100/min)');
          throw new Error('FakeIdentity API error: ' + oResponse.status);
        }
        return oResponse.json();
      })
      .then((oData) => oData);
  }

  function fMergeProfiles(oPrimary, oSecondary) {
    const oResult = Object.assign({}, oPrimary);
    if (oSecondary) {
      for (const sKey in oSecondary) {
        if (oSecondary[sKey] && oSecondary[sKey] !== '') {
          if (typeof oSecondary[sKey] === 'object' && !Array.isArray(oSecondary[sKey])) {
            oResult[sKey] = Object.assign({}, oResult[sKey] || {}, oSecondary[sKey]);
          } else {
            oResult[sKey] = oSecondary[sKey];
          }
        }
      }
    }
    if (aLocalProfiles.length > 0) {
      const oLocal = aLocalProfiles[Math.floor(Math.random() * aLocalProfiles.length)];
      for (const sKey in oLocal) {
        if (!oResult[sKey] || (typeof oResult[sKey] === 'object' && Object.keys(oResult[sKey]).length === 0)) {
          oResult[sKey] = oLocal[sKey];
        } else if (typeof oResult[sKey] === 'object' && !Array.isArray(oResult[sKey])) {
          for (const sSubKey in oLocal[sKey]) {
            if (!oResult[sKey][sSubKey]) {
              oResult[sKey][sSubKey] = oLocal[sKey][sSubKey];
            }
          }
        }
      }
    }
    return oResult;
  }

  function fGenerateIdentity(sSeed, sCountry = 'us') {
    let nHash = 0;
    for (let i = 0; i < sSeed.length; i++) {
      nHash = ((nHash << 5) - nHash) + sSeed.charCodeAt(i);
      nHash |= 0;
    }
    const sGender = nHash % 2 === 0 ? 'male' : 'female';

    return Promise.all([
      fFetchFromRandomUser(sSeed).catch((oErr) => {
        if (fLogRef) fLogRef('RandomUser API failed: ' + oErr.message, 'warning');
        return null;
      }),
      fFetchFromFakeIdentityGenerator(sGender, sCountry).catch((oErr) => {
        if (fLogRef) fLogRef('FakeIdentity API failed: ' + oErr.message, 'warning');
        return null;
      })
    ])
      .then(([oRandomUser, oFakeIdentity]) => {
        if (!oRandomUser && !oFakeIdentity) {
          if (fLogRef) fLogRef('Both APIs failed, using local fallback', 'warning');
          return fGenerateLocalIdentity(sSeed);
        }
        return fMergeProfiles(oRandomUser || {}, oFakeIdentity || {});
      })
      .catch((oErr) => {
        if (fLogRef) fLogRef('Identity generation error: ' + oErr.message, 'error');
        return fGenerateLocalIdentity(sSeed);
      });
  }

  function fGenerateLocalIdentity(sSeed) {
    if (aLocalProfiles.length === 0) {
      return fGenerateBasicIdentity(sSeed);
    }
    let nHash = 0;
    for (let i = 0; i < sSeed.length; i++) {
      nHash = ((nHash << 5) - nHash) + sSeed.charCodeAt(i);
      nHash |= 0;
    }
    const nIndex = Math.abs(nHash) % aLocalProfiles.length;
    const oProfile = JSON.parse(JSON.stringify(aLocalProfiles[nIndex]));
    oProfile.email = oProfile.email.replace('@', '+' + Math.abs(nHash % 1000) + '@');
    oProfile.phone = oProfile.phone.replace(/\d{3}$/, String(100 + (nHash % 900)));
    return oProfile;
  }

  function fGenerateBasicIdentity(sSeed) {
    const aFirstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
    const aLastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    let nHash = 0;
    for (let i = 0; i < sSeed.length; i++) {
      nHash = ((nHash << 5) - nHash) + sSeed.charCodeAt(i);
      nHash |= 0;
    }
    const nAbs = Math.abs(nHash);
    return {
      name: aFirstNames[nAbs % aFirstNames.length] + ' ' + aLastNames[(nAbs >> 1) % aLastNames.length],
      gender: nAbs % 2 === 0 ? 'male' : 'female',
      email: 'user' + (nAbs % 1000) + '@example.com',
      phone: '+1 (555) ' + String(100 + nAbs % 900).padStart(3, '0') + '-' + String(1000 + nAbs % 9000).padStart(4, '0'),
      address: {
        street: (100 + nAbs % 9000) + ' Main St',
        city: 'Springfield',
        state_name: 'Illinois',
        state_abbreviation: 'IL',
        country: 'United States',
        zip: String(60000 + nAbs % 10000)
      },
      dob: { date: '1990-01-01', age: 34 },
      blood_type: 'O+',
      credit_card: null,
      height: { cm: 175, feet: 5, inches: 9, m: 1.75 },
      weight: { kg: 75, lbs: 165 },
      national_id: String(100 + nAbs % 900) + '-' + String(10 + nAbs % 90) + '-' + String(1000 + nAbs % 9000),
      photo_url: ''
    };
  }

  function fGetIdentitiesForDomain(sDomain, nCount, sCountry = 'us') {
    if (!oStateRef) return Promise.resolve([]);
    const sKey = sDomain;
    if (!oStateRef.oIdentities[sKey]) {
      oStateRef.oIdentities[sKey] = [];
    }
    const aExisting = oStateRef.oIdentities[sKey];
    const aPromises = [];

    const nNeeded = Math.max(0, nCount - aExisting.length);
    for (let i = 0; i < nNeeded; i++) {
      const sSeed = sDomain + '-' + (aExisting.length + i);
      aPromises.push(
        fGenerateIdentity(sSeed, sCountry)
          .then((oIdentity) => {
            aExisting.push(oIdentity);
            return oIdentity;
          })
      );
    }

    if (aPromises.length === 0) {
      return Promise.resolve(aExisting.slice(0, nCount));
    }

    return Promise.all(aPromises)
      .then(() => {
        if (aExisting.length > 100) {
          aExisting.splice(0, aExisting.length - 100);
        }
        return aExisting.slice(0, nCount);
      });
  }

  // Expose
  globalThis.fIdentityStoreInit = fInit;
  globalThis.fGetIdentitiesForDomain = fGetIdentitiesForDomain;
  globalThis.fGenerateIdentity = fGenerateIdentity;
  globalThis.fLoadLocalProfiles = fLoadLocalProfiles;
})();