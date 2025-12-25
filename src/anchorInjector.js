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
    this.scrollNavigator = null;
    this.injectedAnchors = new Map(); // messageElement -> anchorId
  }

  /**
   * Initialize the anchor injector with required components
   * @param {MessageDetector} messageDetector - Message detection instance
   * @param {AnchorGenerator} anchorGenerator - Anchor ID generation instance
   * @param {AnchorUI} anchorUI - Anchor UI instance
   * @param {ScrollNavigator} scrollNavigator - Scroll navigation instance
   */
  initialize(messageDetector, anchorGenerator, anchorUI, scrollNavigator) {
    this.messageDetector = messageDetector;
    this.anchorGenerator = anchorGenerator;
    this.anchorUI = anchorUI;
    this.scrollNavigator = scrollNavigator;

    // Initialize the global anchor UI container
    this.anchorUI.initialize();

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
    } else if (event.type === 'updated') {
      this.handleStreamingUpdates(event.messages);
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
      // Check message role - only create lines for USER messages
      const messageRole = this.adapter.getMessageRole(element);

      if (messageRole !== 'user') {
        // Skip non-user messages (assistant responses, system messages, etc.)
        return;
      }

      // Generate or get existing anchor ID
      const anchorId = this.anchorGenerator.getOrCreateAnchorId(element);

      // Add a line to the global anchor UI for this USER message
      this.anchorUI.addMessageLine(anchorId, element, () => {
        this.handleAnchorClick(anchorId, element);
      });

      // Store reference
      this.injectedAnchors.set(element, anchorId);

      console.log(`AnchorInjector: Added line for user message (${this.injectedAnchors.size} total user messages)`);

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
   * Handle streaming updates for messages
   * Updates the anchor generator's content cache for streaming messages
   * @param {Array} messages - Array of updated message data objects
   */
  handleStreamingUpdates(messages) {
    messages.forEach(messageData => {
      const { element } = messageData;

      // Update content cache in anchor generator
      // This ensures the anchor ID remains stable even as content changes
      if (this.anchorGenerator.hasContentChanged(element)) {
        this.anchorGenerator.updateContentCache(element);
      }
    });
  }

  /**
   * Handle anchor click - scroll to the message
   * @param {string} anchorId - Clicked anchor ID
   * @param {Element} messageElement - Message element
   */
  handleAnchorClick(anchorId, messageElement) {
    console.log('Anchor clicked:', anchorId);

    // Visual feedback on anchor
    const anchor = this.anchorUI.getAnchorElement(anchorId);
    if (anchor) {
      anchor.style.transition = 'transform 0.1s ease-in-out';
      anchor.style.transform = 'scale(0.9)';
      setTimeout(() => {
        anchor.style.transform = 'scale(1)';
      }, 100);
    }

    // Scroll to message if ScrollNavigator is available
    if (this.scrollNavigator && messageElement) {
      this.scrollNavigator.scrollToMessage(messageElement, {
        behavior: 'smooth',
        duration: 500
      });
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
