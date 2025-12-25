/**
 * Scroll Navigator Module
 * Handles smooth scrolling to message anchors with visual feedback
 */

class ScrollNavigator {
  constructor(platformAdapter) {
    this.adapter = platformAdapter;
    this.isScrolling = false;
    this.lastScrollTarget = null;
  }

  /**
   * Scroll to a specific message element
   * @param {Element} messageElement - Target message element
   * @param {object} options - Scroll options
   */
  scrollToMessage(messageElement, options = {}) {
    if (!messageElement || !document.contains(messageElement)) {
      console.warn('ScrollNavigator: Invalid message element');
      return;
    }

    // Prevent multiple simultaneous scrolls
    if (this.isScrolling) {
      return;
    }

    this.isScrolling = true;
    this.lastScrollTarget = messageElement;

    // Calculate scroll position
    const scrollPosition = this.calculateScrollPosition(messageElement);

    // Add visual feedback before scrolling
    this.addScrollFeedback(messageElement);

    // Perform smooth scroll
    this.performScroll(scrollPosition, options)
      .then(() => {
        // Keep visual feedback for a moment
        setTimeout(() => {
          this.removeScrollFeedback(messageElement);
          this.isScrolling = false;
        }, 2000);
      })
      .catch((error) => {
        console.warn('ScrollNavigator: Scroll failed:', error);
        this.removeScrollFeedback(messageElement);
        this.isScrolling = false;
      });
  }

  /**
   * Calculate the scroll position for a message element
   * @param {Element} messageElement - Target message element
   * @returns {number} Scroll position in pixels
   */
  calculateScrollPosition(messageElement) {
    // Get element position
    const elementRect = messageElement.getBoundingClientRect();
    const scrollOffset = this.adapter.calculateScrollOffset();

    // Calculate absolute position from top of document
    const currentScrollY = window.scrollY || window.pageYOffset;
    const absoluteTop = elementRect.top + currentScrollY;

    // Target position with offset for fixed headers
    const targetPosition = absoluteTop - scrollOffset;

    return Math.max(0, targetPosition);
  }

  /**
   * Perform smooth scroll to target position
   * @param {number} targetPosition - Target scroll position
   * @param {object} options - Scroll options
   * @returns {Promise} Promise that resolves when scroll is complete
   */
  performScroll(targetPosition, options = {}) {
    return new Promise((resolve, reject) => {
      const behavior = options.behavior || 'smooth';
      const duration = options.duration || 500;

      if (behavior === 'smooth' && 'scrollTo' in window) {
        // Use native smooth scroll
        window.scrollTo({
          top: targetPosition,
          left: 0,
          behavior: 'smooth'
        });

        // Wait for scroll to complete
        // Native smooth scroll doesn't provide a completion callback
        setTimeout(resolve, duration);

      } else {
        // Fallback to instant scroll
        window.scrollTo(0, targetPosition);
        resolve();
      }
    });
  }

  /**
   * Add visual feedback to indicate scroll target
   * @param {Element} messageElement - Message element
   */
  addScrollFeedback(messageElement) {
    // Add a temporary highlight class
    messageElement.classList.add('scrollback-scroll-target');

    // Create a subtle pulse effect with CSS
    messageElement.style.transition = 'background-color 0.3s ease-in-out';
  }

  /**
   * Remove visual feedback from message element
   * @param {Element} messageElement - Message element
   */
  removeScrollFeedback(messageElement) {
    if (!messageElement) return;

    messageElement.classList.remove('scrollback-scroll-target');

    // Clean up inline styles after transition
    setTimeout(() => {
      if (messageElement) {
        messageElement.style.transition = '';
      }
    }, 300);
  }

  /**
   * Scroll to message by anchor ID
   * @param {string} anchorId - Anchor ID
   * @param {Function} getElementFn - Function to get element from anchor ID
   * @param {object} options - Scroll options
   */
  scrollToAnchor(anchorId, getElementFn, options = {}) {
    const messageElement = getElementFn(anchorId);

    if (messageElement) {
      this.scrollToMessage(messageElement, options);
    } else {
      console.warn('ScrollNavigator: Could not find message for anchor:', anchorId);
    }
  }

  /**
   * Get the last scroll target
   * @returns {Element|null} Last scrolled message element
   */
  getLastScrollTarget() {
    return this.lastScrollTarget;
  }

  /**
   * Check if currently scrolling
   * @returns {boolean} True if scroll is in progress
   */
  isCurrentlyScrolling() {
    return this.isScrolling;
  }

  /**
   * Cancel ongoing scroll (if possible)
   */
  cancelScroll() {
    if (this.lastScrollTarget) {
      this.removeScrollFeedback(this.lastScrollTarget);
    }
    this.isScrolling = false;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScrollNavigator;
}
