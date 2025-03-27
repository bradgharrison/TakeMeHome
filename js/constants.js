/**
 * Shared constants for the TakeMeHome extension
 */

// Pattern to match local addresses (localhost, 127.0.0.1, etc.)
const LOCAL_ADDRESS_PATTERN = /(localhost|127\.0\.0\.1|::1|0\.0\.0\.0)/i;

// Marker used to identify TakeMeHome tabs in the URL
const HOMEPAGE_MARKER = 'TakeMeHomeSameTab';

// Export constants
export {
    LOCAL_ADDRESS_PATTERN,
    HOMEPAGE_MARKER
};