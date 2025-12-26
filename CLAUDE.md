# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Scrollback** is a lightweight Chrome extension that adds Notion-style anchor indicators to AI chat conversations (ChatGPT, Claude) for quick navigation through long threads. This is a privacy-first, content-script-only extension with zero data collection.

## Core Architecture Principles

### Extension Architecture
- **Content scripts only** - No background workers, no backend infrastructure
- **Platform adapter pattern** - Single extension supporting multiple AI chat platforms through platform-specific adapters
- **Zero persistence** - No storage (localStorage, IndexedDB), no network requests
- **Read-only DOM observation** - Never modify chat content, only inject anchor UI elements

### Key Components (Planned)

1. **Platform Adapters** (`platform-adapters/`)
   - Base adapter interface defining required methods
   - Platform-specific implementations (ChatGPT, Claude)
   - Each adapter provides: message selector strategy, container identification, scroll offset calculations, theme detection

2. **Core Logic** (`src/`)
   - Message detection and tracking via MutationObserver
   - Anchor ID generation (stable, unique per message)
   - Anchor UI component rendering
   - Scroll-to-message navigation

3. **Content Scripts** (`content/`)
   - Platform detection and router
   - Initialization and lifecycle management
   - Event handling for hover/click interactions

## Design Requirements

### Notion-Style Anchor UI
- **Visual**: 3-6 thin horizontal lines (hamburger menu style)
- **Position**: Right side of messages
- **Behavior**: Hidden by default, fade-in on hover (<100ms)
- **Theme-aware**: Adapts to light/dark mode (gray tones)
- **Non-intrusive**: No interference with text selection or copy/paste

### DOM Interaction Strategy
- Use semantic or `data-*` selectors (avoid brittle class names)
- MutationObserver for dynamic content (streaming responses, new messages)
- Support lazy-loading and infinite scroll
- Graceful degradation if platform DOM structure changes

## Critical Constraints

### Privacy & Security (Non-Negotiable)
- **Minimal permissions**: Only `activeTab` or equivalent
- **No network requests** whatsoever
- **No data collection**: No analytics, tracking, or user identification
- **No storage**: Anchors reset on page reload
- **No content inspection**: Don't read or store message content

### Performance Requirements
- Hover interaction: <100ms latency
- No visible flicker during streaming updates
- Zero impact on chat responsiveness
- No console errors under normal operation

## Implementation Phases

Refer to `TASKS.md` for detailed task breakdown. High-level phases:

1. **Phase 1**: Core functionality on ChatGPT (message detection, anchor UI, scrolling)
2. **Phase 2**: Multi-platform support via adapter pattern (add Claude)
3. **Phase 3**: Polish, optimization, edge case handling
4. **Phase 4**: Testing, documentation, packaging

## Development Guidelines

### ⚠️ IMPORTANT: ChatGPT Code is Production-Ready
**DO NOT modify existing ChatGPT implementation code** (`chatgpt.js`, ChatGPT-specific selectors, or any working ChatGPT functionality) when implementing Claude AI support or other platform adapters. The ChatGPT implementation is finalized and fully functional. All new platform work should:
- Only add new adapter files (e.g., `claude.js`)
- Only modify shared/core logic if absolutely necessary and well-justified
- Follow the existing ChatGPT adapter as a reference pattern, but don't change it

### When Implementing Platform Adapters
Each adapter must implement:
```javascript
{
  getMessageSelector: () => string,        // CSS selector for message elements
  getContainerSelector: () => string,      // CSS selector for conversation container
  calculateScrollOffset: () => number,     // Fixed header offset for smooth scroll
  detectTheme: () => 'light' | 'dark',    // Current platform theme
  getAnchorPosition: () => object          // Positioning hints for anchors
}
```

### Message Detection Pattern
- Use MutationObserver on conversation container
- Assign stable IDs on first detection (persist during streaming)
- Handle message edits/regenerations by re-identifying messages
- Debounce observer callbacks to avoid performance issues

### Anchor Rendering Pattern
- Create anchor elements as siblings or absolute-positioned overlays
- Use CSS transforms for positioning (avoid layout shifts)
- Apply CSS transitions for smooth fade animations
- Remove anchors when messages are removed from DOM

## Testing Considerations

### Manual Testing Checklist
- Fresh conversations vs. existing long threads
- Streaming responses (partial message updates)
- Message regeneration and editing
- Both light and dark themes
- Code blocks, images, tables in messages
- Very short and very long messages

### Browser Targets
- Chrome (primary)
- Edge Chromium
- Brave (if applicable)

## Files to Reference

- **PRD.md**: Complete product requirements and design specifications
- **TASKS.md**: Detailed implementation task breakdown with checkboxes
- **LICENSE**: MIT License (open source project)

## Project Status

**Current Stage**: Phase 1 Complete ✅ - ChatGPT implementation is fully functional and production-ready.

**Next Steps**: Phase 2 - Add Claude AI platform support
1. Create new `claude.js` adapter following the ChatGPT pattern
2. **DO NOT modify existing ChatGPT code** - it's finalized
3. Test Claude adapter thoroughly in isolation
4. Ensure both platforms work independently without interference
