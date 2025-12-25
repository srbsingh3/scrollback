/**
 * Scrollback - Content Script Entry Point
 * Adds Notion-style anchor indicators to AI chat conversations
 */

(function() {
  'use strict';

  console.log('Scrollback extension loaded');

  // Import required modules by adding script tags
  // Since we're using vanilla JS without a bundler, we need to ensure scripts are loaded

  /**
   * Detect the current platform based on URL
   * @returns {string|null} Platform name or null if unsupported
   */
  function detectPlatform() {
    const hostname = window.location.hostname;

    if (hostname.includes('chatgpt.com')) {
      return 'chatgpt';
    } else if (hostname.includes('claude.ai')) {
      return 'claude';
    }

    return null;
  }

  /**
   * Get the appropriate platform adapter
   * @param {string} platform - Platform name
   * @returns {object|null} Platform adapter instance or null
   */
  function getPlatformAdapter(platform) {
    if (platform === 'chatgpt') {
      return new ChatGPTAdapter();
    } else if (platform === 'claude') {
      // Claude adapter not yet implemented
      console.log('Claude adapter not yet implemented');
      return null;
    }

    return null;
  }

  /**
   * Initialize the Scrollback extension
   */
  function initialize() {
    // Detect platform
    const platform = detectPlatform();

    if (!platform) {
      console.log('Scrollback: Unsupported platform');
      return;
    }

    console.log(`Scrollback: Detected platform - ${platform}`);

    // Get platform adapter
    const adapter = getPlatformAdapter(platform);

    if (!adapter) {
      console.log('Scrollback: No adapter available for platform');
      return;
    }

    // Wait for the conversation container to be available
    const containerSelector = adapter.getContainerSelector();
    const waitForContainer = setInterval(() => {
      const container = document.querySelector(containerSelector);

      if (container) {
        clearInterval(waitForContainer);
        initializeExtension(adapter);
      }
    }, 500);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(waitForContainer);
    }, 10000);
  }

  /**
   * Initialize extension components
   * @param {object} adapter - Platform adapter
   */
  function initializeExtension(adapter) {
    try {
      console.log('Scrollback: Initializing components...');

      // Create component instances
      const messageDetector = new MessageDetector(adapter);
      const anchorGenerator = new AnchorGenerator();
      const anchorUI = new AnchorUI(adapter);
      const scrollNavigator = new ScrollNavigator(adapter);
      const anchorInjector = new AnchorInjector(adapter);

      // Initialize the anchor injector with all components
      anchorInjector.initialize(messageDetector, anchorGenerator, anchorUI, scrollNavigator);

      console.log('Scrollback: Extension initialized successfully');

      // Optional: Log stats periodically for debugging
      if (process?.env?.NODE_ENV === 'development') {
        setInterval(() => {
          console.log('Scrollback stats:', anchorInjector.getStats());
        }, 5000);
      }

      // Store reference globally for debugging
      window.__scrollback = {
        injector: anchorInjector,
        detector: messageDetector,
        generator: anchorGenerator,
        ui: anchorUI,
        navigator: scrollNavigator,
        adapter: adapter
      };

    } catch (error) {
      console.error('Scrollback: Failed to initialize extension:', error);
    }
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // DOM already loaded
    initialize();
  }

})();
