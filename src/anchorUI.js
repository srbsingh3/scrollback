/**
 * Anchor UI Module
 * Creates and manages a global sticky visual anchor indicator
 * with one line per message for navigation
 */

class AnchorUI {
  constructor(platformAdapter) {
    this.adapter = platformAdapter;
    this.globalContainer = null;
    this.linesContainer = null;
    this.tooltip = null; // Global tooltip element (portal)

    // Consolidated single Map for all anchor data (memory optimization)
    // anchorId -> { line, element, handler }
    this.anchors = new Map();

    // Throttling for tooltip hover events (prevents rapid reflows)
    this.lastTooltipTime = 0;
    this.tooltipThrottleMs = 16; // ~60fps max
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

    // Create global tooltip element (portal - outside scrollable container)
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'scrollback-anchor-tooltip';
    this.tooltip.setAttribute('role', 'tooltip');
    this.tooltip.setAttribute('aria-hidden', 'true');

    // Apply theme
    this.applyTheme();

    // Set up event delegation on lines container (6 listeners total instead of 6N)
    this.setupEventDelegation();

    // Inject into document
    document.body.appendChild(this.globalContainer);
    document.body.appendChild(this.tooltip);
  }

  /**
   * Set up event delegation for all line interactions
   * Uses capture phase for mouseenter/mouseleave to properly delegate
   */
  setupEventDelegation() {
    // Mouse events (capture phase for enter/leave delegation)
    this.linesContainer.addEventListener('mouseenter', this.handleLineMouseEnter.bind(this), true);
    this.linesContainer.addEventListener('mouseleave', this.handleLineMouseLeave.bind(this), true);

    // Focus events (capture phase)
    this.linesContainer.addEventListener('focus', this.handleLineFocus.bind(this), true);
    this.linesContainer.addEventListener('blur', this.handleLineBlur.bind(this), true);

    // Click and keyboard (bubble phase)
    this.linesContainer.addEventListener('click', this.handleLineClick.bind(this));
    this.linesContainer.addEventListener('keydown', this.handleLineKeydown.bind(this));
  }

  /**
   * Get anchor ID from a line element
   * @param {Element} target - Event target
   * @returns {string|null} Anchor ID or null
   */
  getAnchorIdFromTarget(target) {
    const line = target.closest('.scrollback-anchor-line');
    return line ? line.getAttribute('data-anchor-id') : null;
  }

  /**
   * Handle delegated mouseenter on lines
   */
  handleLineMouseEnter(e) {
    if (!e.target.classList.contains('scrollback-anchor-line')) return;

    // Throttle to prevent rapid reflows
    const now = Date.now();
    if (now - this.lastTooltipTime < this.tooltipThrottleMs) return;
    this.lastTooltipTime = now;

    const anchorId = this.getAnchorIdFromTarget(e.target);
    if (anchorId) this.showTooltip(e.target, anchorId);
  }

  /**
   * Handle delegated mouseleave on lines
   */
  handleLineMouseLeave(e) {
    if (!e.target.classList.contains('scrollback-anchor-line')) return;
    this.hideTooltip();
  }

  /**
   * Handle delegated focus on lines
   */
  handleLineFocus(e) {
    if (!e.target.classList.contains('scrollback-anchor-line')) return;
    const anchorId = this.getAnchorIdFromTarget(e.target);
    if (anchorId) this.showTooltip(e.target, anchorId);
  }

  /**
   * Handle delegated blur on lines
   */
  handleLineBlur(e) {
    if (!e.target.classList.contains('scrollback-anchor-line')) return;
    this.hideTooltip();
  }

  /**
   * Handle delegated click on lines
   */
  handleLineClick(e) {
    const anchorId = this.getAnchorIdFromTarget(e.target);
    if (!anchorId) return;

    const anchorData = this.anchors.get(anchorId);
    if (anchorData && anchorData.handler) {
      anchorData.handler(e);
    }
  }

