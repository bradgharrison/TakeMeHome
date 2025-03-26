/**
 * TakeMeHome Extension - Popup Script
 * Version: 1.0
 * Last updated: 2024-03-28 14:00
 */

// Define constants directly
const LOCAL_ADDRESS_PATTERN = /(localhost|127\.0\.0\.1|::1|0\.0\.0\.0)/i;

// Define utility functions
function isLocalAddress(url) {
    return url && LOCAL_ADDRESS_PATTERN.test(url);
}

'use strict';

// Show status message to the user
function showStatus(message, type = 'success') {
    const status = document.getElementById('status');
    if (!status) return;

    status.textContent = message;
    status.className = type === 'success' ? 'success visible' : 'warning visible';

    if (message) setTimeout(() => status.classList.remove('visible'), 3000);
}

// Check if URL has a protocol
function hasProtocol(url) {
    return url && /^[a-zA-Z]+:\/\//.test(url);
}

// Load saved options when popup opens
document.addEventListener('DOMContentLoaded', function () {
    // Load homepage URL
    chrome.storage.local.get(['homepage'], function (data) {
        const homepageInput = document.getElementById('homepage');

        if (data.homepage) {
            homepageInput.value = data.homepage;
        }
    });

    // Set up save button
    document.getElementById('save').addEventListener('click', function () {
        saveOptions();
    });

    // Handle Enter key in input field
    document.getElementById('homepage').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            saveOptions();
        }
    });
});

// Save options to Chrome storage
function saveOptions() {
    let homepage = document.getElementById('homepage').value.trim();
    
    // Warn about missing protocol but allow saving
    if (!hasProtocol(homepage)) {
        showStatus('Warning: URL has no protocol (http://, https://, etc). It may not work as expected.', 'warning');
    }

    // Save to storage (always using single tab mode)
    chrome.storage.local.set({
        homepage: homepage,
        sameTab: true
    }, function () {
        if (hasProtocol(homepage)) {
            showStatus('Saved');
        }
    });
}