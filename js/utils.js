/**
 * Shared utility functions for the TakeMeHome extension
 */
import { LOCAL_ADDRESS_PATTERN, HOMEPAGE_MARKER, DEBUG_MODE } from './constants.js';

/**
 * Logs debug messages if debug mode is enabled
 * @param {string} message - Message to log
 * @param {any} data - Optional data to log
 */
function debugLog(message, data) {
    if (DEBUG_MODE) {
        console.log(`[TakeMeHome] ${message}`, data || '');
    }
}

/**
 * Checks if a URL has the homepage marker
 * @param {string} url - URL to check
 * @returns {boolean} True if the URL has the homepage marker
 */
function hasHomepageMarker(url) {
    return url && url.includes(HOMEPAGE_MARKER);
}

/**
 * Checks if a URL is for a local address
 * @param {string} url - URL to check
 * @returns {boolean} True if the URL is for a local address
 */
function isLocalAddress(url) {
    return url && LOCAL_ADDRESS_PATTERN.test(url);
}

/**
 * Adds the homepage marker to a URL
 * @param {string} url - URL to modify
 * @returns {string} URL with the homepage marker
 */
function addHomepageMarkerToUrl(url) {
    if (!url) return url;

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${HOMEPAGE_MARKER}=true`;
}

/**
 * Checks if a URL has a valid protocol (http:// or https://)
 * @param {string} url - URL to check
 * @returns {boolean} True if the URL has a valid protocol
 */
function hasValidProtocol(url) {
    return url && /^https?:\/\//i.test(url);
}

/**
 * Ensures a URL has a protocol. If no protocol is present, adds http://
 * Special cases:
 * - Keeps existing protocols unchanged
 * - Handles local addresses (adds http://)
 * - Preserves chrome://, file://, and other special protocols
 * @param {string} url - URL to ensure has a protocol
 * @returns {string} URL with protocol
 */
function ensureProtocol(url) {
    if (!url) return url;
    
    // If it already has a protocol, return as is
    if (url.match(/^[a-zA-Z]+:\/\//)) return url;
    
    // Handle local addresses
    if (isLocalAddress(url)) {
        return `http://${url}`;
    }
    
    // Add http:// as default protocol
    return `http://${url}`;
}

export {
    debugLog,
    hasHomepageMarker,
    isLocalAddress,
    addHomepageMarkerToUrl,
    hasValidProtocol,
    ensureProtocol
};