/**
 * Anchor Injector Module
 * Coordinates message detection, anchor generation, and UI injection
 */

class AnchorInjector {
  constructor(platformAdapter) {
    this.adapter = platformAdapter;
    this.messageDetector = null;
    this.anchorGenerator = null;
    this.anchorUI = null;
    this.injectedAnchors = new Map(); // messageElement -> anchorId
  }

  /**
   * Initialize the anchor injector with required components
   * @param {MessageDetector} messageDetector - Message detection instance
   * @param {AnchorGenerator} anchorGenerator - Anchor ID generation instance
   * @param {AnchorUI} anchorUI - Anchor UI instance
   */
  initialize(messageDetector, anchorGenerator, anchorUI) {
    this.messageDetector = messageDetector;
    this.anchorGenerator = anchorGenerator;
    this.anchorUI = anchorUI;

    // Set up message change listener
    this.messageDetector.initialize((event) => {
      this.handleMessagesChanged(event);
    });

    console.log('AnchorInjector initialized');
  }

  /**
   * Handle messages changed event from MessageDetector
   * @param {object} event - Change event with type and messages
   */
  handleMessagesChanged(event) {
    if (event.type === 'added') {
      this.injectAnchorsForMessages(event.messages);
    } else if (event.type === 'removed') {
      this.removeAnchorsForMessages(event.messages);
    }
  }

  /**
   * Inject anchors for a list of messages
   * @param {Array} messages - Array of message data objects
   */
  injectAnchorsForMessages(messages) {
    messages.forEach(messageData => {
      this.injectAnchorForMessage(messageData);
    });
  }

  /**
   * Inject anchor for a single message
   * @param {object} messageData - Message data object
   */
  injectAnchorForMessage(messageData) {
    const { element } = messageData;

    // Skip if anchor already injected for this message
    if (this.injectedAnchors.has(element)) {
      return;
    }

    try {
      // Generate or get existing anchor ID
      const anchorId = this.anchorGenerator.getOrCreateAnchorId(element);

      // Create anchor element
      const anchorElement = this.anchorUI.createAnchor(anchorId, element);

      // Inject anchor into DOM
      this.anchorUI.injectAnchor(anchorElement, element);

      // Store reference
      this.injectedAnchors.set(element, anchorId);

      // Add click handler for navigation (will be implemented in Task 1.5)
      this.anchorUI.addClickHandler(anchorElement, () => {
        this.handleAnchorClick(anchorId, element);
      });

    } catch (error) {
      console.warn('Failed to inject anchor for message:', error);
    }
  }

  /**
   * Remove anchors for deleted messages
   * @param {Array} messages - Array of message data objects
   */
  removeAnchorsForMessages(messages) {
    messages.forEach(messageData => {
      this.removeAnchorForMessage(messageData);
    });
  }

  /**
   * Remove anchor for a single message
   * @param {object} messageData - Message data object
   */
  removeAnchorForMessage(messageData) {
    const { element } = messageData;

    const anchorId = this.injectedAnchors.get(element);
    if (anchorId) {
      // Remove from UI
      this.anchorUI.removeAnchor(anchorId);

      // Remove from generator
      this.anchorGenerator.removeAnchor(element);

      // Remove from tracking
      this.injectedAnchors.delete(element);
    }
  }

  /**
   * Handle anchor click (placeholder for Task 1.5)
   * @param {string} anchorId - Clicked anchor ID
   * @param {Element} messageElement - Message element
   */
  handleAnchorClick(anchorId, messageElement) {
    // Placeholder for scroll functionality (Task 1.5)
    console.log('Anchor clicked:', anchorId);

    // Visual feedback
    const anchor = this.anchorUI.getAnchorElement(anchorId);
    if (anchor) {
      anchor.style.transition = 'transform 0.1s ease-in-out';
      anchor.style.transform = 'scale(0.9)';
      setTimeout(() => {
        anchor.style.transform = 'scale(1)';
      }, 100);
    }
  }

  /**
   * Re-inject all anchors (useful for theme changes or DOM updates)
   */
  reinjectAllAnchors() {
    const messages = this.messageDetector.getAllMessages();

    // Clear existing anchors
    this.clearAllAnchors();

    // Re-inject
    this.injectAnchorsForMessages(messages);
  }

  /**
   * Clear all injected anchors
   */
  clearAllAnchors() {
    this.injectedAnchors.forEach((anchorId, element) => {
      this.anchorUI.removeAnchor(anchorId);
    });
    this.injectedAnchors.clear();
  }

  /**
   * Get statistics about injected anchors
   * @returns {object} Statistics
   */
  getStats() {
    return {
      injectedAnchors: this.injectedAnchors.size,
      trackedMessages: this.messageDetector.getAllMessages().length,
      anchorUICount: this.anchorUI.getAnchorCount(),
      generatorStats: this.anchorGenerator.getStats()
    };
  }

  /**
   * Destroy the injector and clean up all resources
   */
  destroy() {
    this.clearAllAnchors();

    if (this.messageDetector) {
      this.messageDetector.destroy();
    }

    if (this.anchorUI) {
      this.anchorUI.clear();
    }

    if (this.anchorGenerator) {
      this.anchorGenerator.clear();
    }

    this.injectedAnchors.clear();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnchorInjector;
}
