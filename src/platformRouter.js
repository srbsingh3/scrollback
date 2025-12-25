/**
 * Platform Router
 * Handles platform detection and adapter selection
 */

class PlatformRouter {
  constructor() {
    this.adapters = new Map(); // platform key -> adapter factory function
    this.currentAdapter = null;
    this.currentPlatform = null;
  }

  /**
   * Register a platform adapter
   * @param {string} platformKey - Platform identifier (e.g., 'chatgpt', 'claude')
   * @param {Function} adapterFactory - Function that returns an adapter instance
   * @param {Array<string>} hostnames - Array of hostname patterns to match
   */
  registerAdapter(platformKey, adapterFactory, hostnames) {
    this.adapters.set(platformKey, {
      factory: adapterFactory,
      hostnames: hostnames,
      key: platformKey
    });
  }

  /**
   * Detect the current platform based on URL hostname
   * @returns {string|null} Platform key or null if unsupported
   */
  detectPlatform() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    const fullUrl = window.location.href;

    console.log(`PlatformRouter: Detecting platform for ${hostname}`);

    // Iterate through registered adapters to find a match
    for (const [platformKey, adapterInfo] of this.adapters.entries()) {
      const { hostnames } = adapterInfo;

      // Check if current hostname matches any of the adapter's hostname patterns
      const isMatch = hostnames.some(pattern => {
        // Support wildcard matching
        if (pattern.includes('*')) {
          const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
          return regex.test(hostname);
        }
        // Support substring matching
        return hostname.includes(pattern);
      });

      if (isMatch) {
        console.log(`PlatformRouter: Matched platform - ${platformKey}`);
        return platformKey;
      }
    }

    console.log(`PlatformRouter: No matching platform found for ${hostname}`);
    return null;
  }

  /**
   * Get the appropriate platform adapter for the current page
   * @returns {object|null} Platform adapter instance or null
   */
  getAdapter() {
    // Return cached adapter if already determined
    if (this.currentAdapter) {
      return this.currentAdapter;
    }

    // Detect platform
    const platform = this.detectPlatform();
    if (!platform) {
      console.log('PlatformRouter: Unsupported platform');
      return null;
    }

    // Get adapter info
    const adapterInfo = this.adapters.get(platform);
    if (!adapterInfo) {
      console.warn(`PlatformRouter: No adapter registered for platform: ${platform}`);
      return null;
    }

    // Create adapter instance
    try {
      const adapter = adapterInfo.factory();

      if (!adapter) {
        console.warn(`PlatformRouter: Adapter factory returned null for ${platform}`);
        return null;
      }

      // Verify adapter compatibility (non-blocking)
      // Note: This check may fail if the page hasn't fully loaded yet
      // The main.js initialization will wait for the container to be available
      if (adapter.isCompatible && !adapter.isCompatible()) {
        console.log(`PlatformRouter: Adapter ${platform} compatibility check pending (page may still be loading)`);
        // Don't return null - let the initialization continue
        // The container wait logic in main.js will handle this properly
      }

      // Cache the adapter
      this.currentAdapter = adapter;
      this.currentPlatform = platform;

      console.log(`PlatformRouter: Successfully initialized ${adapter.getPlatformName()} adapter`);
      return adapter;

    } catch (error) {
      console.error(`PlatformRouter: Error creating adapter for ${platform}:`, error);
      return null;
    }
  }

  /**
   * Get the current platform key
   * @returns {string|null} Platform key or null
   */
  getCurrentPlatform() {
    return this.currentPlatform;
  }

  /**
   * Check if the current platform is supported
   * @returns {boolean} True if platform is supported
   */
  isSupported() {
    return this.detectPlatform() !== null;
  }

  /**
   * Get list of all supported platform keys
   * @returns {Array<string>} Array of platform keys
   */
  getSupportedPlatforms() {
    return Array.from(this.adapters.keys());
  }

  /**
   * Get information about all registered adapters
   * @returns {object} Adapter information
   */
  getAdapterInfo() {
    const info = {};
    this.adapters.forEach((adapterData, key) => {
      info[key] = {
        hostnames: adapterData.hostnames,
        key: adapterData.key
      };
    });
    return info;
  }

  /**
   * Reset the router (useful for testing or re-initialization)
   */
  reset() {
    this.currentAdapter = null;
    this.currentPlatform = null;
  }

  /**
   * Clear all registered adapters
   */
  clearAdapters() {
    this.adapters.clear();
    this.reset();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlatformRouter;
}
