# Currency to DKK Converter Extension

This is a Chromium browser extension that adds a context menu item to convert selected currency amounts to Danish kroner (DKK).

## Features
- Right-click any selected currency amount on a page to convert it to DKK.
- Uses exchangerate.host for real-time conversion.

## Installation
1. Go to `chrome://extensions/` in your Chromium browser.
2. Enable "Developer mode".
3. Click "Load unpacked" and select this project folder.

## Usage
- Select an amount (e.g., `100 USD` or just `100`) on any page.
- Right-click and choose "Convert to Danish kroner (DKK)".
- A popup will show the converted amount in DKK.

## Development
- Edit `background.js` for logic changes.
- Edit `manifest.json` for extension metadata.

## License
MIT
