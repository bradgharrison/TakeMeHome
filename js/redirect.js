/**
 * TakeMeHome Extension - Redirect Script
 * Version: 0.1
 * Last updated: 2024-03-28 14:00
 */

// Define constants directly
const HOMEPAGE_MARKER = 'TakeMeHomeSameTab';

// Define utility functions
function addHomepageMarkerToUrl(url) {
    if (!url) return url;

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${HOMEPAGE_MARKER}=true`;
}

// Show hint message with specified text
function showHint(message) {
    const hint = document.getElementById('hint');
    if (hint) {
        if (message) {
            hint.textContent = message;
        } else {
            // Default message with protocol reminder (no clickable link)
            hint.textContent = 'Having trouble? Make sure your URL is set and it includes http:// or https:// (if needed) in the extension settings.';
        }
        hint.classList.add('visible');
    }
}

// Redirect functionality
(async function () {
    // Set up delayed hint
    setTimeout(() => {
        const hint = document.getElementById('hint');
        if (hint && !hint.classList.contains('visible')) {
            showHint();
        }
    }, 3000);

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
        showHint('Error occurred while redirecting. Please check the extension settings.');
    }
})();

// Check if we should redirect
function checkRedirectStatus() {
    return new Promise((resolve) => {
        // Always use single-tab mode now
        chrome.runtime.sendMessage({ action: 'checkRedirectStatus' }, function (response) {
            if (chrome.runtime.lastError) {
                console.error("[TakeMeHome Redirect]", "Error checking redirect status: " + chrome.runtime.lastError.message);
                showHint('Error checking redirect status. Please try again.');
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
        if (!data.homepage || data.homepage.trim() === '') {
            showHint('No homepage set. Please configure one with http:// or https:// in the extension settings.');
            return;
        }

        try {
            // Just add the marker and let the browser handle the URL
            const url = addHomepageMarkerToUrl(data.homepage.trim());
            window.location.href = url;
        } catch (e) {
            console.error("[TakeMeHome Redirect]", "Error redirecting: " + e);
            showHint('Error redirecting. Make sure your URL includes http:// or https:// in the extension settings.');
        }
    });
}

// Focus an existing tab
function focusExistingTab(tabId, resetUrl, resetToUrl) {
    chrome.tabs.update(tabId, { active: true }, function (tab) {
        if (chrome.runtime.lastError) {
            console.error("[TakeMeHome Redirect]", "Failed to focus tab: " + chrome.runtime.lastError.message);
            showHint('Failed to focus existing tab. Please try again.');
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