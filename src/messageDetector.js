/**
 * Message Detection Module
 * Detects and tracks messages in AI chat conversations
 */

class MessageDetector {
  // Debug mode - controlled via window.__scrollback?.debug
  static get DEBUG() {
    return window.__scrollback?.debug === true;
  }

  static log(...args) {
    if (MessageDetector.DEBUG) console.log('[MessageDetector]', ...args);
  }

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
      MessageDetector.log('New messages detected:', newMessages.length);
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
      timestamp: Date.now(),
      lastContent: element.textContent?.trim() || '',
      lastUpdate: Date.now()
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
      console.warn('[MessageDetector] Could not find conversation container');
      return;
    }

    // Debounce function to avoid excessive callbacks
    // Use longer delay to reduce CPU usage during streaming
    let debounceTimer = null;
    const debouncedDetect = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.detectExistingMessages();
        this.cleanupRemovedMessages();
        this.updateStreamingMessages();
      }, 150); // 150ms to reduce callback frequency
    };

    this.observer = new MutationObserver(debouncedDetect);

    // Optimized observer config - removed characterData for better performance
    // Messages are detected via childList changes anyway
    this.observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-message-id'], // Only watch message ID changes
      characterData: false // Disabled - too expensive during streaming
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
   * Update streaming messages (messages whose content is being updated)
   * This handles cases where AI is typing a response
   */
  updateStreamingMessages() {
    const updatedMessages = [];

    this.messages.forEach((messageData, element) => {
      // Check if message content has changed significantly
      const currentText = element.textContent?.trim() || '';
      const previousText = messageData.lastContent || '';

      // Only notify if content has changed significantly (more than 10 characters)
      if (Math.abs(currentText.length - previousText.length) > 10) {
        messageData.lastContent = currentText;
        messageData.lastUpdate = Date.now();
        updatedMessages.push(messageData);
      }
    });

    // Notify about streaming updates if there are any
    if (updatedMessages.length > 0 && this.onMessagesChanged) {
      this.onMessagesChanged({
        type: 'updated',
        messages: updatedMessages
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
   * Clear all tracked messages and reset the observer
   * Useful when switching chats to reset state
   */
  clearMessages() {
    MessageDetector.log('Clearing tracked messages:', this.messages.size);
    this.messages.clear();

    // Disconnect and reconnect the observer to ensure it's watching the correct container
    if (this.observer) {
      this.observer.disconnect();
      this.setupObserver();
    }
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
