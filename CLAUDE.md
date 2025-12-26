# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Scrollback** is a lightweight Chrome extension that adds visual anchor indicators to AI chat conversations (ChatGPT, Claude) for quick navigation through long threads. This is a privacy-first, content-script-only extension with zero data collection.

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

### Visual Anchor UI Design
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

### ⚠️ CRITICAL: ChatGPT Implementation is Production-Ready - DO NOT MODIFY
**The existing ChatGPT implementation is fully functional after 12+ hours of development and testing.**

**PROTECTED FILES - DO NOT MODIFY UNDER ANY CIRCUMSTANCES:**
- All existing code in `src/` (MessageDetector, AnchorUI, AnchorInjector, ScrollNavigator, etc.)
- All existing code in `platform-adapters/` (chatgpt.js or similar)
- All existing code in `content/` (main.js, styles.css, etc.)
- Any ChatGPT-specific selectors, DOM logic, styling, or helper functions

**When adding Claude.ai support:**
1. **Assume ChatGPT DOM is different from Claude DOM** - they likely require different approaches
2. **Create separate Claude-specific components** if the existing "shared" components don't work for Claude
   - Example: If `MessageDetector` is too ChatGPT-specific, create `ClaudeMessageDetector`
   - Example: If `AnchorUI` positioning doesn't work, create `ClaudeAnchorUI`
3. **Duplicate code rather than refactor** - code duplication is acceptable to protect working ChatGPT code
4. **Only modify `content/main.js`** if absolutely necessary to support both platforms (e.g., conditional component loading)
5. **Test changes in isolation** - ensure ChatGPT still works exactly as before

**Why this approach:**
The existing components (MessageDetector, AnchorUI, etc.) were built and tuned for ChatGPT's specific DOM structure. Claude.ai's DOM is likely completely different, requiring different detection logic, positioning, and styling. Rather than risk breaking the working ChatGPT implementation by trying to make components "truly platform-agnostic," create Claude-specific versions.

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
1. **DO NOT modify ANY existing code** - ChatGPT implementation is protected
2. Create Claude-specific components in new files (e.g., `src/claude/` directory)
3. Create new `claude.js` adapter
4. Duplicate components rather than refactoring shared code
5. Only modify `content/main.js` if absolutely required for platform routing
6. Test that ChatGPT still works exactly as before after any changes
