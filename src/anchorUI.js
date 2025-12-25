/**
 * Anchor UI Module
 * Creates and manages a global sticky Notion-style anchor indicator
 * with one line per message for navigation
 */

class AnchorUI {
  constructor(platformAdapter) {
    this.adapter = platformAdapter;
    this.globalContainer = null;
    this.linesContainer = null;
    this.messageLines = new Map(); // anchorId -> line element
    this.messageElements = new Map(); // anchorId -> message element
    this.clickHandlers = new Map(); // anchorId -> handler function
  }

  /**
   * Initialize the global sticky anchor container
   */
  initialize() {
    if (this.globalContainer) {
      return; // Already initialized
    }

    // Create global sticky container
    this.globalContainer = document.createElement('div');
    this.globalContainer.className = 'scrollback-global-anchor';
    this.globalContainer.setAttribute('role', 'navigation');
    this.globalContainer.setAttribute('aria-label', 'Message navigation');

    // Create lines container
    this.linesContainer = document.createElement('div');
    this.linesContainer.className = 'scrollback-anchor-lines';

    this.globalContainer.appendChild(this.linesContainer);

    // Apply theme
    this.applyTheme();

    // Inject into document
    document.body.appendChild(this.globalContainer);
  }

  /**
   * Add a line for a new message
   * @param {string} anchorId - Unique anchor ID
   * @param {Element} messageElement - Message DOM element
   * @param {Function} clickHandler - Click handler for this line
   */
  addMessageLine(anchorId, messageElement, clickHandler) {
    // Ensure global container exists
    if (!this.globalContainer) {
      this.initialize();
    }

    // Check if line already exists
    if (this.messageLines.has(anchorId)) {
      return this.messageLines.get(anchorId);
    }

    // Create line element
    const line = document.createElement('div');
    line.className = 'scrollback-anchor-line';
    line.setAttribute('data-anchor-id', anchorId);
    line.setAttribute('role', 'button');
    line.setAttribute('aria-label', 'Navigate to message');
    line.setAttribute('tabindex', '0');

    // Create preview tooltip
    const preview = document.createElement('div');
    preview.className = 'scrollback-anchor-preview';

    // Extract message text content
    const messageText = this.extractMessageText(messageElement);
    preview.textContent = messageText;

    // Add preview to line
    line.appendChild(preview);

    // Add to container
    this.linesContainer.appendChild(line);

    // Store references
    this.messageLines.set(anchorId, line);
    this.messageElements.set(anchorId, messageElement);
    this.clickHandlers.set(anchorId, clickHandler);

    // Add click handler
    this.addClickHandler(line, clickHandler);

    // Update visibility to ensure container is shown
    this.updateVisibility();

    return line;
  }

  /**
   * Extract text content from message element
   * @param {Element} messageElement - Message DOM element
   * @returns {string} Extracted text content
   */
  extractMessageText(messageElement) {
    if (!messageElement) {
      return 'Message preview unavailable';
    }

    // Try to find text content in nested structure
    // Look for common text container patterns
    let textContainer = messageElement.querySelector('.whitespace-pre-wrap') ||
                       messageElement.querySelector('[data-message-author-role="user"]') ||
                       messageElement;

    // Get text content and clean it up
    let text = textContainer.textContent || textContainer.innerText || '';

    // Trim whitespace
    text = text.trim();

    // Truncate if too long (show first ~100 characters)
    if (text.length > 100) {
      text = text.substring(0, 100) + '...';
    }

    // Replace multiple whitespace/newlines with single space
    text = text.replace(/\s+/g, ' ');

    return text || 'Empty message';
  }

  /**
   * Scroll the anchor container to the bottom
   * (so the most recent messages' anchors are visible)
   */
  scrollToBottom() {
    if (this.globalContainer) {
      this.globalContainer.scrollTop = this.globalContainer.scrollHeight;
    }
  }

