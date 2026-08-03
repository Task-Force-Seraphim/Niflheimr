(function () {
  'use strict';

  // Global constants for Niflheim
  const oConstants = {
    sVersion: '1.0.0',
    nMaxThreads: 8,
    nMinThreads: 1,
    nDefaultThreads: 4,
    nOPFSLimitMB: 512,
    nRateLimitPerMinute: 10,
    nMaxLogEntries: 100,
    nMaxIdentitiesPerDomain: 100,
    nMaxLinkDepth: 3,
    sDefaultUpdateFrequency: 'daily',
    sDefaultCountry: 'us',
    sIntelEndpoint: 'https://niflheimr.netlify.app/api/report',
    sIntelDataUrl: 'https://niflheimr.netlify.app/data.json',
    aUpdateFrequencies: ['daily', 'weekly', 'monthly'],
    aCountries: ['us', 'uk', 'ca', 'au', 'de', 'fr', 'jp', 'cn', 'in', 'mx', 'ru']
  };

  window.oConstants = oConstants;
})();