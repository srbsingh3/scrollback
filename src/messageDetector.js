/**
 * Message Detection Module
 * Detects and tracks messages in AI chat conversations
 */

class MessageDetector {
  constructor(platformAdapter) {
    this.adapter = platformAdapter;
    this.messages = new Map(); // Map of element -> message data
    this.observer = null;
    this.onMessagesChanged = null; // Callback for when messages change
  }

  /**
   * Initialize the message detector
   * @param {Function} callback - Called when messages are added/updated/removed
   */
  initialize(callback) {
    this.onMessagesChanged = callback;
    this.detectExistingMessages();
    this.setupObserver();
  }

  /**
   * Detect all existing messages in the conversation
   */
  detectExistingMessages() {
    const selector = this.adapter.getMessageSelector();
    const elements = document.querySelectorAll(selector);

    const newMessages = [];
    elements.forEach(element => {
      if (this.adapter.isValidMessage(element) && !this.messages.has(element)) {
        const messageData = this.createMessageData(element);
        this.messages.set(element, messageData);
        newMessages.push(messageData);
      }
    });

    if (newMessages.length > 0 && this.onMessagesChanged) {
      this.onMessagesChanged({
        type: 'added',
        messages: newMessages
      });
    }
  }

  /**
   * Create message data object for an element
   * @param {Element} element - Message DOM element
   * @returns {object} Message data
   */
  createMessageData(element) {
    return {
      id: this.generateMessageId(element),
      element: element,
      role: this.adapter.getMessageRole(element),
      timestamp: Date.now()
    };
  }

  /**
   * Generate a stable ID for a message element
   * @param {Element} element - Message DOM element
   * @returns {string} Unique message ID
   */
  generateMessageId(element) {
    // Try to use existing ID if available
    if (element.id) {
      return `msg-${element.id}`;
    }

    // Generate hash based on element position and content
    const position = Array.from(element.parentNode?.children || []).indexOf(element);
    const contentHash = this.simpleHash(element.textContent?.substring(0, 100) || '');

    return `msg-${position}-${contentHash}`;
  }

  /**
   * Simple hash function for generating IDs
   * @param {string} str - String to hash
   * @returns {string} Hash string
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
   * Set up MutationObserver to watch for new messages
   */
  setupObserver() {
    const containerSelector = this.adapter.getContainerSelector();
    const container = document.querySelector(containerSelector);

    if (!container) {
      console.warn('Scrollback: Could not find conversation container');
      return;
    }

    // Debounce function to avoid excessive callbacks
    let debounceTimer = null;
    const debouncedDetect = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.detectExistingMessages();
        this.cleanupRemovedMessages();
      }, 100);
    };

    this.observer = new MutationObserver(debouncedDetect);

    this.observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
  }

  /**
   * Clean up messages that have been removed from DOM
   */
  cleanupRemovedMessages() {
    const removedMessages = [];

    this.messages.forEach((messageData, element) => {
      if (!document.contains(element)) {
        this.messages.delete(element);
        removedMessages.push(messageData);
      }
    });

    if (removedMessages.length > 0 && this.onMessagesChanged) {
      this.onMessagesChanged({
        type: 'removed',
        messages: removedMessages
      });
    }
  }

  /**
   * Get all currently tracked messages
   * @returns {Array} Array of message data objects
   */
  getAllMessages() {
    return Array.from(this.messages.values());
  }

  /**
   * Get message data by element
   * @param {Element} element - Message element
   * @returns {object|null} Message data or null
   */
  getMessageByElement(element) {
    return this.messages.get(element) || null;
  }

  /**
   * Destroy the message detector and clean up
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.messages.clear();
    this.onMessagesChanged = null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MessageDetector;
}
