/**
 * ChatGPT Platform Adapter
 * Provides ChatGPT-specific DOM selectors and configuration
 */

class ChatGPTAdapter extends BasePlatformAdapter {
  /**
   * Get the CSS selector for individual message elements
   * ChatGPT uses article elements with data-testid or specific classes
   * @returns {string} CSS selector
   */
  getMessageSelector() {
    // ChatGPT message structure: article elements with data-turn attribute
    // This selects both user and assistant turns
    return 'article[data-testid^="conversation-turn"]';
  }

  /**
   * Get the CSS selector for the main conversation container
   * @returns {string} CSS selector
   */
  getContainerSelector() {
    return [
      'main',
      '[role="main"]',
      '.flex-1.overflow-hidden'
    ].join(', ');
  }

  /**
   * Calculate the scroll offset to account for fixed headers
   * ChatGPT typically has a fixed header at the top
   * @returns {number} Offset in pixels
   */
  calculateScrollOffset() {
    const header = document.querySelector('header');
    if (header) {
      return header.offsetHeight + 16; // Add some padding
    }
    return 80; // Default offset
  }

  /**
   * Detect the current theme (light or dark mode)
   * ChatGPT uses class-based theme switching
   * @returns {'light' | 'dark'} Current theme
   */
  detectTheme() {
    // Check for dark mode class on html or body element
    const isDark = document.documentElement.classList.contains('dark') ||
                   document.body.classList.contains('dark') ||
                   document.querySelector('.dark') !== null;

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
   * Get the scrollable container element for navigation
   * ChatGPT uses an internal scrollable div, not the window
   * @returns {Element|Window} Scrollable element
   */
  getScrollContainer() {
    // ChatGPT's scroll container is a DIV with overflow-y: auto
    // Look for scrollable elements that contain conversation messages
    const scrollables = Array.from(document.querySelectorAll('main, div')).filter(el => {
      const style = window.getComputedStyle(el);
      return (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
             el.scrollHeight > el.clientHeight;
    });

    console.log('Found scrollable containers:', scrollables.length, scrollables);

    // Find the one that contains conversation articles
    for (const container of scrollables) {
      if (container.querySelector('article[data-testid^="conversation-turn"]')) {
        console.log('ScrollContainer found (contains articles):', container);
        return container;
      }
    }

    // If no container with articles, use the largest scrollable
    if (scrollables.length > 0) {
      const largest = scrollables.reduce((max, el) =>
        el.clientHeight > max.clientHeight ? el : max
      );
      console.log('ScrollContainer using largest:', largest);
      return largest;
    }

    console.log('ScrollContainer: falling back to window');
    return window;
  }

  /**
   * Get platform name
   * @returns {string} Platform name
   */
  getPlatformName() {
    return 'ChatGPT';
  }

  /**
   * Check if an element is a valid message container
   * @param {Element} element - DOM element to check
   * @returns {boolean} True if element is a message
   */
  isValidMessage(element) {
    if (!element) return false;

    // Filter out empty or non-visible elements
    if (element.offsetHeight === 0 || element.offsetWidth === 0) {
      return false;
    }

    // Check if element has meaningful content
    const textContent = element.textContent?.trim();
    if (!textContent || textContent.length === 0) {
      return false;
    }

    // Exclude system messages or UI elements
    if (element.hasAttribute('data-system-message')) {
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
    // Check for data-turn attribute on article elements
    const dataTurn = element.getAttribute('data-turn');
    if (dataTurn) {
      return dataTurn === 'user' ? 'user' : 'assistant';
    }

    // Check for data-message-author-role attribute
    const role = element.getAttribute('data-message-author-role');
    if (role) {
      return role === 'user' ? 'user' : 'assistant';
    }

    // Check for user-message-bubble-color class (user messages)
    if (element.classList.contains('user-message-bubble-color') ||
        element.querySelector('.user-message-bubble-color')) {
      return 'user';
    }

    // Check for nested data-turn or data-message-author-role
    if (element.querySelector('[data-turn="user"]') ||
        element.querySelector('[data-message-author-role="user"]')) {
      return 'user';
    }

    return 'assistant';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatGPTAdapter;
}
