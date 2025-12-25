/**
 * Anchor UI Module
 * Creates and manages Notion-style anchor indicators for messages
 */

class AnchorUI {
  constructor(platformAdapter) {
    this.adapter = platformAdapter;
    this.anchors = new Map(); // anchor ID -> anchor element
  }

  /**
   * Create an anchor element for a message
   * @param {string} anchorId - Unique anchor ID
   * @param {Element} messageElement - Message DOM element
   * @returns {Element} Anchor element
   */
  createAnchor(anchorId, messageElement) {
    // Check if anchor already exists
    if (this.anchors.has(anchorId)) {
      return this.anchors.get(anchorId);
    }

    // Create anchor container
    const anchor = document.createElement('div');
    anchor.className = 'scrollback-anchor';
    anchor.setAttribute('data-anchor-id', anchorId);
    anchor.setAttribute('role', 'button');
    anchor.setAttribute('aria-label', 'Scroll to this message');
    anchor.setAttribute('tabindex', '0');

    // Create horizontal lines (Notion-style)
    const linesContainer = document.createElement('div');
    linesContainer.className = 'scrollback-anchor-lines';

    // Create 4 horizontal lines
    for (let i = 0; i < 4; i++) {
      const line = document.createElement('div');
      line.className = 'scrollback-anchor-line';
      linesContainer.appendChild(line);
    }

    anchor.appendChild(linesContainer);

    // Apply theme-aware styling
    this.applyTheme(anchor);

    // Store reference
    this.anchors.set(anchorId, anchor);

    return anchor;
  }

  /**
   * Apply theme-aware styling to an anchor
   * @param {Element} anchor - Anchor element
   */
  applyTheme(anchor) {
    const theme = this.adapter.detectTheme();
    anchor.setAttribute('data-theme', theme);

    // Theme-specific classes will be handled by CSS
    if (theme === 'dark') {
      anchor.classList.add('scrollback-anchor-dark');
      anchor.classList.remove('scrollback-anchor-light');
    } else {
      anchor.classList.add('scrollback-anchor-light');
      anchor.classList.remove('scrollback-anchor-dark');
    }
  }

  /**
   * Inject anchor into the DOM next to a message
   * @param {Element} anchor - Anchor element
   * @param {Element} messageElement - Message element
   */
  injectAnchor(anchor, messageElement) {
    // Ensure message element has relative positioning
    const computedStyle = window.getComputedStyle(messageElement);
    if (computedStyle.position === 'static') {
      messageElement.style.position = 'relative';
    }

    // Get positioning configuration from adapter
    const position = this.adapter.getAnchorPosition();

    // Set anchor position
    anchor.style.position = 'absolute';
    anchor.style[position.side] = `${position.offset}px`;
    anchor.style.top = `${position.topOffset}px`;

    // Append anchor to message element
    messageElement.appendChild(anchor);
  }

  /**
   * Remove an anchor from the DOM
   * @param {string} anchorId - Anchor ID
   */
  removeAnchor(anchorId) {
    const anchor = this.anchors.get(anchorId);
    if (anchor && anchor.parentNode) {
      anchor.parentNode.removeChild(anchor);
    }
    this.anchors.delete(anchorId);
  }

  /**
   * Update theme for all anchors (when theme changes)
   */
  updateAllAnchorsTheme() {
    this.anchors.forEach(anchor => {
      this.applyTheme(anchor);
    });
  }

  /**
   * Get anchor element by ID
   * @param {string} anchorId - Anchor ID
   * @returns {Element|null} Anchor element or null
   */
  getAnchorElement(anchorId) {
    return this.anchors.get(anchorId) || null;
  }

  /**
   * Check if anchor exists
   * @param {string} anchorId - Anchor ID
   * @returns {boolean} True if anchor exists
   */
  hasAnchor(anchorId) {
    return this.anchors.has(anchorId);
  }

  /**
   * Add click handler to an anchor
   * @param {Element} anchor - Anchor element
   * @param {Function} handler - Click handler function
   */
  addClickHandler(anchor, handler) {
    anchor.addEventListener('click', handler);

    // Add keyboard support
    anchor.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handler(e);
      }
    });
  }

  /**
   * Remove all anchors and clear state
   */
  clear() {
    this.anchors.forEach((anchor, anchorId) => {
      this.removeAnchor(anchorId);
    });
    this.anchors.clear();
  }

  /**
   * Get count of active anchors
   * @returns {number} Number of anchors
   */
  getAnchorCount() {
    return this.anchors.size;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnchorUI;
}
