/**
 * TakeMeHome Extension - Popup Script
 * Version: 0.1
 * Last updated: 2024-03-28 14:00
 */

// Import shared constants and utilities
import { LOCAL_ADDRESS_PATTERN } from './constants.js';
import { isLocalAddress } from './utils.js';

'use strict';

// Show status message to the user
function showStatus(message, type = 'success') {
    const status = document.getElementById('status');
    if (!status) return;

    status.textContent = message;
    status.className = type;

    if (message) setTimeout(() => status.textContent = '', 2000);
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
    const homepage = document.getElementById('homepage').value.trim();

    // Validate URL
    if (homepage && !homepage.includes('://')) {
        // Add https:// if no protocol is specified
        if (!homepage.startsWith('http://') && !homepage.startsWith('https://')) {
            // Local hostnames get http, everything else gets https
            const isLocal = isLocalAddress(homepage);
            if (isLocal) {
                homepage = 'http://' + homepage;
            } else {
                homepage = 'https://' + homepage;
            }
        }
    }

    // Save to storage (always using single tab mode)
    chrome.storage.local.set({
        homepage: homepage,
        sameTab: true
    }, function () {
        // Show saved message
        const status = document.getElementById('status');
        status.textContent = 'Options saved!';
        status.classList.add('visible');

        setTimeout(function () {
            status.classList.remove('visible');
        }, 1500);
    });
}