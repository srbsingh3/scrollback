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

    // Store observer config for reconnection after visibility change
    this.observerConfig = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-message-id'],
      characterData: false
    };
    this.isObserving = false;
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
    const contentHash = simpleHash(element.textContent?.substring(0, 100) || '');

    return `msg-${position}-${contentHash}`;
  }

  /**
   * Set up MutationObserver to watch for new messages
   * Includes visibility-aware pausing for resource optimization
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
    this.debouncedDetect = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.detectExistingMessages();
        this.cleanupRemovedMessages();
        this.updateStreamingMessages();
      }, 150); // 150ms to reduce callback frequency
    };

    this.observer = new MutationObserver(this.debouncedDetect);

    // Start observing
    this.startObserving(container);

    // Set up visibility-aware observer pausing (zero overhead when tab hidden)
    this.setupVisibilityHandler();
  }

  /**
   * Start observing the container
   * @param {Element} container - Container element to observe
   */
  startObserving(container) {
    if (!this.observer || !container) return;

    this.observer.observe(container, this.observerConfig);
    this.isObserving = true;
    MessageDetector.log('Observer started');
  }

  /**
   * Stop observing (disconnect observer)
   */
  stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.isObserving = false;
      MessageDetector.log('Observer paused');
    }
  }

  /**
   * Set up visibility change handler to pause/resume observer
   */
  setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Tab hidden - pause observer to save resources
        this.stopObserving();
      } else {
        // Tab visible - resume observing
        this.reconnectObserver();
      }
    });
  }

  /**
   * Reconnect observer after visibility restore
   */
  reconnectObserver() {
    const containerSelector = this.adapter.getContainerSelector();
    const container = document.querySelector(containerSelector);

    if (container && this.observer && !this.isObserving) {
      this.startObserving(container);
      // Re-detect in case messages changed while hidden
      this.detectExistingMessages();
      this.cleanupRemovedMessages();
    }
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
      this.stopObserving();
      this.reconnectObserver();
    }
  }

  /**
   * Destroy the message detector and clean up
   */
  destroy() {
    this.stopObserving();
    this.observer = null;
    this.messages.clear();
    this.onMessagesChanged = null;
    this.debouncedDetect = null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MessageDetector;
}
