/**
 * Anchor ID Generation Module
 * Generates and manages stable anchor IDs for chat messages
 */

class AnchorGenerator {
  constructor() {
    this.anchorMap = new Map(); // element -> anchor ID
    this.idMap = new Map();     // anchor ID -> element
    this.contentCache = new Map(); // element -> content hash for tracking changes
    this.sequenceCounter = 0;
  }

  /**
   * Generate or retrieve a stable anchor ID for a message element
   * @param {Element} element - Message DOM element
   * @returns {string} Stable anchor ID
   */
  getOrCreateAnchorId(element) {
    // Return existing ID if already generated
    if (this.anchorMap.has(element)) {
      return this.anchorMap.get(element);
    }

    // Generate new ID
    const anchorId = this.generateAnchorId(element);
    this.anchorMap.set(element, anchorId);
    this.idMap.set(anchorId, element);

    // Cache initial content hash
    const contentHash = this.hashContent(element);
    this.contentCache.set(element, contentHash);

    return anchorId;
  }

  /**
   * Generate a new anchor ID for an element
   * Uses hybrid approach: position + content hash + sequence
   * @param {Element} element - Message DOM element
   * @returns {string} Anchor ID
   */
  generateAnchorId(element) {
    // Get element position in parent
    const position = this.getElementPosition(element);

    // Get content-based hash for stability during streaming
    const contentHash = this.hashContent(element);

    // Use existing element ID if available
    const elementId = element.id || element.getAttribute('data-message-id');
    if (elementId) {
      return `anchor-${elementId}`;
    }

    // Increment sequence counter
    const sequence = this.sequenceCounter++;

    // Combine position, content hash, and sequence for uniqueness
    return `anchor-${position}-${contentHash}-${sequence}`;
  }

  /**
   * Get the position of an element relative to its siblings
   * @param {Element} element - DOM element
   * @returns {number} Position index
   */
  getElementPosition(element) {
    if (!element.parentNode) return 0;

    const siblings = Array.from(element.parentNode.children);
    return siblings.indexOf(element);
  }

  /**
   * Hash the content of an element for stable ID generation
   * Uses first 200 characters to balance stability and uniqueness
   * @param {Element} element - Message element
   * @returns {string} Content hash
   */
  hashContent(element) {
    const text = element.textContent?.trim().substring(0, 200) || '';
    return this.simpleHash(text);
  }

  /**
   * Simple hash function for generating stable IDs
   * @param {string} str - String to hash
   * @returns {string} Hash string (base36)
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if a message's content has changed (for streaming updates)
   * @param {Element} element - Message element
   * @returns {boolean} True if content has changed
   */
  hasContentChanged(element) {
    const oldHash = this.contentCache.get(element);
    if (!oldHash) return true;

    const newHash = this.hashContent(element);
    return oldHash !== newHash;
  }

  /**
   * Update the content cache for an element (during streaming)
   * The ID remains stable even as content changes
   * @param {Element} element - Message element
   */
  updateContentCache(element) {
    const newHash = this.hashContent(element);
    this.contentCache.set(element, newHash);
  }

  /**
   * Handle message regeneration by reassigning ID
   * @param {Element} oldElement - Old message element
   * @param {Element} newElement - New message element
   * @returns {string} Anchor ID (preserved from old element)
   */
  handleRegeneration(oldElement, newElement) {
    const anchorId = this.anchorMap.get(oldElement);

    if (anchorId) {
      // Transfer ID to new element
      this.anchorMap.delete(oldElement);
      this.contentCache.delete(oldElement);

      this.anchorMap.set(newElement, anchorId);
      this.idMap.set(anchorId, newElement);

      // Update content cache
      this.updateContentCache(newElement);

      return anchorId;
    }

    // Generate new ID if old element wasn't tracked
    return this.getOrCreateAnchorId(newElement);
  }

  /**
   * Remove an anchor ID when message is deleted
   * @param {Element} element - Message element
   */
  removeAnchor(element) {
    const anchorId = this.anchorMap.get(element);
    if (anchorId) {
      this.idMap.delete(anchorId);
    }
    this.anchorMap.delete(element);
    this.contentCache.delete(element);
  }

  /**
   * Get element by anchor ID
   * @param {string} anchorId - Anchor ID
   * @returns {Element|null} Message element or null
   */
  getElementByAnchorId(anchorId) {
    return this.idMap.get(anchorId) || null;
  }

  /**
   * Get anchor ID by element
   * @param {Element} element - Message element
   * @returns {string|null} Anchor ID or null
   */
  getAnchorIdByElement(element) {
    return this.anchorMap.get(element) || null;
  }

  /**
   * Get all active anchor IDs
   * @returns {Array<string>} Array of anchor IDs
   */
  getAllAnchorIds() {
    return Array.from(this.idMap.keys());
  }

  /**
   * Clear all anchors and reset state
   */
  clear() {
    this.anchorMap.clear();
    this.idMap.clear();
    this.contentCache.clear();
    this.sequenceCounter = 0;
  }

  /**
   * Get statistics about current anchors
   * @returns {object} Statistics
   */
  getStats() {
    return {
      totalAnchors: this.anchorMap.size,
      idMappings: this.idMap.size,
      cachedContents: this.contentCache.size,
      nextSequence: this.sequenceCounter
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnchorGenerator;
}
