/**
 * Claude Platform Adapter
 * Provides Claude-specific DOM selectors and configuration
 */

class ClaudeAdapter extends BasePlatformAdapter {
  /**
   * Get the CSS selector for individual message elements
   * Claude uses a different DOM structure compared to ChatGPT
   * @returns {string} CSS selector
   */
  getMessageSelector() {
    // Claude message structure: Uses semantic divs with role indicators
    // Multiple selectors for robustness against DOM changes
    return [
      '[data-test-render-count]',                    // Primary: Message containers with render tracking
      'div[class*="font-claude-message"]',           // Messages with Claude-specific font classes
      '.group\\/conversation-turn',                  // Conversation turn groups
      'div.relative.w-full',                         // Relative positioned message wrappers
      'main > div > div > div > div[class*="flex"]'  // Fallback: Flex containers in main
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
      'div[class*="conversation"]',
      '.flex.flex-col.items-center'
    ].join(', ');
  }

  /**
   * Calculate the scroll offset to account for fixed headers
   * Claude typically has a fixed header at the top
   * @returns {number} Offset in pixels
   */
  calculateScrollOffset() {
    const header = document.querySelector('header');
    if (header) {
      return header.offsetHeight + 16; // Add some padding
    }
    return 60; // Default offset for Claude
  }

  /**
   * Detect the current theme (light or dark mode)
   * Claude uses class-based theme switching similar to ChatGPT
   * @returns {'light' | 'dark'} Current theme
   */
  detectTheme() {
    // Check for dark mode class on html or body element
    const isDark = document.documentElement.classList.contains('dark') ||
                   document.body.classList.contains('dark') ||
                   document.documentElement.getAttribute('data-theme') === 'dark' ||
                   document.querySelector('[data-theme="dark"]') !== null;

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

    // Exclude loading indicators or placeholders
    if (element.classList.contains('loading') ||
        element.classList.contains('placeholder')) {
      return false;
    }

    // Exclude very small elements (likely UI components, not messages)
    if (element.offsetHeight < 20) {
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
    // Strategy 1: Check for data attributes indicating role
    const dataRole = element.getAttribute('data-message-author') ||
                     element.getAttribute('data-author-role');

    if (dataRole) {
      if (dataRole.toLowerCase().includes('user') || dataRole.toLowerCase().includes('human')) {
        return 'user';
      }
      if (dataRole.toLowerCase().includes('assistant') ||
          dataRole.toLowerCase().includes('claude')) {
        return 'assistant';
      }
    }

    // Strategy 2: Look for role indicators in child elements
    const roleIndicator = element.querySelector('[data-role]');
    if (roleIndicator) {
      const role = roleIndicator.getAttribute('data-role');
      if (role === 'user' || role === 'human') return 'user';
      if (role === 'assistant' || role === 'claude') return 'assistant';
    }

    // Strategy 3: Check for class-based indicators
    if (element.classList.contains('user-message') ||
        element.querySelector('.user-message') ||
        element.querySelector('[class*="human"]')) {
      return 'user';
    }

    if (element.classList.contains('assistant-message') ||
        element.querySelector('.assistant-message') ||
        element.querySelector('[class*="claude"]')) {
      return 'assistant';
    }

    // Strategy 4: Analyze positioning (user messages often align right)
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.justifyContent === 'flex-end' ||
        computedStyle.alignSelf === 'flex-end') {
      return 'user';
    }

    // Strategy 5: Check parent containers for role hints
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      const parentRole = parent.getAttribute('data-message-author') ||
                        parent.getAttribute('data-author-role');
      if (parentRole) {
        if (parentRole.toLowerCase().includes('user') ||
            parentRole.toLowerCase().includes('human')) {
          return 'user';
        }
        if (parentRole.toLowerCase().includes('assistant') ||
            parentRole.toLowerCase().includes('claude')) {
          return 'assistant';
        }
      }
      parent = parent.parentElement;
    }

    return 'unknown';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClaudeAdapter;
}
