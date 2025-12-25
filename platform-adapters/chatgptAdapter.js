/**
 * ChatGPT Platform Adapter
 * Provides ChatGPT-specific DOM selectors and configuration
 */

class ChatGPTAdapter {
  /**
   * Get the CSS selector for individual message elements
   * ChatGPT uses article elements with data-testid or specific classes
   * @returns {string} CSS selector
   */
  getMessageSelector() {
    // ChatGPT message structure: article elements or divs with specific attributes
    // We use a combination of selectors for robustness
    return [
      'article[data-testid^="conversation-turn"]',
      'div[data-message-author-role]',
      '.group.w-full.text-token-text-primary',
      'main > div > div > div > div'
    ].join(', ');
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
    // Check for data-message-author-role attribute
    const role = element.getAttribute('data-message-author-role');
    if (role) {
      return role === 'user' ? 'user' : 'assistant';
    }

    // Check for class-based indicators
    if (element.classList.contains('user-message') ||
        element.querySelector('[data-message-author-role="user"]')) {
      return 'user';
    }

    if (element.classList.contains('assistant-message') ||
        element.querySelector('[data-message-author-role="assistant"]')) {
      return 'assistant';
    }

    return 'unknown';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatGPTAdapter;
}
