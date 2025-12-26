# Scrollback

A lightweight Chrome extension that adds visual anchor indicators to AI chat conversations (ChatGPT, Claude) for quick navigation through long threads.

## Features

- **Visual Anchor Navigation**: Subtle hover-activated anchor indicators on the right side of user messages
- **Quick Navigation**: Click anchors to smoothly scroll to any message in long conversations
- **Multi-Platform Support**: Works on both ChatGPT and Claude
- **Privacy-First**: Zero data collection, no network requests, no storage
- **Lightweight**: Content scripts only, no background workers

## Installation (Development)

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd scrollback
   ```

2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `scrollback` directory

3. Visit ChatGPT or Claude:
   - Go to https://chatgpt.com or https://claude.ai
   - Start a conversation
   - Hover over messages to see anchor indicators

## Project Structure

```
scrollback/
├── manifest.json              # Extension manifest (Manifest V3)
├── content/                   # Content scripts
│   ├── main.js               # Main entry point
│   └── styles.css            # Anchor styling
├── src/                       # Core logic modules
│   ├── anchorGenerator.js    # Anchor ID generation
│   ├── anchorUI.js           # Anchor UI components
│   ├── messageDetector.js    # Message detection logic
│   └── navigation.js         # Scroll-to-message functionality
├── platform-adapters/         # Platform-specific adapters
│   ├── baseAdapter.js        # Base adapter interface
│   ├── chatgptAdapter.js     # ChatGPT platform adapter
│   └── claudeAdapter.js      # Claude platform adapter
├── icons/                     # Extension icons
└── README.md                  # This file
```

## Architecture

### Content Scripts Only

Scrollback uses a content-script-only architecture with no background workers or backend infrastructure. This minimizes permissions and ensures privacy.

### Platform Adapter Pattern

The extension supports multiple AI chat platforms through a platform adapter pattern:

```javascript
// Base adapter interface
{
  getMessageSelector: () => string,        // CSS selector for messages
  getContainerSelector: () => string,      // Conversation container selector
  calculateScrollOffset: () => number,     // Fixed header offset
  detectTheme: () => 'light' | 'dark',    // Theme detection
  getAnchorPosition: () => object          // Anchor positioning hints
}
```

Each platform (ChatGPT, Claude) has its own adapter implementing this interface, allowing the core logic to work across platforms without modification.

### Message Detection

- Uses `MutationObserver` to watch for new messages and streaming updates
- Assigns stable anchor IDs to messages on first detection
- Handles message edits, regenerations, and deletions
- Debounced observer callbacks for performance

### Anchor Rendering

- Anchors are rendered as positioned overlay elements
- Hidden by default, fade in on hover (<100ms transition)
- Theme-aware (adapts to light/dark mode)
- Non-intrusive (no interference with text selection or copy/paste)

## Development Guidelines

### Privacy & Security

- **No network requests**: Extension runs entirely offline
- **No data storage**: No localStorage, IndexedDB, or chrome.storage
- **No tracking**: Zero analytics or user identification
- **Minimal permissions**: Only host permissions for ChatGPT and Claude

### Performance Requirements

- Hover interaction: <100ms latency
- No visible flicker during streaming updates
- Zero impact on chat responsiveness
- Debounced observer callbacks

### Code Style

- Vanilla JavaScript (no build tools required)
- ES6+ features (arrow functions, const/let, template literals)
- Clear comments for complex logic
- Modular architecture with single-responsibility files

## Testing

### Manual Testing Checklist

- [ ] **ChatGPT**: Fresh conversations vs. existing long threads
- [ ] **ChatGPT**: Streaming responses (partial message updates)
- [ ] **ChatGPT**: Message regeneration and editing
- [ ] **ChatGPT**: Both light and dark themes
- [ ] **ChatGPT**: Code blocks, images, tables in messages
- [ ] **ChatGPT**: Very short and very long messages
- [ ] **Claude**: Fresh conversations vs. existing long threads
- [ ] **Claude**: Streaming responses (partial message updates)
- [ ] **Claude**: Message regeneration and editing
- [ ] **Claude**: Both light and dark themes
- [ ] **Claude**: Code blocks, images, tables in messages
- [ ] **Claude**: Very short and very long messages
- [ ] **Both**: Chat navigation/switching between conversations
- [ ] **Both**: Browser refresh and page reload

### Browser Compatibility

- Chrome (primary target)
- Edge Chromium
- Brave

## Contributing

This is currently in active development. Contributions will be welcome once the initial implementation is complete.

## License

MIT License - see LICENSE file for details

## Project Status

**Phase 0**: Project Setup ✅ **COMPLETE**
**Phase 1**: Core Functionality (ChatGPT) ✅ **COMPLETE**
**Phase 2**: Multi-Platform Support (ChatGPT + Claude) ✅ **COMPLETE**
**Phase 3**: Polish & Optimization ✅ **COMPLETE**

**Current Phase**: Phase 4 - Testing & Release

See [TASKS.md](TASKS.md) for detailed implementation roadmap.

### Recent Achievements

- ✅ Full ChatGPT support with visual anchor indicators
- ✅ Full Claude.ai support with React hydration handling
- ✅ Platform adapter architecture for easy extensibility
- ✅ Automatic chat navigation detection
- ✅ Platform-specific theming (including Claude tooltip colors)
- ✅ Privacy-first implementation (zero data collection, no network requests)
