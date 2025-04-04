# TakeMeHome (v2.0.20250404)

A Chrome extension to quickly access a designated homepage via a keyboard shortcut.

## How it Works

1.  **Set Homepage:** Use the extension's popup (click the toolbar icon) to enter the URL you want as your homepage and save it.
2.  **Set Shortcut:** Go to `chrome://extensions/shortcuts`. Find TakeMeHome and assign a keyboard shortcut to the "Focus or Open Homepage" command.
3.  **Use Shortcut:** Pressing the assigned shortcut will:
    *   Switch to an existing tab open to your homepage URL, if one exists.
    *   Open the homepage URL in a new tab, if no matching tab is found.

## Installation

1.  Download or clone the repository.
2.  Open Chrome, go to `chrome://extensions/`.
3.  Enable "Developer mode".
4.  Click "Load unpacked" and select the extension's folder.

## Permissions

*   `storage`: To save the homepage URL setting.
*   `tabs`: To find, focus, and open tabs.
*   `commands`: To enable the keyboard shortcut.
*   `action`: To provide the popup for setting the URL.

## License

GNU General Public License v3.0