  /**
   * Handle delegated keydown on lines
   */
  handleLineKeydown(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;

    const anchorId = this.getAnchorIdFromTarget(e.target);
    if (!anchorId) return;

    e.preventDefault();
    const anchorData = this.anchors.get(anchorId);
    if (anchorData && anchorData.handler) {
      anchorData.handler(e);
    }
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
    if (this.anchors.has(anchorId)) {
      return this.anchors.get(anchorId).line;
    }

    // Create line element
    const line = document.createElement('div');
    line.className = 'scrollback-anchor-line';
    line.setAttribute('data-anchor-id', anchorId);
    line.setAttribute('role', 'button');
    line.setAttribute('aria-label', 'Navigate to message');
    line.setAttribute('tabindex', '0');

    // Add to container
    this.linesContainer.appendChild(line);

    // Store consolidated reference (no per-line listeners needed - using delegation)
    this.anchors.set(anchorId, {
      line,
      element: messageElement,
      handler: clickHandler
    });

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
   * Show tooltip positioned next to the given line
   * Extracts text on-demand instead of storing (memory optimization)
   * @param {Element} line - Line element to position tooltip near
   * @param {string} anchorId - Anchor ID to get message element
   */
  showTooltip(line, anchorId) {
    if (!this.tooltip) return;

    const anchorData = this.anchors.get(anchorId);
    if (!anchorData || !anchorData.element) return;

    // Extract text on-demand (not pre-stored)
    const messageText = this.extractMessageText(anchorData.element);

    // Set content
    this.tooltip.textContent = messageText;

    // Get line position
    const lineRect = line.getBoundingClientRect();

    // Position tooltip to the left of the line, vertically centered
    const tooltipX = lineRect.left - 14; // 16px gap from line
    const tooltipY = lineRect.top + (lineRect.height / 2);

    // Apply positioning (right edge of tooltip at tooltipX)
    this.tooltip.style.right = `${window.innerWidth - tooltipX}px`;
    this.tooltip.style.top = `${tooltipY}px`;
    this.tooltip.style.transform = 'translateY(-50%)';

    // Apply theme class
    const theme = this.adapter.detectTheme();
    this.tooltip.classList.toggle('scrollback-tooltip-dark', theme === 'dark');
    this.tooltip.classList.toggle('scrollback-tooltip-light', theme === 'light');

    // Show tooltip
    this.tooltip.classList.add('scrollback-tooltip-visible');
    this.tooltip.setAttribute('aria-hidden', 'false');
  }

  /**
   * Hide the tooltip
   */
  hideTooltip() {
    if (!this.tooltip) return;

    this.tooltip.classList.remove('scrollback-tooltip-visible');
    this.tooltip.setAttribute('aria-hidden', 'true');
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
    const anchorData = this.anchors.get(anchorId);
    if (anchorData && anchorData.line && anchorData.line.parentNode) {
      anchorData.line.parentNode.removeChild(anchorData.line);
    }
    this.anchors.delete(anchorId);

    // Hide container if no lines left
    this.updateVisibility();
  }

  /**
   * Update visibility of global container based on message count
   */
  updateVisibility() {
    if (!this.globalContainer) return;

    // Hide if no messages, show otherwise
    if (this.anchors.size === 0) {
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
   * Get line element by anchor ID
   * @param {string} anchorId - Anchor ID
   * @returns {Element|null} Line element or null
   */
  getLineElement(anchorId) {
    const anchorData = this.anchors.get(anchorId);
    return anchorData ? anchorData.line : null;
  }

  /**
   * Check if line exists for anchor ID
   * @param {string} anchorId - Anchor ID
   * @returns {boolean} True if line exists
   */
  hasLine(anchorId) {
    return this.anchors.has(anchorId);
  }

  /**
   * Remove all lines and clear state
   */
  clear() {
    // Remove all line elements from DOM
    this.anchors.forEach((anchorData, anchorId) => {
      if (anchorData.line && anchorData.line.parentNode) {
        anchorData.line.parentNode.removeChild(anchorData.line);
      }
    });
    this.anchors.clear();

    // Remove global container
    if (this.globalContainer && this.globalContainer.parentNode) {
      this.globalContainer.parentNode.removeChild(this.globalContainer);
    }
    this.globalContainer = null;
    this.linesContainer = null;

    // Remove tooltip
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
    }
    this.tooltip = null;
  }

  /**
   * Get count of message lines
   * @returns {number} Number of lines
   */
  getLineCount() {
    return this.anchors.size;
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
