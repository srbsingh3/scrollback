/**
 * Scrollback - Content Script Entry Point
 * Adds Notion-style anchor indicators to AI chat conversations
 */

(function() {
  'use strict';

  // Debug mode - set to true for verbose logging, false for production
  const DEBUG = false;
  const log = DEBUG ? console.log.bind(console, '[Scrollback]') : () => {};
  const warn = console.warn.bind(console, '[Scrollback]');
  const error = console.error.bind(console, '[Scrollback]');

  log('Extension loaded');

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
    log('Starting initialization...');

    // Check if platform is supported
    if (!platformRouter.isSupported()) {
      log('Unsupported platform - extension will not run');
      return;
    }

    // Get platform adapter
    const adapter = platformRouter.getAdapter();

    if (!adapter) {
      warn('Failed to get platform adapter');
      return;
    }

    log('Platform detected -', adapter.getPlatformName());

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
      log('Timeout waiting for conversation container');
    }, 10000);
  }

  /**
   * Initialize extension components
   * @param {object} adapter - Platform adapter
   */
  function initializeExtension(adapter) {
    try {
      log('Initializing components...');

      // For Claude (React-based SPA), wait for React hydration to complete
      // This prevents React error #418 (hydration mismatch)
      const isClaude = adapter.getPlatformName() === 'Claude';

      if (isClaude) {
        log('Claude platform detected - waiting for React hydration...');

        // Use requestIdleCallback for better performance (initializes when browser is idle)
        // Falls back to setTimeout if not supported
        const initWhenReady = window.requestIdleCallback || ((cb) => setTimeout(cb, 500));

        initWhenReady(() => {
          initializeComponents(adapter);
        });
      } else {
        // ChatGPT and other platforms - initialize immediately
        initializeComponents(adapter);
      }

    } catch (err) {
      error('Failed to initialize extension:', err);
    }
  }

  /**
   * Initialize component instances
   * @param {object} adapter - Platform adapter
   */
  function initializeComponents(adapter) {
    try {
        // Create component instances
        const messageDetector = new MessageDetector(adapter);
        const anchorGenerator = new AnchorGenerator();
        const anchorUI = new AnchorUI(adapter);
        const scrollNavigator = new ScrollNavigator(adapter);
        const anchorInjector = new AnchorInjector(adapter);

        // Initialize the anchor injector with all components
        anchorInjector.initialize(messageDetector, anchorGenerator, anchorUI, scrollNavigator);

          log('Extension initialized successfully');

        // Store reference globally for debugging
        window.__scrollback = {
          router: platformRouter,
          injector: anchorInjector,
          detector: messageDetector,
          generator: anchorGenerator,
          ui: anchorUI,
          navigator: scrollNavigator,
          adapter: adapter,
          debug: DEBUG
        };

      // Set up navigation listener to detect chat switching
      setupNavigationListener(anchorInjector);

    } catch (err) {
      error('Failed to initialize components:', err);
    }
  }

  /**
   * Set up listener for navigation/URL changes to handle chat switching
   * Uses Page Visibility API to pause polling when tab is hidden (resource optimization)
   * @param {object} anchorInjector - The anchor injector instance
   */
  function setupNavigationListener(anchorInjector) {
    let lastUrl = location.href;
    let urlCheckInterval = null;

    // Function to handle URL changes
    const handleUrlChange = () => {
      const currentUrl = location.href;

      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;

        // Invalidate scroll container cache when navigating
        if (window.__scrollback?.adapter?.invalidateScrollContainerCache) {
          window.__scrollback.adapter.invalidateScrollContainerCache();
        }

        // Clear existing anchors and reinitialize detection
        // Give the SPA time to update the DOM
        setTimeout(() => {
          if (anchorInjector) {
            anchorInjector.clearAllAnchors();
            anchorInjector.messageDetector.detectExistingMessages();
          }
        }, 800);
      }
    };

    // Intercept pushState and replaceState for SPA navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      handleUrlChange();
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      handleUrlChange();
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleUrlChange);

    // Visibility-aware polling functions (zero CPU when tab hidden)
    const startPolling = () => {
      if (!urlCheckInterval) {
        urlCheckInterval = setInterval(() => {
          if (location.href !== lastUrl) {
            handleUrlChange();
          }
        }, 500);
      }
    };

    const stopPolling = () => {
      if (urlCheckInterval) {
        clearInterval(urlCheckInterval);
        urlCheckInterval = null;
      }
    };

    // Pause polling when tab is hidden, resume when visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Check immediately on visibility restore in case URL changed
        if (location.href !== lastUrl) {
          handleUrlChange();
        }
        startPolling();
      }
    });

    // Start initial polling
    startPolling();

    // Clean up interval if page unloads
    window.addEventListener('beforeunload', () => {
      stopPolling();
    });
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // DOM already loaded
    initialize();
  }

})();
