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
    console.log('ScrollNavigator: scrollToMessage called', messageElement);

    if (!messageElement || !document.contains(messageElement)) {
      console.warn('ScrollNavigator: Invalid message element');
      return;
    }

    // Reset scroll lock if it's been too long (safety valve)
    if (this.isScrolling && this.scrollStartTime && (Date.now() - this.scrollStartTime > 3000)) {
      console.log('ScrollNavigator: Resetting stale scroll lock');
      this.isScrolling = false;
    }

    // Prevent multiple simultaneous scrolls
    if (this.isScrolling) {
      console.log('ScrollNavigator: Already scrolling, skipping');
      return;
    }

    this.scrollStartTime = Date.now();

    this.isScrolling = true;
    this.lastScrollTarget = messageElement;

    // Calculate scroll position
    const scrollPosition = this.calculateScrollPosition(messageElement);
    console.log('ScrollNavigator: Calculated scroll position:', scrollPosition);

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
    const scrollContainer = this.adapter.getScrollContainer();
    const scrollOffset = this.adapter.calculateScrollOffset();

    const elementRect = messageElement.getBoundingClientRect();
    console.log('Element rect:', elementRect);
    console.log('Scroll offset:', scrollOffset);

    if (scrollContainer === window) {
      // Window scrolling
      const currentScrollY = window.scrollY || window.pageYOffset;
      const absoluteTop = elementRect.top + currentScrollY;
      console.log('Window scroll - currentScrollY:', currentScrollY, 'absoluteTop:', absoluteTop);
      return Math.max(0, absoluteTop - scrollOffset);
    } else {
      // Container scrolling
      const containerRect = scrollContainer.getBoundingClientRect();
      const currentScrollTop = scrollContainer.scrollTop;
      const relativeTop = elementRect.top - containerRect.top + currentScrollTop;
      console.log('Container scroll - containerRect:', containerRect, 'scrollTop:', currentScrollTop, 'relativeTop:', relativeTop);
      return Math.max(0, relativeTop - scrollOffset);
    }
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
      const scrollContainer = this.adapter.getScrollContainer();
      const duration = options.duration || 200; // Fixed snappy duration

      console.log('ScrollNavigator: performScroll to', targetPosition, 'using container:', scrollContainer);

      if (behavior === 'smooth' && 'scrollTo' in scrollContainer) {
        // Use native smooth scroll on the appropriate container
        scrollContainer.scrollTo({
          top: targetPosition,
          left: 0,
          behavior: 'smooth'
        });

        // Wait for scroll to complete
        setTimeout(resolve, duration);

      } else {
        // Fallback to instant scroll
        if (scrollContainer === window) {
          window.scrollTo(0, targetPosition);
        } else {
          scrollContainer.scrollTop = targetPosition;
        }
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
