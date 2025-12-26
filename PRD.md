# PRD: Chat Anchor Extension

## Overview

A lightweight Chrome extension that adds visual anchor indicators to AI chat conversations, enabling quick navigation through long threads without modifying content or requiring backend infrastructure.

## Goals

- Enable fast navigation through long AI conversations
- Provide a native, unobtrusive UX that respects the platform's design
- Work reliably across multiple AI chat platforms (ChatGPT, Claude, etc.)
- Maintain strict privacy: no tracking, no storage, no external requests

## Non-Goals (v1)

- Bookmarking or persisting anchors across sessions
- Exporting or sharing conversation links
- Settings panel or customization UI
- Platform-specific branding or features

## Core Requirements

### Architecture
- **Single extension** supporting multiple platforms
- **Content scripts only** - no background workers, no backend
- **Minimal permissions** - only `activeTab` or equivalent
- **Zero data collection** - no analytics, no user tracking
- **No content modification** - read-only observation of DOM

### Functionality
- Detect individual chat messages in the conversation stream
- Assign stable, unique in-page anchors to each message
- Display subtle anchor handles beside messages (hover-only)
- Smooth scroll to target message on anchor click
- Handle streaming responses and dynamically added messages
- Preserve anchors when conversation updates

### UX & Design
- **Minimalist visual design** - thin horizontal lines for clean, unobtrusive navigation
- **Hover activation** - anchors invisible by default, appear on hover
- **Native integration** - blend with platform's existing design language
- **Non-intrusive** - no interference with text selection, copy/paste, or input
- **Graceful degradation** - fail silently if DOM structure changes

#### Visual Anchor Design
Clean, minimal anchor indicators for quick message navigation:
- **Visual Style**: Thin horizontal lines (similar to hamburger menu icon)
- **Positioning**: Anchors appear on the right side of messages/blocks
- **Appearance**: Subtle, semi-transparent lines that become more visible on hover
- **Spacing**: Multiple stacked horizontal lines (typically 3-6 short lines)
- **Color**: Adapts to platform theme (light gray for dark mode, dark gray for light mode)
- **Interaction**: Clicking the anchor smoothly scrolls to that message
- **Animation**: Smooth fade-in on hover, fade-out when mouse leaves

## Technical Constraints

### DOM Interaction
- Use semantic or `data-*` attribute selectors where possible
- Avoid brittle class name dependencies
- Implement MutationObserver for dynamic content tracking
- Support lazy-loaded messages and infinite scroll

### Navigation
- In-page scrolling only (no URL hash manipulation)
- Smooth scroll behavior with proper offset handling
- Preserve scroll position during streaming updates

### Code Organization
- Platform-agnostic core logic
- Lightweight platform-specific adapters for DOM differences
- Message detection and anchor assignment as pure functions

## Platform Support

### Target Platforms
- ChatGPT (chat.openai.com)
- Claude (claude.ai)

### Platform Adapter Pattern
Each platform provides:
- Message selector strategy
- Container identification
- Scroll offset calculations
- Visual integration hints (colors, spacing)

## Success Criteria

- Anchors appear consistently for all messages
- Hover interaction feels instant (<100ms)
- No visible flicker during streaming or updates
- Extension remains functional after platform UI updates
- Zero performance impact on chat responsiveness
- No console errors under normal operation

## Privacy & Security

- No network requests
- No localStorage or IndexedDB usage
- No message content inspection or storage
- No user identification or fingerprinting
- Open source for transparency

## Constraints & Trade-offs

### Accepted Trade-offs
- Anchors reset on page reload (no persistence)
- May require updates if platforms change DOM structure significantly
- No cross-device or cross-session functionality

### Out of Scope
- Mobile support
- Chat export features
- Integration with platform APIs
- Keyboard shortcuts (may be v2)
- Customization options (may be v2)

## Implementation Phases

### Phase 1: Core Functionality
- Message detection on ChatGPT
- Anchor generation and rendering
- Hover interaction
- Scroll-to-message navigation

### Phase 2: Multi-Platform
- Claude support via adapter pattern
- Platform detection and routing

### Phase 3: Polish
- Refined visual design
- Edge case handling (very long messages, code blocks, images)
- Performance optimization

## Open Questions

- Should anchors be numbered, hash-based, or icon-only?
- How to handle message edits or regenerations?
- Should there be a visual indicator of the "current" message?
