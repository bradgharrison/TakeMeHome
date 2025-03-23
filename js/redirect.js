/**
 * TakeMeHome Extension - Redirect Script
 * Version: 0.1
 * Last updated: 2024-03-28 14:00
 */

// Import shared constants and utilities
import { LOCAL_ADDRESS_PATTERN, HOMEPAGE_MARKER } from './constants.js';
import { isLocalAddress, addHomepageMarkerToUrl } from './utils.js';

// Redirect functionality
(async function () {
    try {
        // If this is not a newtab page, we don't need to do anything
        if (!window.location.href.includes('chrome://newtab')) {
            return;
        }

        // Check if we should redirect
        const redirectInfo = await checkRedirectStatus();

        // If we should focus an existing tab
        if (redirectInfo.focusExistingTab && redirectInfo.homepageTabId) {
            focusExistingTab(
                redirectInfo.homepageTabId,
                redirectInfo.resetUrl,
                redirectInfo.resetToUrl
            );
            return;
        }

        // If we should redirect
        if (redirectInfo.shouldRedirect) {
            performRedirect();
        }
    } catch (e) {
        console.error("[TakeMeHome Redirect]", "Error in redirect logic: " + e);
    }
})();

// Check if we should redirect
function checkRedirectStatus() {
    return new Promise((resolve) => {
        // Always use single-tab mode now
        chrome.runtime.sendMessage({ action: 'checkRedirectStatus' }, function (response) {
            if (chrome.runtime.lastError) {
                console.error("[TakeMeHome Redirect]", "Error checking redirect status: " + chrome.runtime.lastError.message);
                resolve({ shouldRedirect: false });
                return;
            }

            if (response) {
                resolve(response);
            } else {
                resolve({ shouldRedirect: false });
            }
        });
    });
}

// Perform normal redirect
function performRedirect() {
    chrome.storage.local.get(['homepage'], function (data) {
        if (!data.homepage || data.homepage.trim() === '') return;

        try {
            // Format URL with protocol
            let url = data.homepage;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                const isLocal = isLocalAddress(url);
                url = isLocal ? 'http://' + url : 'https://' + url;
            }

            // Add marker for single-tab tracking using utility function
            url = addHomepageMarkerToUrl(url);

            // Redirect
            window.location.href = url;
        } catch (e) {
            console.error("[TakeMeHome Redirect]", "Error redirecting: " + e);
        }
    });
}

// Focus an existing tab
function focusExistingTab(tabId, resetUrl, resetToUrl) {
    chrome.tabs.update(tabId, { active: true }, function (tab) {
        if (chrome.runtime.lastError) {
            console.error("[TakeMeHome Redirect]", "Failed to focus tab: " + chrome.runtime.lastError.message);
            return;
        }

        // Focus window
        chrome.windows.update(tab.windowId, { focused: true });

        // Reset URL if needed
        if (resetUrl && resetToUrl) {
            chrome.tabs.update(tabId, { url: resetToUrl });
        }

        // Close current tab
        chrome.tabs.getCurrent(function (currentTab) {
            if (currentTab) {
                chrome.tabs.remove(currentTab.id);
            }
        });
    });
}