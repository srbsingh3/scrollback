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
    this.scrollToBottomTimeout = null; // For debouncing scroll
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
    console.log('[AnchorInjector] handleMessagesChanged:', event.type, '| messages:', event.messages.length);

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

    // Debounced scroll to bottom - waits for batch processing to complete
    this.scheduleScrollToBottom();
  }

  /**
   * Schedule a scroll to bottom with debouncing
   * Only fires once after all rapid additions are done
   */
  scheduleScrollToBottom() {
    if (this.scrollToBottomTimeout) {
      clearTimeout(this.scrollToBottomTimeout);
    }
    this.scrollToBottomTimeout = setTimeout(() => {
      if (this.anchorUI) {
        this.anchorUI.scrollToBottom();
      }
    }, 100); // Small delay to batch multiple rapid additions
  }

  /**
   * Inject anchor for a single message
   * @param {object} messageData - Message data object
   */
  injectAnchorForMessage(messageData) {
    const { element } = messageData;

    // Skip if anchor already injected for this message
    if (this.injectedAnchors.has(element)) {
      console.log('[AnchorInjector] Skipping - anchor already exists for this element');
      return;
    }

    try {
      // Check message role - only create lines for USER messages
      const messageRole = this.adapter.getMessageRole(element);
      console.log('[AnchorInjector] Message role:', messageRole);

      if (messageRole !== 'user') {
        // Skip non-user messages (assistant responses, system messages, etc.)
        console.log('[AnchorInjector] Skipping non-user message');
        return;
      }

      // Generate or get existing anchor ID
      const anchorId = this.anchorGenerator.getOrCreateAnchorId(element);
      console.log('[AnchorInjector] Generated anchor ID:', anchorId);

      // Add a line to the global anchor UI for this USER message
      this.anchorUI.addMessageLine(anchorId, element, () => {
        this.handleAnchorClick(anchorId, element);
      });

      // Store reference
      this.injectedAnchors.set(element, anchorId);

      console.log(`[AnchorInjector] ✅ Added line for user message (${this.injectedAnchors.size} total user messages)`);

    } catch (error) {
      console.warn('[AnchorInjector] ❌ Failed to inject anchor for message:', error);
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
    console.log('[AnchorInjector] 🧹 Clearing all anchors');
    console.log('[AnchorInjector] Previous anchor count:', this.injectedAnchors.size);

    // Remove all anchors from UI
    this.injectedAnchors.forEach((anchorId, element) => {
      this.anchorUI.removeAnchor(anchorId);
    });
    this.injectedAnchors.clear();

    // Clear message detector's tracked messages
    if (this.messageDetector) {
      console.log('[AnchorInjector] Clearing message detector');
      this.messageDetector.clearMessages();
    }

    // Clear anchor generator's cache
    if (this.anchorGenerator) {
      console.log('[AnchorInjector] Clearing anchor generator');
      this.anchorGenerator.clear();
    }

    console.log('[AnchorInjector] All anchors cleared');
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
    // Clear debounce timeout
    if (this.scrollToBottomTimeout) {
      clearTimeout(this.scrollToBottomTimeout);
      this.scrollToBottomTimeout = null;
    }

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
