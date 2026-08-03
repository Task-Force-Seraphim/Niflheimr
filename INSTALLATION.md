# Niflheim – Installation Guide

This guide covers installation of the Niflheim browser extension on Chromium-based browsers (Chrome, Brave, Edge, Vivaldi) and Firefox-based browsers (Firefox, LibreWolf, Tor Browser).

## Prerequisites

- A modern web browser (listed above)
- Git (optional, for cloning)
- For developers: Basic familiarity with browser extensions

---

## Method 1: Load Unpacked (Recommended for All)

This method works for both Chromium and Firefox, and does not require signing or store submission. It is the primary distribution method for Niflheim.

### For Chromium-based browsers (Chrome, Brave, Edge, Vivaldi)

1. **Download the source code**  
   - Clone the repository:  
     ```bash
     git clone https://github.com/task-force-seraphim/niflheim.git
     ```
   - Or download the ZIP from the [releases page](https://github.com/task-force-seraphim/niflheim/releases) and extract it.

2. **Open the extensions page**  
   - Chrome / Brave / Edge: Type `chrome://extensions` in the address bar.
   - Vivaldi: Type `vivaldi://extensions`.

3. **Enable Developer Mode**  
   - Toggle the switch in the top‑right corner.

4. **Load the extension**  
   - Click **"Load unpacked"**.
   - Navigate to the folder where you extracted/cloned Niflheim.
   - Select the **root folder** (the one containing `manifest.json`).
   - Click **Select Folder**.

5. **Verify installation**  
   - The Niflheim icon should appear in the toolbar. Click it to open the popup and check that the activity log shows "Niflheim background initialised".

### For Firefox / LibreWolf / Tor Browser

1. **Download the source code** (same as above).

2. **Open the add‑ons debugging page**  
   - Type `about:debugging` in the address bar.
   - Click **"This Firefox"** on the left sidebar.

3. **Load Temporary Add‑on**  
   - Click **"Load Temporary Add‑on"**.
   - Browse to the Niflheim root folder and select the `manifest.json` file.
   - The extension will load with a temporary ID.

4. **Persistent installation**  
   - If you want the extension to persist across browser restarts, you can use the [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) tool to sign it, or follow the **"Developer Edition"** instructions below to use a permanent profile.

---

## Method 2: Developer Edition (Permanent ID – Firefox)

This method is useful for testing and development, as it gives the extension a stable ID.

1. **Install `web-ext`** (Node.js required):
   ```bash
   npm install -g web-ext
   ```

2. **Run the extension with persistent profile**:
   ```bash
   cd /path/to/niflheim
   web-ext run --firefox=firefox --keep-profile-changes
   ```
   Replace `firefox` with `librewolf` if using LibreWolf.

3. **The extension will now persist** across restarts as long as you use the same profile.

---

## Method 3: From Release ZIP (No Git)

1. Download the latest `.zip` from [Releases](https://github.com/task-force-seraphim/niflheim/releases).
2. Extract the ZIP.
3. Follow the **"Load Unpacked"** instructions for your browser.

---

## Method 4: Manual Installation (Advanced)

If you prefer to install without the developer tools:

### For Chromium:

1. Package the extension as a `.crx`:
   - In `chrome://extensions`, enable Developer Mode.
   - Click **"Pack extension"**.
   - Select the root folder and generate a private key (`.pem`).
   - The `.crx` file will be created.
2. Drag the `.crx` into the extensions page to install.

### For Firefox:

1. Package the extension as a `.xpi` using `web-ext`:
   ```bash
   web-ext build
   ```
2. Drag the generated `.xpi` into Firefox to install (may require signing for permanent installation).

---

## Troubleshooting

### The extension doesn't appear in the toolbar
- Check that you loaded the correct folder.
- On Firefox, the icon may be hidden; click the puzzle icon and pin Niflheim.

### The popup shows "No activity yet"
- Ensure protection is enabled in the popup settings.
- Visit a tracking-heavy site (e.g., `cnn.com`) and wait a few seconds.
- Open the background console (via `chrome://extensions` → click "service worker" link or `about:debugging` → "Inspect").

### "Failed to load trackers.json" warning
- This is normal if the extension can't fetch the local file immediately; it will fall back to a hardcoded list.

### FROST detection not triggering
- OPFS is used by some sites; the limiter triggers only when usage exceeds 512 MB. This is rare.

---

## Updating

To update to a newer version:
1. Pull the latest code from GitHub or download the new release ZIP.
2. In your browser's extensions page, **remove the old version**.
3. Load the new folder using the same "Load unpacked" steps.

Alternatively, for Firefox with `web-ext`, simply stop the process and re‑run.

---

## Security Notes

- Niflheim requests broad permissions (`<all_urls>`) because it needs to inject scripts into every page to detect trackers and poison forms.
- The extension does not collect or transmit any personal information unless you explicitly enable **"Sharing"** in the popup settings. When enabled, it sends anonymised (non‑hashed) domain names and tracker lists to `https://niflheimr.netlify.app/api/report` to build a community threat intelligence database.
- You can inspect the source code at any time to verify what data is sent.

---

## Support

For issues, feature requests, or general discussion, please use the [GitHub issue tracker](https://github.com/task-force-seraphim/niflheim/issues).

---

## License

AGPL-3.0-or-later. See [LICENSE](LICENSE) for details.
