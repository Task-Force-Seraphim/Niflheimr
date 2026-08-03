# Niflheim

A browser extension that detects surveillance, tracking, and fingerprinting, then poisons the collected data with synthetic identities and false information.

## Overview

Niflheim is a privacy tool that does not block tracking. Instead, it makes the data collected by trackers unreliable by injecting noise and false data. This approach, known as data poisoning, degrades the quality of surveillance data without triggering anti-blocking mechanisms that many sites employ.

The extension detects over 40 common tracking services, monitors fingerprinting attempts, enforces limits on Origin Private File System (OPFS) usage, and can automatically poison web forms and cookies with synthetic identities.

## Features

- Detection of known trackers: Google, Facebook, Twitter, LinkedIn, Amazon, Outbrain, Taboola, Criteo, Adobe, Oracle, AppNexus, Quantcast, OpenX, PubMatic, Rubicon, Index Exchange, The Trade Desk, Yandex, Mail.ru, and more
- Detection of fingerprinting attempts: canvas, WebGL, audio, fonts, screen properties, navigator properties, WebRTC, battery API, media devices, touch events
- OPFS size limiter with automatic file eviction (512 MB default)
- Timer jitter for performance.now() and Date.now()
- Form poisoning with synthetic identities (names, emails, phones, addresses, credit card numbers, passwords)
- Cookie poisoning (overwrites existing cookies with random values)
- Link walking to generate noise traffic
- Configurable thread count for parallel poisoning tasks
- Activity log visible in the popup
- Sharing toggle to send anonymised detection reports to a community threat intelligence database
- In-page alerts when surveillance is detected

## Installation

### For Chromium-based browsers (Chrome, Brave, Edge, Vivaldi)

1. Download the source code from the releases page or clone the repository.
2. Open the extensions page: `chrome://extensions`.
3. Enable Developer Mode.
4. Click "Load unpacked".
5. Select the root folder of the extension (the one containing `manifest.json`).
6. The extension will appear in the toolbar.

### For Firefox / LibreWolf / Tor Browser

1. Download the source code from the releases page or clone the repository.
2. Open `about:debugging`.
3. Click "This Firefox" on the left sidebar.
4. Click "Load Temporary Add-on".
5. Select the `manifest.json` file in the root folder.
6. The extension will load with a temporary ID.

For persistent installation, refer to the detailed [installation guide](INSTALLATION.md).

## Configuration

The extension popup provides the following settings:

- Protection toggle: enables or disables all active protections
- Threads: number of parallel poisoning tasks (1-8)
- Update Frequency: how often the extension fetches the blocklist
- Sharing: enable or disable anonymous reporting of detection data
- Country: used for identity generation

## Privacy and Data Handling

Niflheim does not collect or transmit any personal information unless the user explicitly enables Sharing in the popup settings. When enabled, the extension sends the following data to `https://niflheimr.netlify.app/api/report`:

- Domain name
- List of detected trackers
- List of cookie companies
- Fingerprinting methods detected
- FROST detection status
- Permission states
- Timestamp

No IP address or personally identifiable information is attached to reports. The data is used to build a community threat intelligence database visible on the public dashboard.

## Browser Support

- Chromium-based: Chrome, Brave, Edge, Vivaldi (Manifest V3)
- Firefox-based: Firefox, LibreWolf, Tor Browser (Manifest V2)

## Development

### Requirements

- Node.js (for linting)
- ESLint

### Setup

```
git clone https://github.com/task-force-seraphim/niflheim.git
cd niflheim
npm install
```

### Linting

```
npm run lint
npm run lint:fix
```

### File Structure

```
niflheim/
├── data/
│   ├── identities.json          # local identity profiles
│   └── trackers.json            # tracker patterns and company names
├── icons/                       # extension icons
├── src/
│   ├── background/              # background scripts
│   │   ├── index.js
│   │   ├── thread-pool.js
│   │   ├── identity-store.js
│   │   ├── poisoning-manager.js
│   │   ├── jotnar-sentinel.js
│   │   └── intel-client.js
│   ├── content/                 # content scripts
│   │   ├── index.js
│   │   ├── opfs-limiter.js
│   │   ├── timer-jitter.js
│   │   ├── fingerprint-detector.js
│   │   ├── permission-checker.js
│   │   ├── detector.js
│   │   ├── link-walker.js
│   │   ├── form-poisoner.js
│   │   └── cookie-poisoner.js
│   ├── popup/                   # popup UI
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   ├── ui/                      # additional UI components
│   │   ├── alerts.js
│   │   ├── terminal.html
│   │   └── terminal.js
│   └── utils/                   # utility functions
│       ├── constants.js
│       ├── crypto.js
│       └── helpers.js
├── manifest.json                # Manifest V3 for Chromium
├── manifest.firefox.json        # Manifest V2 for Firefox
├── package.json
├── INSTALLATION.md
└── README.md
```

## License

AGPL-3.0-or-later. See the LICENSE file for details.

## Links

- [Installation Guide](INSTALLATION.md)
- [Intelligence Dashboard](https://niflheimr.netlify.app/dashboard.html)
- [Report Issues](https://github.com/task-force-seraphim/niflheim/issues)
- [Source Code](https://github.com/task-force-seraphim/niflheim)