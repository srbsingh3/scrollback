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

      // Set up navigation listener to detect chat switching
      setupNavigationListener(anchorInjector);

    } catch (error) {
      console.error('Scrollback: Failed to initialize extension:', error);
    }
  }

  /**
   * Set up listener for navigation/URL changes to handle chat switching
   * @param {object} anchorInjector - The anchor injector instance
   */
  function setupNavigationListener(anchorInjector) {
    let lastUrl = location.href;
    console.log('Scrollback: setupNavigationListener called with URL:', lastUrl);
    console.log('Scrollback: anchorInjector available:', !!anchorInjector);

    // Function to handle URL changes
    const handleUrlChange = () => {
      const currentUrl = location.href;
      console.log('Scrollback: handleUrlChange called', {
        lastUrl: lastUrl,
        currentUrl: currentUrl,
        changed: currentUrl !== lastUrl
      });

      if (currentUrl !== lastUrl) {
        console.log('🔄 Scrollback: URL CHANGED! Reinitializing anchors...', {
          from: lastUrl,
          to: currentUrl
        });

        lastUrl = currentUrl;

        // Clear existing anchors and reinitialize detection
        // Give the SPA time to update the DOM
        console.log('Scrollback: Setting 800ms timeout for reinitialization...');
        setTimeout(() => {
          console.log('Scrollback: Timeout complete, executing reinitialization...');
          if (anchorInjector) {
            console.log('Scrollback: Calling clearAllAnchors...');
            anchorInjector.clearAllAnchors();

            console.log('Scrollback: Calling detectExistingMessages...');
            anchorInjector.messageDetector.detectExistingMessages();

            console.log('Scrollback: Reinitialization complete. Stats:', anchorInjector.getStats());
          } else {
            console.error('Scrollback: anchorInjector is null/undefined!');
          }
        }, 800);
      }
    };

    // Intercept pushState and replaceState for SPA navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      console.log('Scrollback: pushState called', args);
      originalPushState.apply(this, args);
      handleUrlChange();
    };

    history.replaceState = function(...args) {
      console.log('Scrollback: replaceState called', args);
      originalReplaceState.apply(this, args);
      handleUrlChange();
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleUrlChange);

    // Also use MutationObserver as a fallback
    const observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        handleUrlChange();
      }
    });

    observer.observe(document, {
      subtree: true,
      childList: true
    });

    console.log('Scrollback: Navigation listener set up');
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // DOM already loaded
    initialize();
  }

})();