  /**
   * Remove a line for a deleted message
   * @param {string} anchorId - Anchor ID
   */
  removeMessageLine(anchorId) {
    const line = this.messageLines.get(anchorId);
    if (line && line.parentNode) {
      line.parentNode.removeChild(line);
    }
    this.messageLines.delete(anchorId);
    this.messageElements.delete(anchorId);
    this.clickHandlers.delete(anchorId);

    // Hide container if no lines left
    this.updateVisibility();
  }

  /**
   * Update visibility of global container based on message count
   */
  updateVisibility() {
    if (!this.globalContainer) return;

    // Hide if no messages, show otherwise
    if (this.messageLines.size === 0) {
      this.globalContainer.style.display = 'none';
    } else {
      this.globalContainer.style.display = 'flex';
    }
  }

  /**
   * Apply theme-aware styling
   */
  applyTheme() {
    if (!this.globalContainer) return;

    const theme = this.adapter.detectTheme();
    this.globalContainer.setAttribute('data-theme', theme);

    // Theme-specific classes
    if (theme === 'dark') {
      this.globalContainer.classList.add('scrollback-anchor-dark');
      this.globalContainer.classList.remove('scrollback-anchor-light');
    } else {
      this.globalContainer.classList.add('scrollback-anchor-light');
      this.globalContainer.classList.remove('scrollback-anchor-dark');
    }
  }

  /**
   * Update theme for the global container
   */
  updateTheme() {
    this.applyTheme();
  }

  /**
   * Add click handler to a line
   * @param {Element} line - Line element
   * @param {Function} handler - Click handler function
   */
  addClickHandler(line, handler) {
    line.addEventListener('click', handler);

    // Add keyboard support
    line.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handler(e);
      }
    });
  }

  /**
   * Get line element by anchor ID
   * @param {string} anchorId - Anchor ID
   * @returns {Element|null} Line element or null
   */
  getLineElement(anchorId) {
    return this.messageLines.get(anchorId) || null;
  }

  /**
   * Check if line exists for anchor ID
   * @param {string} anchorId - Anchor ID
   * @returns {boolean} True if line exists
   */
  hasLine(anchorId) {
    return this.messageLines.has(anchorId);
  }

  /**
   * Remove all lines and clear state
   */
  clear() {
    this.messageLines.forEach((line, anchorId) => {
      this.removeMessageLine(anchorId);
    });
    this.messageLines.clear();
    this.messageElements.clear();
    this.clickHandlers.clear();

    // Remove global container
    if (this.globalContainer && this.globalContainer.parentNode) {
      this.globalContainer.parentNode.removeChild(this.globalContainer);
    }
    this.globalContainer = null;
    this.linesContainer = null;
  }

  /**
   * Get count of message lines
   * @returns {number} Number of lines
   */
  getLineCount() {
    return this.messageLines.size;
  }

  /**
   * Legacy compatibility method (used by anchorInjector)
   * @deprecated Use addMessageLine instead
   */
  createAnchor(anchorId, messageElement) {
    // This is called by anchorInjector but we handle it differently now
    // Return a placeholder that won't be used
    return document.createElement('div');
  }

  /**
   * Legacy compatibility method (used by anchorInjector)
   * @deprecated No longer needed with global container
   */
  injectAnchor(anchor, messageElement) {
    // No-op - we use global container now
  }

  /**
   * Legacy compatibility method (used by anchorInjector)
   * @deprecated Use removeMessageLine instead
   */
  removeAnchor(anchorId) {
    this.removeMessageLine(anchorId);
  }

  /**
   * Legacy compatibility method (used by anchorInjector)
   * @deprecated Use getLineElement instead
   */
  getAnchorElement(anchorId) {
    return this.getLineElement(anchorId);
  }

  /**
   * Legacy compatibility method (used by anchorInjector)
   * @deprecated Use hasLine instead
   */
  hasAnchor(anchorId) {
    return this.hasLine(anchorId);
  }

  /**
   * Legacy compatibility method (used by anchorInjector)
   * @deprecated Use getLineCount instead
   */
  getAnchorCount() {
    return this.getLineCount();
  }

  /**
   * Legacy compatibility method (used by anchorInjector)
   * @deprecated Use updateTheme instead
   */
  updateAllAnchorsTheme() {
    this.updateTheme();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnchorUI;
}
