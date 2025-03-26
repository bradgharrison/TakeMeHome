/**
 * TakeMeHome Extension - Background Script
 * Version: 1.0
 * Last updated: 2025-03-26
 */

// Define constants directly instead of importing
const HOMEPAGE_MARKER = 'TakeMeHomeSameTab';
const LOCAL_ADDRESS_PATTERN = /(localhost|127\.0\.0\.1|::1|0\.0\.0\.0)/i;
const DEBUG_MODE = false;

// Define utility functions directly
function debugLog(message, data) {
    if (DEBUG_MODE) {
        console.log(`[TakeMeHome] ${message}`, data || '');
    }
}

function hasHomepageMarker(url) {
    return url && url.includes(HOMEPAGE_MARKER);
}

function addHomepageMarkerToUrl(url) {
    if (!url) return url;

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${HOMEPAGE_MARKER}=true`;
}

// Format a URL with homepage marker
function formatHomepageUrl(url) {
    if (!url) return null;
    return addHomepageMarkerToUrl(url);
}

// Simple URL formatting for comparison
function formatUrl(url) {
    return url && url.endsWith('/') ? url : url + '/';
}

// Helper function to check if a URL is valid and non-empty
function isValidHomepage(url) {
    return url && typeof url === 'string' && url.trim() !== '';
}

// Track current homepage tab
let homepageTabId = null;

// Basic new tab handling
chrome.tabs.onCreated.addListener((newTab) => {
    // Only handle proper new tabs
    if (newTab.url === 'chrome://newtab/' || newTab.pendingUrl === 'chrome://newtab/') {
        chrome.storage.local.get(['homepage'], ({ homepage }) => {
            if (!homepage) return;

            chrome.tabs.query({}, tabs => {
                // Find existing homepage tab that's not being created right now
                const existing = tabs.find(t =>
                    t.url?.includes(homepage) &&
                    t.id !== newTab.id &&
                    !t.pendingUrl
                );

                if (existing) {
                    // Focus existing tab and remove the new one
                    chrome.tabs.update(existing.id, { active: true });
                    chrome.tabs.remove(newTab.id);
                } else {
                    // Update the new tab to homepage
                    chrome.tabs.update(newTab.id, { url: formatUrl(homepage) });
                }
            });
        });
    }
});

// Helper function to ensure tab has focus
function ensureTabFocus(tabId) {
    // First get the tab details to get its window
    chrome.tabs.get(tabId, function (tab) {
        if (chrome.runtime.lastError) return;

        // Focus the tab's window
        chrome.windows.update(tab.windowId, { focused: true });

        // Focus the tab itself
        chrome.tabs.update(tabId, { active: true });

        // Send a message to the tab to ensure page-level focus
        chrome.tabs.sendMessage(tabId, { action: 'ensurePageFocus' });
    });
}

// Verify a tab is still on the homepage
function verifyHomepageTab(callback) {
    if (homepageTabId === null) {
        callback(false);
        return;
    }

    chrome.tabs.get(homepageTabId, function (tab) {
        if (chrome.runtime.lastError || !tab || !tab.url) {
            homepageTabId = null;
            callback(false);
            return;
        }

        // Check if the tab URL has our marker using the utility function
        const isOnHomepage = hasHomepageMarker(tab.url);
        if (!isOnHomepage) {
            homepageTabId = null;
        }

        callback(isOnHomepage, tab, formatUrl(tab.url));
    });
}

// Listen for messages from popup and content script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    // Handle constants request
    if (message.action === 'getConstants') {
        sendResponse({
            HOMEPAGE_MARKER: HOMEPAGE_MARKER
        });
        return true; // Keep the message channel open
    }
    
    // Handle opening the popup
    if (message.action === 'openPopup') {
        chrome.action.openPopup();
        return true;
    }
    
    // Handle redirect status check
    if (message.action === 'checkRedirectStatus') {
        chrome.storage.local.get(['homepage'], function (data) {
            // If we have a homepage tab and the message is from a new tab page
            if (homepageTabId !== null && sender.tab &&
                (sender.tab.pendingUrl === 'chrome://newtab/' || sender.tab.url.includes('chrome://newtab'))) {

                // First verify our homepage tab is still on the correct URL
                verifyHomepageTab(function (isOnHomepage, tab, homepageUrl) {
                    if (!isOnHomepage) {
                        // If the tab has navigated away, we'll reset it back to homepage
                        debugLog("Homepage tab has navigated away, will reset it when focused");

                        sendResponse({
                            shouldRedirect: false,
                            focusExistingTab: true,
                            homepageTabId: homepageTabId,
                            resetUrl: true,
                            resetToUrl: formatUrl(homepageUrl)
                        });
                    } else {
                        // Still on homepage, just focus it
                        debugLog("Homepage tab is still on correct URL, will focus it");

                        sendResponse({
                            shouldRedirect: false,
                            focusExistingTab: true,
                            homepageTabId: homepageTabId
                        });
                    }
                });

                return true; // Keep the message channel open for async response
            } else {
                // For a new tab when there's no homepage tab yet, set it up
                if (homepageTabId === null && data.homepage) {
                    // We'll mark this as our future homepage tab
                    debugLog("First tab scenario - will mark as homepage when redirected");
                    homepageTabId = sender.tab.id;
                }

                sendResponse({
                    shouldRedirect: !!data.homepage,
                    focusExistingTab: false
                });
            }
        });

        return true; // Required for async sendResponse
    }

    // Handle marking as homepage tab
    if (message.action === 'markAsHomepageTab') {
        // If sender is a tab, store its ID
        if (sender.tab) {
            homepageTabId = sender.tab.id;
            debugLog("Marked tab " + homepageTabId + " as homepage tab");
            sendResponse({ success: true, tabId: homepageTabId });
        } else {
            sendResponse({ success: false, error: 'Not called from a tab' });
        }
        return true;
    }

    // Handle tab existence check
    if (message.action === 'isHomepageTabOpen') {
        if (homepageTabId !== null) {
            // Verify the tab still exists
            chrome.tabs.get(homepageTabId, function (tab) {
                if (chrome.runtime.lastError) {
                    // Tab doesn't exist anymore
                    homepageTabId = null;
                    debugLog("Homepage tab doesn't exist anymore");
                    sendResponse({ exists: false });
                } else {
                    debugLog("Homepage tab exists: " + homepageTabId);
                    sendResponse({ exists: true, tabId: homepageTabId });
                }
            });
        } else {
            debugLog("No homepage tab tracked");
            sendResponse({ exists: false });
        }
        return true;
    }
});

// Listen for tab updates to maintain tracking
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        // If this is our tracked tab
        if (tabId === homepageTabId) {
            // Verify it's still on our homepage using the utility function
            if (!tab.url || !hasHomepageMarker(tab.url)) {
                homepageTabId = null;
                debugLog("Homepage tab navigated away, tracking reset");
            } else if (tab.active) {
                // If this is our homepage and it's active, ensure it maintains focus
                ensureTabFocus(tabId);
            }
        }
        // If this tab has our marker but isn't tracked
        else if (tab.url && hasHomepageMarker(tab.url)) {
            // If we're not tracking any tab, or this is a more recent homepage
            if (homepageTabId === null) {
                homepageTabId = tabId;
                debugLog("New homepage tab detected and tracked: " + tabId);
                if (tab.active) {
                    ensureTabFocus(tabId);
                }
            }
        }
    }
});

// Helper function to scan all tabs for a homepage tab
function scanForHomepageTab() {
    chrome.tabs.query({}, function (tabs) {
        let foundHomepageTab = false;
        for (let tab of tabs) {
            if (tab.url && hasHomepageMarker(tab.url)) {
                homepageTabId = tab.id;
                debugLog("Found existing homepage tab: " + tab.id);
                foundHomepageTab = true;

                // Verify the found tab is actually valid
                verifyHomepageTab(function (isOnHomepage) {
                    if (!isOnHomepage) {
                        homepageTabId = null;
                        debugLog("Found tab was not valid homepage");
                    }
                });
                break;
            }
        }

        if (!foundHomepageTab) {
            homepageTabId = null;
            debugLog("No homepage tab found in any window");
        }
    });
}

// Also add a check when any window is created
chrome.windows.onCreated.addListener(function () {
    debugLog("New window created, verifying homepage tab");
    if (homepageTabId !== null) {
        verifyHomepageTab(function (isOnHomepage) {
            if (!isOnHomepage) {
                scanForHomepageTab();
            }
        });
    } else {
        scanForHomepageTab();
    }
});