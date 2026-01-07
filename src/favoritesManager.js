/**
 * Favorites Manager Module
 * Handles storage and retrieval of starred/favorited anchors
 * Uses Chrome local storage with nested structure: platformId -> chatId -> [anchorIds]
 */

class FavoritesManager {
  constructor(platformAdapter) {
    this.adapter = platformAdapter;
    this.storageKey = 'scrollback_favorites';
  }

  /**
   * Get the platform identifier (e.g., "chatgpt", "claude")
   * @returns {string} Platform ID
   */
  getPlatformId() {
    return this.adapter.getAdapterId();
  }

  /**
   * Extract chat/document ID from current URL
   * Platform-specific extraction logic
   * @returns {string} Chat ID
   */
  getChatId() {
    const pathname = window.location.pathname;
    const platformName = this.adapter.getPlatformName().toLowerCase();

    // ChatGPT: URL pattern like /c/abc-123-def
    if (platformName === 'chatgpt') {
      const match = pathname.match(/\/c\/([^\/\?]+)/);
      if (match) {
        return match[1];
      }
    }

    // Claude: Extract from pathname (e.g., /chat/xyz-789)
    if (platformName === 'claude') {
      // Claude URLs might be /chat/xyz or similar
      const match = pathname.match(/\/chat\/([^\/\?]+)/);
      if (match) {
        return match[1];
      }
      // Fallback: use pathname segments
      const segments = pathname.split('/').filter(s => s);
      if (segments.length > 0) {
        return segments[segments.length - 1];
      }
    }

    // Fallback: use full pathname (without leading slash)
    return pathname.replace(/^\//, '') || 'default';
  }

  /**
   * Strip "anchor-" prefix from anchor ID
   * @param {string} anchorId - Full anchor ID (e.g., "anchor-123")
   * @returns {string} ID without prefix (e.g., "123")
   */
  stripAnchorPrefix(anchorId) {
    return anchorId.replace(/^anchor-/, '');
  }

  /**
   * Rebuild full anchor ID from stored ID
   * @param {string} storedId - Stored ID without prefix
   * @returns {string} Full anchor ID (e.g., "anchor-123")
   */
  rebuildAnchorId(storedId) {
    return `anchor-${storedId}`;
  }

  /**
   * Get all favorites from storage
   * @returns {Promise<object>} Favorites object with nested structure
   */
  async getAllFavorites() {
    try {
      if (!chrome || !chrome.storage || !chrome.storage.local) {
        console.warn('[FavoritesManager] chrome.storage.local is not available. Make sure "storage" permission is in manifest.json');
        return {};
      }
      const result = await chrome.storage.local.get(this.storageKey);
      return result[this.storageKey] || {};
    } catch (error) {
      console.warn('[FavoritesManager] Error reading favorites:', error);
      return {};
    }
  }

  /**
   * Get starred anchor IDs for a specific chat
   * @param {string} platformId - Platform identifier
   * @param {string} chatId - Chat/document ID
   * @returns {Promise<Array<string>>} Array of stored anchor IDs (without prefix)
   */
  async getStarredAnchors(platformId, chatId) {
    try {
      const favorites = await this.getAllFavorites();
      const platformFavorites = favorites[platformId] || {};
      return platformFavorites[chatId] || [];
    } catch (error) {
      console.warn('[FavoritesManager] Error reading starred anchors:', error);
      return [];
    }
  }

  /**
   * Check if an anchor is starred
   * @param {string} platformId - Platform identifier
   * @param {string} chatId - Chat/document ID
   * @param {string} anchorId - Full anchor ID (with "anchor-" prefix)
   * @returns {Promise<boolean>} True if anchor is starred
   */
  async isStarred(platformId, chatId, anchorId) {
    const storedId = this.stripAnchorPrefix(anchorId);
    const starredAnchors = await this.getStarredAnchors(platformId, chatId);
    return starredAnchors.includes(storedId);
  }

  /**
   * Toggle star status for an anchor
   * @param {string} platformId - Platform identifier
   * @param {string} chatId - Chat/document ID
   * @param {string} anchorId - Full anchor ID (with "anchor-" prefix)
   * @returns {Promise<boolean>} New star status (true if now starred)
   */
  async toggleStar(platformId, chatId, anchorId) {
    try {
      const storedId = this.stripAnchorPrefix(anchorId);
      const favorites = await this.getAllFavorites();

      // Initialize nested structure if needed
      if (!favorites[platformId]) {
        favorites[platformId] = {};
      }
      if (!favorites[platformId][chatId]) {
        favorites[platformId][chatId] = [];
      }

      const chatFavorites = favorites[platformId][chatId];
      const isCurrentlyStarred = chatFavorites.includes(storedId);

      let newFavorites;
      if (isCurrentlyStarred) {
        // Remove from favorites
        newFavorites = chatFavorites.filter(id => id !== storedId);
      } else {
        // Add to favorites
        newFavorites = [...chatFavorites, storedId];
      }

      // Update nested structure
      favorites[platformId][chatId] = newFavorites;

      // Save to storage
      if (!chrome || !chrome.storage || !chrome.storage.local) {
        console.warn('[FavoritesManager] chrome.storage.local is not available. Make sure "storage" permission is in manifest.json');
        throw new Error('Storage API not available');
      }
      await chrome.storage.local.set({
        [this.storageKey]: favorites
      });

      return !isCurrentlyStarred; // Return new status
    } catch (error) {
      console.error('[FavoritesManager] Error toggling star:', error);
      throw error;
    }
  }

  /**
   * Get starred anchors for current chat (convenience method)
   * @returns {Promise<Array<string>>} Array of stored anchor IDs (without prefix)
   */
  async getCurrentChatStarredAnchors() {
    const platformId = this.getPlatformId();
    const chatId = this.getChatId();
    return this.getStarredAnchors(platformId, chatId);
  }

  /**
   * Check if anchor is starred in current chat (convenience method)
   * @param {string} anchorId - Full anchor ID (with "anchor-" prefix)
   * @returns {Promise<boolean>} True if anchor is starred
   */
  async isCurrentChatStarred(anchorId) {
    const platformId = this.getPlatformId();
    const chatId = this.getChatId();
    return this.isStarred(platformId, chatId, anchorId);
  }

  /**
   * Toggle star for anchor in current chat (convenience method)
   * @param {string} anchorId - Full anchor ID (with "anchor-" prefix)
   * @returns {Promise<boolean>} New star status (true if now starred)
   */
  async toggleCurrentChatStar(anchorId) {
    const platformId = this.getPlatformId();
    const chatId = this.getChatId();
    return this.toggleStar(platformId, chatId, anchorId);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FavoritesManager;
}

