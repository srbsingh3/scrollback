/**
 * Shared Utility Functions
 * Common utilities used across multiple modules
 */

/**
 * Simple hash function for generating stable IDs
 * Uses djb2 algorithm for consistent, fast hashing
 * @param {string} str - String to hash
 * @returns {string} Hash string (base36)
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { simpleHash };
}
