/**
 * Scrollback - Content Script Entry Point
 * Adds Notion-style anchor indicators to AI chat conversations
 */

(function() {
  'use strict';

  console.log('Scrollback extension loaded');

  // Create and configure platform router
  const platformRouter = new PlatformRouter();

  // Register available platform adapters
  platformRouter.registerAdapter(
    'chatgpt',
    () => new ChatGPTAdapter(),
    ['chatgpt.com', 'chat.openai.com']
  );

  // Register Claude adapter
  platformRouter.registerAdapter(
    'claude',
    () => new ClaudeAdapter(),
    ['claude.ai']
  );

  /**
   * Initialize the Scrollback extension
   */
  function initialize() {
    console.log('Scrollback: Starting initialization...');

    // Check if platform is supported
    if (!platformRouter.isSupported()) {
      console.log('Scrollback: Unsupported platform - extension will not run');
      console.log(`Scrollback: Supported platforms: ${platformRouter.getSupportedPlatforms().join(', ')}`);
      return;
    }

    // Get platform adapter
    const adapter = platformRouter.getAdapter();

    if (!adapter) {
      console.log('Scrollback: Failed to get platform adapter');
      return;
    }

    console.log(`Scrollback: Platform detected - ${adapter.getPlatformName()}`);

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
      console.log('Scrollback: Timeout waiting for conversation container');
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
        router: platformRouter,
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
