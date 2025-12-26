/**
 * Claude Platform Adapter
 * Provides Claude-specific DOM selectors and configuration
 */

class ClaudeAdapter extends BasePlatformAdapter {
  /**
   * Get the CSS selector for individual message elements
   * Claude uses a different DOM structure compared to ChatGPT
   * Only selects user messages (not assistant messages)
   * @returns {string} CSS selector
   */
  getMessageSelector() {
    // Claude uses very specific data-testid attributes for user messages
    // This is a robust, precise selector that won't match unintended elements
    return '[data-testid="user-message"]';
  }

  /**
   * Get the CSS selector for the main conversation container
   * @returns {string} CSS selector
   */
  getContainerSelector() {
    // Claude's conversation container has very specific layout classes
    // Using the precise selector found via DOM inspection
    return '.flex-1.flex.flex-col.px-4.max-w-3xl.mx-auto.w-full.pt-1';
  }

  /**
   * Calculate the scroll offset to account for fixed headers
   * Claude has a sticky header at the top (48px height)
   * @returns {number} Offset in pixels
   */
  calculateScrollOffset() {
    const header = document.querySelector('[data-testid="page-header"]');
    if (header) {
      return header.offsetHeight + 16; // Header is 48px + 16px padding
    }
    return 64; // Default: 48px header + 16px padding
  }

  /**
   * Detect the current theme (light or dark mode)
   * Claude uses data-theme attribute on the html element
   * @returns {'light' | 'dark'} Current theme
   */
  detectTheme() {
    // Claude sets data-theme="claude" but also uses 'dark' class for dark mode
    const isDark = document.documentElement.classList.contains('dark') ||
                   document.body.classList.contains('dark');

    return isDark ? 'dark' : 'light';
  }

  /**
   * Get positioning hints for anchor placement
   * @returns {object} Positioning configuration
   */
  getAnchorPosition() {
    return {
      side: 'right',
      offset: 16,
      topOffset: 16
    };
  }

  /**
   * Get platform name
   * @returns {string} Platform name
   */
  getPlatformName() {
    return 'Claude';
  }

  /**
   * Get the scrollable container element for navigation
   * Claude uses a different scrollable container than the conversation container
   * @returns {Element|Window} Scrollable element
   */
  getScrollContainer() {
    // Claude's actual scrollable container (3 levels up from conversation container)
    const scrollableContainer = document.querySelector('.overflow-y-scroll.overflow-x-hidden.pt-6.flex-1');

    if (scrollableContainer) {
      return scrollableContainer;
    }

    // Fallback to window if not found
    return window;
  }

  /**
   * Check if an element is a valid message container
   * @param {Element} element - DOM element to check
   * @returns {boolean} True if element is a message
   */
  isValidMessage(element) {
    if (!element) return false;

    // Claude uses data-testid="user-message", so if it matches our selector, it's valid
    // We still do basic visibility checks to be safe
    if (element.offsetHeight === 0 || element.offsetWidth === 0) {
      return false;
    }

    // Must have the correct data-testid
    if (element.getAttribute('data-testid') !== 'user-message') {
      return false;
    }

    // Check if element has some content (even collapsed messages have some height)
    const textContent = element.textContent?.trim();
    if (!textContent || textContent.length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Determine if a message is from user or AI
   * @param {Element} element - Message element
   * @returns {'user' | 'assistant' | 'unknown'} Message author role
   */
  getMessageRole(element) {
    // Since we only select elements with data-testid="user-message",
    // all messages will be user messages
    if (element.getAttribute('data-testid') === 'user-message') {
      return 'user';
    }

    // If we somehow got an element without the correct data-testid, mark as unknown
    return 'unknown';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClaudeAdapter;
}
