/**
 * TakeMeHome Extension - Content Script
 * Version: 0.1
 * Last updated: 2024-03-28 14:00
 */

// Import shared constants and utilities
import { HOMEPAGE_MARKER } from './constants.js';
import { hasHomepageMarker } from './utils.js';

// Flag to prevent multiple handlers from processing the same click
let processingClick = false;

// Check if this is our homepage tab by looking for the special marker
function isHomepageTab() {
    return hasHomepageMarker(window.location.href);
}

// Function to ensure the page has focus
function ensurePageFocus() {
    try {
        // Focus the window
        window.focus();

        // Focus the document
        document.body.focus();

        // If there's a search input on the page, focus it
        const searchInput = document.querySelector('input[type="search"], input[type="text"]');
        if (searchInput) {
            searchInput.focus();
        }

        console.log("[TakeMeHome Content]", "Page focus set");
    } catch (e) {
        console.error("[TakeMeHome Content]", "Error setting focus: " + e);
    }
}

// Mark this tab as the homepage tab if it has our special marker
function markHomepageTab() {
    try {
        // Check if this is our homepage
        if (isHomepageTab()) {
            chrome.runtime.sendMessage({ action: 'markAsHomepageTab' }, function (response) {
                if (chrome.runtime.lastError) {
                    console.error("[TakeMeHome Content]", "Error marking homepage tab: " + chrome.runtime.lastError.message);
                    return;
                }

                // Register success and set up link handling
                console.log("[TakeMeHome Content]", "Successfully registered as homepage tab");
                setupLinkHandling();
            });
        }
    } catch (e) {
        console.error("[TakeMeHome Content]", "Error marking tab: " + e);
    }
}

// Set up link click handling to keep the homepage tab open
function setupLinkHandling() {
    console.log("[TakeMeHome Content]", "Setting up link handlers on homepage");

    // Find all links on the page
    document.querySelectorAll('a[href]').forEach(link => {
        // Skip links that should open in the same tab
        if (link.target === '_self' || link.getAttribute('rel') === 'noopener') {
            return;
        }

        // Add click event listener
        link.addEventListener('click', function (event) {
            handleLinkClick(this, event);
        });
    });
}

// Handle a new link click
function handleLinkClick(link, event) {
    // Prevent multiple handlers from processing the same click
    if (processingClick) return;
    processingClick = true;

    try {
        console.log("[TakeMeHome Content]", "Intercepting link click: " + link.href);

        // Stop the default navigation
        event.preventDefault();

        // Try to open the link in a new window/tab
        window.open(link.href, '_blank');

        console.log("[TakeMeHome Content]", "Successfully opened new window");
    } catch (err) {
        // Popup blocker might be active
        console.error("[TakeMeHome Content]", "Failed to open new window - popup blocked?");

        // Fall back to just navigating in this window
        try {
            window.location.href = link.href;
        } catch (err) {
            console.error("[TakeMeHome Content]", "Error opening window: " + err);
        }
    } finally {
        processingClick = false;
    }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    // Handle focus request
    if (message.action === 'ensurePageFocus') {
        console.log("[TakeMeHome Content]", "Ensuring page has focus");

        // Check if user is already typing - don't steal focus in that case
        const activeElement = document.activeElement;
        if (activeElement &&
            (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') &&
            activeElement.value &&
            activeElement.value.length > 0) {
            console.log("[TakeMeHome Content]", "User is already typing, not changing focus");
            return;
        }

        ensurePageFocus();
    }
});

// Initialize on page load
(function init() {
    // Log that we're running
    console.log("[TakeMeHome Content]", "Content script running on: " + window.location.href);

    // Check if this is a homepage tab
    if (isHomepageTab()) {
        console.log("[TakeMeHome Content]", "This is our homepage tab");
        markHomepageTab();
    }
})();