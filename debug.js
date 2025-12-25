/**
 * Scrollback Debug Script
 * Paste this into the browser console to debug the extension
 */

(function() {
  console.log('=== Scrollback Debug Script ===');

  // Check if extension is loaded
  if (!window.__scrollback) {
    console.error('❌ Extension not loaded! window.__scrollback is not defined');
    return;
  }

  const sb = window.__scrollback;
  console.log('✅ Extension loaded');

  // Print current state
  console.log('\n--- Current State ---');
  console.log('Platform:', sb.adapter?.getPlatformName());
  console.log('Current URL:', location.href);

  if (sb.detector) {
    const messages = sb.detector.getAllMessages();
    console.log('Tracked messages:', messages.length);
    console.log('Messages:', messages);
  }

  if (sb.injector) {
    const stats = sb.injector.getStats();
    console.log('Stats:', stats);
  }

  // Test message detection
  console.log('\n--- Testing Message Detection ---');
  const selector = sb.adapter?.getMessageSelector();
  console.log('Message selector:', selector);

  const messageElements = document.querySelectorAll(selector);
  console.log('Found message elements in DOM:', messageElements.length);
  console.log('Message elements:', messageElements);

  // Check which are valid
  let validCount = 0;
  messageElements.forEach(el => {
    if (sb.adapter?.isValidMessage(el)) {
      validCount++;
      const role = sb.adapter?.getMessageRole(el);
      console.log('Valid message:', role, el);
    }
  });
  console.log('Valid messages:', validCount);

  // Test container
  console.log('\n--- Testing Container ---');
  const containerSelector = sb.adapter?.getContainerSelector();
  console.log('Container selector:', containerSelector);
  const container = document.querySelector(containerSelector);
  console.log('Container found:', !!container, container);

  // Set up URL change monitoring
  console.log('\n--- Setting up URL change monitor ---');
  let lastUrl = location.href;

  setInterval(() => {
    if (location.href !== lastUrl) {
      console.log('🔄 URL CHANGED!');
      console.log('  From:', lastUrl);
      console.log('  To:', location.href);
      lastUrl = location.href;

      // Check state after URL change
      setTimeout(() => {
        console.log('  Checking state after URL change...');
        console.log('  Tracked messages:', sb.detector?.getAllMessages().length);
        console.log('  DOM messages:', document.querySelectorAll(selector).length);
        console.log('  Stats:', sb.injector?.getStats());
      }, 1000);
    }
  }, 100);

  console.log('✅ Debug script running. Switch chats to see URL change detection.');

  // Add manual test functions
  window.__scrollbackDebug = {
    // Manual reinitialization
    reinit: () => {
      console.log('🔧 Manual reinitialization...');
      sb.injector?.clearAllAnchors();
      setTimeout(() => {
        sb.detector?.detectExistingMessages();
        console.log('✅ Reinitialization complete');
        console.log('Stats:', sb.injector?.getStats());
      }, 500);
    },

    // Get current stats
    stats: () => {
      const stats = sb.injector?.getStats();
      console.table(stats);
      return stats;
    },

    // Force detect messages
    detect: () => {
      console.log('🔍 Forcing message detection...');
      sb.detector?.detectExistingMessages();
      setTimeout(() => {
        console.log('Stats:', sb.injector?.getStats());
      }, 500);
    },

    // Clear and reinject
    clear: () => {
      console.log('🧹 Clearing all anchors...');
      sb.injector?.clearAllAnchors();
      console.log('Stats:', sb.injector?.getStats());
    }
  };

  console.log('\n--- Available Debug Commands ---');
  console.log('__scrollbackDebug.reinit() - Clear and reinitialize');
  console.log('__scrollbackDebug.stats() - Show current stats');
  console.log('__scrollbackDebug.detect() - Force message detection');
  console.log('__scrollbackDebug.clear() - Clear all anchors');

})();
