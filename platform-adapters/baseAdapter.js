/**
 * Base Platform Adapter Interface
 * Defines the contract that all platform adapters must implement
 *
 * Platform adapters provide platform-specific DOM selectors, styling,
 * and behavior customization for different AI chat platforms.
 */

class BasePlatformAdapter {
  /**
   * Get the CSS selector for individual message elements
   * This selector should match all message containers (both user and AI)
   *
   * @returns {string} CSS selector (can be comma-separated for multiple selectors)
   * @abstract
   */
  getMessageSelector() {
    throw new Error('getMessageSelector() must be implemented by subclass');
  }

  /**
   * Get the CSS selector for the main conversation container
   * This is the parent element that contains all messages
   * Used for setting up the MutationObserver
   *
   * @returns {string} CSS selector (can be comma-separated for fallbacks)
   * @abstract
   */
  getContainerSelector() {
    throw new Error('getContainerSelector() must be implemented by subclass');
  }

  /**
   * Calculate the scroll offset to account for fixed headers
   * Returns the height of fixed UI elements at the top of the page
   * Used for smooth scrolling to ensure messages aren't hidden behind headers
   *
   * @returns {number} Offset in pixels
   * @abstract
   */
  calculateScrollOffset() {
    throw new Error('calculateScrollOffset() must be implemented by subclass');
  }

  /**
   * Detect the current theme (light or dark mode)
   * Used to apply appropriate anchor styling
   *
   * @returns {'light' | 'dark'} Current theme
   * @abstract
   */
  detectTheme() {
    throw new Error('detectTheme() must be implemented by subclass');
  }

  /**
   * Get positioning hints for anchor placement
   * Defines where anchors should be positioned relative to messages
   *
   * @returns {object} Positioning configuration
   * @returns {string} return.side - Which side to place anchor ('left' | 'right')
   * @returns {number} return.offset - Distance from edge in pixels
   * @returns {number} return.topOffset - Distance from top of message in pixels
   */
  getAnchorPosition() {
    return {
      side: 'right',
      offset: 16,
      topOffset: 16
    };
  }

  /**
   * Get platform name for identification
   * Used for logging and debugging
   *
   * @returns {string} Platform name (e.g., 'ChatGPT', 'Claude')
   * @abstract
   */
  getPlatformName() {
    throw new Error('getPlatformName() must be implemented by subclass');
  }

  /**
   * Check if an element is a valid message container
   * Filters out empty elements, hidden elements, or non-message UI components
   *
   * @param {Element} element - DOM element to check
   * @returns {boolean} True if element is a valid message
   * @abstract
   */
  isValidMessage(element) {
    throw new Error('isValidMessage() must be implemented by subclass');
  }

  /**
   * Determine the role/author of a message
   * Identifies whether a message is from the user or the AI assistant
   *
   * @param {Element} element - Message element
   * @returns {'user' | 'assistant' | 'unknown'} Message author role
   * @abstract
   */
  getMessageRole(element) {
    throw new Error('getMessageRole() must be implemented by subclass');
  }

  /**
   * Get the unique identifier for this adapter
   * Used for platform detection and routing
   *
   * @returns {string} Adapter identifier (e.g., 'chatgpt', 'claude')
   */
  getAdapterId() {
    return this.getPlatformName().toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Get the scrollable container element for navigation
   * This is the element that should be scrolled when navigating to messages
   * May be different from the conversation container
   *
   * @returns {Element|Window} Scrollable element (defaults to window)
   */
  getScrollContainer() {
    return window;
  }

  /**
   * Validate that the adapter is compatible with the current page
   * Checks if required DOM elements exist
   *
   * @returns {boolean} True if adapter can be used on current page
   */
  isCompatible() {
    try {
      const container = document.querySelector(this.getContainerSelector());
      return container !== null;
    } catch (error) {
      console.warn(`Platform adapter compatibility check failed:`, error);
      return false;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BasePlatformAdapter;
}
