# TakeMeHome - Internal Development Guide

> **Note**: This file is for internal development purposes only and is not included in the public repository.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Design Decisions](#design-decisions)
4. [Common Issues & Solutions](#common-issues--solutions)
5. [Development Guidelines](#development-guidelines)

## Project Overview

TakeMeHome is a Chrome extension that redirects new tabs to a user-defined homepage. It's designed to maintain a single instance of the homepage tab rather than creating multiple duplicates, improving the browsing experience.

### Key Features
- Automatic redirection of new tabs to a user-defined homepage
- Single homepage tab instance management (focus existing tab instead of opening duplicates)
- Support for local addresses (localhost, 127.0.0.1, etc.)
- File protocol support
- Link interception on the homepage to open links in new tabs
- Dark/light mode support

## Architecture

### File Structure
- `manifest.json` - Extension configuration
- `js/` - JavaScript modules
  - `background.js` - Service worker (background script)
  - `content.js` - Content script injected into web pages
  - `popup.js` - Popup UI functionality
  - `redirect.js` - New tab redirect functionality
  - `utils.js` - Shared utility functions
  - `constants.js` - Shared constants
- `popup.html` - Extension popup UI
- `redirect.html` - Intermediate redirect page
- `icons/` - Extension icons

### Module Responsibilities

#### Background Script (Service Worker)
Responsible for:
- Tracking the homepage tab ID
- Managing tab focus and creation
- Providing homepage status to other components
- Listening for tab events (updates, closures)

Key functions:
- `scanForHomepageTab()` - Finds existing homepage tabs
- `verifyHomepageTab()` - Verifies if a tab ID is still valid
- `focusOrCreateHomepageTab()` - Main logic for tab management

#### Content Script
Responsible for:
- Registering a tab as the homepage tab
- Setting up link interception on the homepage
- Handling link clicks to open in new tabs
- Ensuring proper focus when needed

#### Redirect Script
Responsible for:
- Handling new tab redirection
- Checking if a homepage tab already exists
- Either focusing existing homepage tab or redirecting
- Showing error/status hints when redirection takes too long or fails

#### Popup Script
Responsible for:
- Providing UI for setting homepage URL
- Validating and saving user settings
- Showing status messages to the user
- Warning about URLs without protocols (but allowing them)

#### Utils & Constants
- Shared utility functions for URL handling
- Debug logging functionality (planned for future removal)
- Consistent constants (local patterns, markers)

## Design Decisions

### Single Registration Point
**Decision**: Consolidate tab registration logic to a single function.

**Reasoning**: Early versions had registration logic in two places, which caused errors when both tried to register simultaneously.

**Implementation**: Created `registerAsHomepageTab()` function that both registration points call.

### Module Pattern
**Decision**: Use ES modules with explicit imports/exports.

**Reasoning**: Provides better code organization, avoids global namespace pollution, and makes dependencies clear.

### URL Handling
**Decision**: Simplified URL handling to let browser handle protocols naturally.

**Reasoning**: Modern browsers handle URLs intelligently, adding appropriate protocols automatically. Extra processing created more bugs than it solved.

**Implementation**: Just warn users about missing protocols but let browser handle actual interpretation. This works with all URL types including chrome://, file://, custom protocols, etc.

### Event Delegation
**Decision**: Use event delegation for link handling.

**Reasoning**: More efficient than attaching listeners to each link, especially on pages with many links.

**Implementation**: Single listener on document.body that checks if clicked element is a link.

### Error Handling
**Decision**: Comprehensive try/catch blocks with detailed error logging and user feedback.

**Reasoning**: Chrome extensions run in various environments and can encounter numerous edge cases.

**Implementation**: 
- Every async operation and message passing is wrapped in try/catch with specific error messages
- User-friendly error hints appear in the redirect page after timeout or on error
- Different messages for different error conditions (no homepage set, redirect failure, etc.)

### Debug Mode Flag
**Decision**: Centralized DEBUG_MODE constant (planned for future removal).

**Reasoning**: Currently provides easy debugging but creates unnecessary complexity for such a simple extension.

**Implementation**: `debugLog()` function that only outputs when DEBUG_MODE is true. This functionality will be removed in a future update to simplify the codebase.

### Content Security Policy
**Decision**: Strict CSP with self-source restrictions.

**Reasoning**: Enhances security by preventing injection attacks and limiting script sources.

**Implementation**: No inline scripts used to comply with CSP best practices.

### Permissions
**Decision**: Request only required permissions with specific patterns.

**Reasoning**: Follows principle of least privilege, making the extension more likely to be approved by users and stores.

**Implementation**: Specific host patterns (http://*/*, https://*/*, file:///*) instead of all_urls.

## Common Issues & Solutions

### "Error registering homepage tab: [object Object]"
**Issue**: Chrome runtime errors are displayed as [object Object] instead of meaningful messages.

**Solution**: Use `chrome.runtime.lastError.message || chrome.runtime.lastError` to extract proper error message.

### Tab Detection Issues
**Issue**: Sometimes tabs aren't properly detected as homepage tabs.

**Solution**: Two-pronged approach:
1. URL comparison (origin + pathname) for regular homepage detection
2. Special marker in URL for explicit marking

### Redirect Hanging Issues
**Issue**: When URL is incorrect or server is down, redirect page spins indefinitely.

**Solution**: Added delayed hint message and error-specific messages on the redirect page to inform user when:
1. No homepage is set
2. Redirection is taking too long
3. Specific errors occur during redirection

### Popup Blocker Interaction
**Issue**: Link interception might be blocked by popup blockers.

**Solution**: Fallback navigation in the current window if popup is blocked.

### Content Script Timing
**Issue**: Content script might execute before page is fully loaded.

**Solution**: Execute critical functions in DOMContentLoaded or directly in the script (it runs after DOM is parsed).

## Development Guidelines

### Adding New Features
1. Create a backup before starting (run backup.ps1)
2. Follow the existing module pattern
3. Add any new shared functionality to utils.js
4. Add any new constants to constants.js
5. Test thoroughly

### Debugging Tips
1. Use Chrome's extension debugging tools:
   - chrome://extensions > Details > background page
   - Browser console for content script logs
2. Test with various URL formats and browser states
3. Check user messages on redirect page when errors occur

### Best Practices
1. Always clean up event listeners to prevent memory leaks
2. Use try/catch around Chrome API calls
3. Check for chrome.runtime.lastError after any messaging
4. Follow Chrome's Manifest V3 guidelines
5. Keep permissions to the minimum necessary
6. Test across Chrome versions (at least latest stable and beta)
7. Keep It Simple Stupid (KISS) - let browser handle complexity when possible

### Version Updates
1. Update version number in manifest.json
2. Update last updated date in file headers
3. Test all functionality
4. Create a backup of the final version
5. If significant changes, update the public README.md

## Browser Compatibility
- Chrome 88+ (full support)
- Edge 88+ (Chromium-based Edge)
- Opera 74+ (Chromium-based Opera)
- Not compatible with Firefox (uses Chrome-specific APIs)