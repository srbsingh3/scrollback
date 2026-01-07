/**
 * Anchor UI Module
 * Creates and manages a global sticky visual anchor indicator
 * with one line per message for navigation
 */

class AnchorUI {
  constructor(platformAdapter, favoritesManager) {
    this.adapter = platformAdapter;
    this.favoritesManager = favoritesManager;
    this.globalContainer = null;
    this.linesContainer = null;
    this.tooltip = null; // Global tooltip element (portal)
    this.starIcon = null; // Global star icon element (portal)

    // Consolidated single Map for all anchor data (memory optimization)
    // anchorId -> { line, element, handler, isStarred }
    this.anchors = new Map();

    // Current anchor ID for which star is shown
    this.currentStarAnchorId = null;

    // Throttling for tooltip hover events (prevents rapid reflows)
    this.lastTooltipTime = 0;
    this.tooltipThrottleMs = 16; // ~60fps max

    // Flag to suppress tooltip after tab visibility change
    this.suppressTooltip = false;

    // Timeout for hiding tooltip (allows hover on tooltip/star)
    this.hideTooltipTimeout = null;
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

    // Add hover handlers to tooltip to keep it visible when hovering over it
    this.tooltip.addEventListener('mouseenter', () => {
      this.cancelHideTooltip();
    });
    this.tooltip.addEventListener('mouseleave', () => {
      this.scheduleHideTooltip();
    });

    // Create global star icon element (portal - outside scrollable container)
    this.starIcon = document.createElement('button');
    this.starIcon.className = 'scrollback-star-icon';
    this.starIcon.setAttribute('role', 'button');
    this.starIcon.setAttribute('aria-label', 'Toggle favorite');
    this.starIcon.setAttribute('aria-hidden', 'true');
    this.starIcon.setAttribute('tabindex', '-1'); // Not keyboard accessible when hidden
    this.starIcon.innerHTML = this.getStarIconSVG(false); // Hollow star by default

    // Handle star click
    this.starIcon.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent triggering line click
      this.handleStarClick();
    });

    // Handle star keyboard interaction
    this.starIcon.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        this.handleStarClick();
      }
    });

    // Add hover handlers to star to keep it visible when hovering over it
    this.starIcon.addEventListener('mouseenter', () => {
      this.cancelHideTooltip();
    });
    this.starIcon.addEventListener('mouseleave', () => {
      this.scheduleHideTooltip();
    });

    // Apply theme
    this.applyTheme();

    // Set up event delegation on lines container (6 listeners total instead of 6N)
    this.setupEventDelegation();

    // Set up visibility change listener to hide tooltip when tab is hidden
    this.setupVisibilityListener();

    // Inject into document
    document.body.appendChild(this.globalContainer);
    document.body.appendChild(this.tooltip);
    document.body.appendChild(this.starIcon);
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
   * Set up visibility change listener to hide tooltip when tab becomes hidden
   * Fixes issue where tooltip persists when switching tabs
   */
  setupVisibilityListener() {
    // Hide tooltip and suppress it when tab visibility changes
    document.addEventListener('visibilitychange', () => {
      this.hideTooltip();
      this.suppressTooltip = true;

      // Add ONE-TIME mousemove listener to clear suppression
      // Listener auto-removes after first mouse movement (zero performance impact during normal use)
      document.addEventListener('mousemove', () => {
        this.suppressTooltip = false;
      }, { once: true, passive: true });
    });
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
    // Schedule hide with delay to allow mouse to move to tooltip/star
    this.scheduleHideTooltip();
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
    // Don't trigger if clicking on star icon
    if (e.target.closest('.scrollback-star-icon')) {
      return;
    }

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

    // Check initial star state (async, don't block)
    this.checkStarState(anchorId).then(isStarred => {
      const anchorData = this.anchors.get(anchorId);
      if (anchorData) {
        anchorData.isStarred = isStarred;
      }
    });

    // Store consolidated reference (no per-line listeners needed - using delegation)
    this.anchors.set(anchorId, {
      line,
      element: messageElement,
      handler: clickHandler,
      isStarred: false // Will be updated async
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

    // Don't show tooltip if suppressed (e.g., after tab visibility change)
    if (this.suppressTooltip) return;

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

    // Cancel any pending hide
    this.cancelHideTooltip();

    // Show and position star icon between line and tooltip
    this.showStarIcon(line, anchorId);
  }

  /**
   * Schedule hiding the tooltip with a delay
   * Allows mouse to move to tooltip/star without hiding
   */
  scheduleHideTooltip() {
    // Clear any existing timeout
    this.cancelHideTooltip();

    // Schedule hide after short delay
    this.hideTooltipTimeout = setTimeout(() => {
      this.hideTooltip();
      this.hideTooltipTimeout = null;
    }, 150); // 150ms delay to allow mouse movement
  }

  /**
   * Cancel scheduled tooltip hide
   */
  cancelHideTooltip() {
    if (this.hideTooltipTimeout) {
      clearTimeout(this.hideTooltipTimeout);
      this.hideTooltipTimeout = null;
    }
  }

  /**
   * Hide the tooltip immediately
   */
  hideTooltip() {
    if (!this.tooltip) return;

    // Cancel any pending hide
    this.cancelHideTooltip();

    this.tooltip.classList.remove('scrollback-tooltip-visible');
    this.tooltip.setAttribute('aria-hidden', 'true');

    // Hide star icon
    this.hideStarIcon();
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

    // Remove star icon
    if (this.starIcon && this.starIcon.parentNode) {
      this.starIcon.parentNode.removeChild(this.starIcon);
    }
    this.starIcon = null;
    this.currentStarAnchorId = null;

    // Clear any pending hide timeout
    this.cancelHideTooltip();
  }

  /**
   * Get count of message lines
   * @returns {number} Number of lines
   */
  getLineCount() {
    return this.anchors.size;
  }

  /**
   * Get star icon SVG markup
   * @param {boolean} filled - Whether star should be filled
   * @returns {string} SVG markup
   */
  getStarIconSVG(filled) {
    if (filled) {
      // Filled star (smaller size)
      return '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    } else {
      // Hollow star (outline, smaller size)
      return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    }
  }

  /**
   * Show star icon positioned between line and tooltip
   * @param {Element} line - Line element
   * @param {string} anchorId - Anchor ID
   */
  async showStarIcon(line, anchorId) {
    if (!this.starIcon || !this.favoritesManager) return;

    this.currentStarAnchorId = anchorId;

    // Get star state (check storage)
    const anchorData = this.anchors.get(anchorId);
    let isStarred = false;

    if (anchorData && anchorData.isStarred !== undefined) {
      // Use cached value
      isStarred = anchorData.isStarred;
    } else {
      // Check storage
      isStarred = await this.favoritesManager.isCurrentChatStarred(anchorId);
      // Cache the value
      if (anchorData) {
        anchorData.isStarred = isStarred;
      }
    }

    // Update star icon visual state
    this.updateStarIconVisualState(isStarred);

    // Get line position
    const lineRect = line.getBoundingClientRect();
    const starY = lineRect.top + (lineRect.height / 2);

    // Initial positioning: position star to the right of tooltip (between tooltip and line)
    // Tooltip right edge is at lineRect.left - 14px
    // Star left edge should be at: lineRect.left - 14 + 4 = lineRect.left - 10 (4px gap)
    // Star right edge should be at: lineRect.left - 10 + 12 = lineRect.left + 2
    // Using right positioning: right = window.innerWidth - (lineRect.left + 2)
    const starRightEdge = lineRect.left - 14 + 4 + 12; // tooltip right + 4px gap + star width
    this.starIcon.style.right = `${window.innerWidth - starRightEdge}px`;
    this.starIcon.style.top = `${starY}px`;
    this.starIcon.style.transform = 'translateY(-50%)';

    // Apply theme class
    const theme = this.adapter.detectTheme();
    this.starIcon.classList.toggle('scrollback-star-dark', theme === 'dark');
    this.starIcon.classList.toggle('scrollback-star-light', theme === 'light');

    // Show star icon
    this.starIcon.classList.add('scrollback-star-visible');
    this.starIcon.setAttribute('aria-hidden', 'false');
    this.starIcon.setAttribute('tabindex', '0'); // Make keyboard accessible

    // Refine positioning after tooltip is rendered to get exact tooltip right edge
    // Wait a tick for tooltip to be rendered and measured
    requestAnimationFrame(() => {
      if (!this.tooltip || !this.starIcon) return;

      const tooltipRect = this.tooltip.getBoundingClientRect();

      // Position star to the right of tooltip's right edge with a gap
      // Gap of 4px between tooltip right edge and star left edge
      // Star left edge at: tooltipRect.right + 4
      // Star right edge at: tooltipRect.right + 4 + 12 = tooltipRect.right + 16
      // Using right positioning: right = window.innerWidth - (tooltipRect.right + 16)
      const starRightEdge = tooltipRect.right + 4 + 12; // 4px gap + 12px star width
      this.starIcon.style.right = `${window.innerWidth - starRightEdge}px`;
    });
  }

  /**
   * Hide star icon
   */
  hideStarIcon() {
    if (!this.starIcon) return;

    this.starIcon.classList.remove('scrollback-star-visible');
    this.starIcon.setAttribute('aria-hidden', 'true');
    this.starIcon.setAttribute('tabindex', '-1'); // Remove from keyboard navigation
    this.currentStarAnchorId = null;
  }

  /**
   * Update star icon visual state (filled/hollow)
   * @param {boolean} isStarred - Whether star should be filled
   */
  updateStarIconVisualState(isStarred) {
    if (!this.starIcon) return;

    this.starIcon.innerHTML = this.getStarIconSVG(isStarred);
    this.starIcon.classList.toggle('scrollback-star-filled', isStarred);
    this.starIcon.setAttribute('aria-label', isStarred ? 'Remove from favorites' : 'Add to favorites');
  }

  /**
   * Handle star icon click
   */
  async handleStarClick() {
    if (!this.currentStarAnchorId || !this.favoritesManager) return;

    const anchorId = this.currentStarAnchorId;
    const anchorData = this.anchors.get(anchorId);

    try {
      // Toggle star status
      const newStarredState = await this.favoritesManager.toggleCurrentChatStar(anchorId);

      // Update cached state
      if (anchorData) {
        anchorData.isStarred = newStarredState;
      }

      // Update visual state
      this.updateStarIconVisualState(newStarredState);
    } catch (error) {
      console.error('[AnchorUI] Error toggling star:', error);
    }
  }

  /**
   * Check star state for an anchor (async)
   * @param {string} anchorId - Anchor ID
   * @returns {Promise<boolean>} True if starred
   */
  async checkStarState(anchorId) {
    if (!this.favoritesManager) return false;

    try {
      return await this.favoritesManager.isCurrentChatStarred(anchorId);
    } catch (error) {
      console.warn('[AnchorUI] Error checking star state:', error);
      return false;
    }
  }

}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnchorUI;
}
