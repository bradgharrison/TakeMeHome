# TakeMeHome

A streamlined Chrome extension that redirects new tabs to your preferred homepage, optimized for maintaining a single homepage tab.

## Features

- Automatically redirects new tabs to your preferred homepage
- Uses your homepage as a personal launcher for your browsing activities
- Maintains a single homepage tab instead of opening multiple duplicate tabs
- Preserves your homepage when opening new tabs
- Intercepts link clicks on your homepage to open them in new tabs
- Supports local addresses (localhost) and external websites
- Follows dark/light mode preferences of your browser
- Modular code architecture for maintainability

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the `TakeMeHome` folder
5. The extension is now installed and ready to use

## Usage

1. Click the extension icon in your browser toolbar
2. Enter your preferred homepage URL (e.g., https://google.com, localhost:3000)
3. Click "Save"
4. Open a new tab to see it redirect to your homepage

The extension will maintain a single instance of your homepage tab. When you open new tabs, it will either:
- Focus your existing homepage tab if one is already open
- Open your homepage in the new tab if no homepage tab exists

## Permissions

This extension requires:
- `tabs` permission to manage tabs and focus the homepage tab
- `storage` permission to save your homepage preference
- `host_permissions` to redirect to any URL you specify

## Technical Details

- Built with vanilla JavaScript using ES modules
- Organized with a modular architecture for maintainability
- Uses Chrome Extension Manifest V3
- Lightweight with minimal overhead

## Privacy

This extension is designed to be privacy-friendly:
- No tracking or analytics
- No data sent to external servers
- All settings stored locally in Chrome's storage
- No browsing history access beyond what's needed for core functionality

## License

GNU General Public License v3.0