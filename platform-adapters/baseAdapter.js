/**
 * Base Platform Adapter Interface
 * Defines the contract that all platform adapters must implement
 */

class BasePlatformAdapter {
  /**
   * Get the CSS selector for individual message elements
   * @returns {string} CSS selector
   */
  getMessageSelector() {
    throw new Error('getMessageSelector() must be implemented');
  }

  /**
   * Get the CSS selector for the main conversation container
   * @returns {string} CSS selector
   */
  getContainerSelector() {
    throw new Error('getContainerSelector() must be implemented');
  }

  /**
   * Calculate the scroll offset to account for fixed headers
   * @returns {number} Offset in pixels
   */
  calculateScrollOffset() {
    throw new Error('calculateScrollOffset() must be implemented');
  }

  /**
   * Detect the current theme (light or dark mode)
   * @returns {'light' | 'dark'} Current theme
   */
  detectTheme() {
    throw new Error('detectTheme() must be implemented');
  }

  /**
   * Get positioning hints for anchor placement
   * @returns {object} Positioning configuration
   */
  getAnchorPosition() {
    return {
      side: 'right',
      offset: 8,
      topOffset: 12
    };
  }

  /**
   * Get platform name
   * @returns {string} Platform name
   */
  getPlatformName() {
    throw new Error('getPlatformName() must be implemented');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BasePlatformAdapter;
}
