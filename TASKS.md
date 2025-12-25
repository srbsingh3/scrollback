# Implementation Tasks - Chat Anchor Extension

## Phase 0: Project Setup

### Setup Tasks
- [x] Initialize Chrome extension project structure
  - [x] Create `manifest.json` with minimal permissions (`activeTab`)
  - [x] Set up project directories (`src/`, `content/`, `platform-adapters/`)
  - [x] Configure build tools (if needed) or keep vanilla JS
  - [x] Create `.gitignore` for extension artifacts

### Documentation
- [ ] Create README.md with project overview
- [ ] Document extension architecture and file structure
- [ ] Add installation and development instructions

---

## Phase 1: Core Functionality (ChatGPT)

### 1.1 Message Detection
- [ ] Implement ChatGPT DOM message selector
  - [ ] Research and identify ChatGPT message container selectors
  - [ ] Create function to detect all visible messages in conversation
  - [ ] Handle user messages vs AI responses differently (if needed)
  - [ ] Test selector reliability across different conversation types

### 1.2 Anchor Generation System
- [ ] Design anchor ID generation strategy
  - [ ] Decide on ID format (hash-based, sequential, or hybrid)
  - [ ] Implement stable ID assignment for messages
  - [ ] Ensure IDs persist during streaming updates
  - [ ] Handle message edits and regenerations

### 1.3 Anchor UI Components
- [ ] Create Notion-style anchor visual component
  - [ ] Build HTML structure for anchor indicator (3-6 horizontal lines)
  - [ ] Implement CSS for thin horizontal lines design
  - [ ] Add positioning logic (right side of message blocks)
  - [ ] Implement theme adaptation (light/dark mode detection)

- [ ] Implement hover interaction
  - [ ] Add CSS transitions for fade-in/fade-out animation
  - [ ] Set opacity for default state (semi-transparent/hidden)
  - [ ] Set opacity for hover state (more visible)
  - [ ] Ensure smooth transitions (<100ms)

### 1.4 Anchor Injection
- [ ] Implement DOM injection for anchors
  - [ ] Create anchor elements dynamically
  - [ ] Position anchors relative to message containers
  - [ ] Ensure anchors don't interfere with text selection
  - [ ] Test that copy/paste is not affected
  - [ ] Verify no layout shifting occurs

### 1.5 Navigation & Scrolling
- [ ] Implement scroll-to-message functionality
  - [ ] Add click event listeners to anchors
  - [ ] Implement smooth scroll behavior
  - [ ] Calculate proper scroll offset (account for fixed headers)
  - [ ] Preserve scroll position during streaming updates
  - [ ] Add visual feedback when scrolling to target

### 1.6 Dynamic Content Handling
- [ ] Implement MutationObserver for DOM changes
  - [ ] Set up observer to watch conversation container
  - [ ] Handle new messages being added
  - [ ] Handle streaming message updates
  - [ ] Handle message deletions/edits
  - [ ] Optimize observer to avoid performance issues

- [ ] Test with edge cases
  - [ ] Lazy-loaded messages
  - [ ] Infinite scroll scenarios
  - [ ] Very long messages with code blocks
  - [ ] Messages with images and attachments

### 1.7 Content Script Integration
- [ ] Create content script entry point
  - [ ] Implement platform detection (check for ChatGPT domain)
  - [ ] Initialize extension only on supported platforms
  - [ ] Set up error handling and logging
  - [ ] Implement graceful degradation if DOM structure changes

---

## Phase 2: Multi-Platform Support

### 2.1 Platform Adapter Architecture
- [ ] Design platform adapter pattern
  - [ ] Create base adapter interface/class
  - [ ] Define required methods for each adapter
  - [ ] Implement platform detection logic

### 2.2 ChatGPT Adapter
- [ ] Extract ChatGPT-specific logic into adapter
  - [ ] Message selector strategy
  - [ ] Container identification
  - [ ] Scroll offset calculations
  - [ ] Theme detection for ChatGPT

### 2.3 Claude Adapter
- [ ] Research Claude (claude.ai) DOM structure
  - [ ] Identify message container selectors
  - [ ] Identify conversation container
  - [ ] Determine theme detection approach

- [ ] Implement Claude platform adapter
  - [ ] Message selector strategy
  - [ ] Container identification
  - [ ] Scroll offset calculations
  - [ ] Theme detection for Claude

### 2.4 Platform Router
- [ ] Create platform routing logic
  - [ ] Detect current platform by URL/hostname
  - [ ] Load appropriate adapter
  - [ ] Fall back gracefully if platform unsupported
  - [ ] Test switching between platforms

---

## Phase 3: Polish & Optimization

### 3.1 Visual Refinement
- [ ] Fine-tune Notion-style anchor design
  - [ ] Adjust line thickness and spacing
  - [ ] Refine opacity values for default/hover states
  - [ ] Test with both light and dark modes on both platforms
  - [ ] Ensure visual consistency across platforms

- [ ] Add accessibility improvements
  - [ ] Add ARIA labels to anchors
  - [ ] Ensure keyboard navigation works
  - [ ] Test with screen readers

### 3.2 Performance Optimization
- [ ] Profile extension performance
  - [ ] Measure hover interaction latency
  - [ ] Optimize MutationObserver callbacks
  - [ ] Minimize reflows and repaints
  - [ ] Test with very long conversations (100+ messages)

- [ ] Memory optimization
  - [ ] Clean up observers when not needed
  - [ ] Remove anchors for off-screen messages (if needed)
  - [ ] Test for memory leaks

### 3.3 Edge Case Handling
- [ ] Test and fix edge cases
  - [ ] Message regeneration (ChatGPT)
  - [ ] Message editing
  - [ ] Conversation branching (if applicable)
  - [ ] Code blocks with syntax highlighting
  - [ ] Messages with embedded images
  - [ ] Messages with tables or complex formatting
  - [ ] Very short messages
  - [ ] Very long messages (multi-screen)

### 3.4 Error Handling & Resilience
- [ ] Implement robust error handling
  - [ ] Graceful failure if selectors break
  - [ ] Console error suppression (no noise)
  - [ ] Automatic retry logic for failed anchor injection
  - [ ] Version compatibility checks

---

## Phase 4: Testing & Release

### 4.1 Testing
- [ ] Manual testing checklist
  - [ ] Test on fresh ChatGPT conversations
  - [ ] Test on existing long conversations
  - [ ] Test streaming responses
  - [ ] Test message regeneration
  - [ ] Test on fresh Claude conversations
  - [ ] Test on existing long conversations
  - [ ] Test both light and dark themes

- [ ] Browser compatibility
  - [ ] Test on Chrome
  - [ ] Test on Edge (Chromium)
  - [ ] Test on Brave (if applicable)

### 4.2 Documentation
- [ ] Update README with screenshots
- [ ] Create user guide for extension usage
- [ ] Document known limitations
- [ ] Add contribution guidelines

### 4.3 Packaging & Release
- [ ] Prepare extension for Chrome Web Store
  - [ ] Create extension icons (16x16, 48x48, 128x128)
  - [ ] Write store description
  - [ ] Prepare screenshots for store listing
  - [ ] Package extension as .zip

- [ ] Privacy & Security Review
  - [ ] Verify no network requests are made
  - [ ] Verify no data storage occurs
  - [ ] Verify no tracking or analytics
  - [ ] Review and finalize permissions

- [ ] Release
  - [ ] Submit to Chrome Web Store (optional)
  - [ ] Create GitHub releases with versioning
  - [ ] Tag initial release (v1.0.0)

---

## Future Enhancements (v2)

### Potential Features
- [ ] Keyboard shortcuts for navigation
  - [ ] Next/previous message shortcuts
  - [ ] Jump to top/bottom shortcuts

- [ ] Settings panel
  - [ ] Customize anchor appearance
  - [ ] Toggle anchor visibility
  - [ ] Choose anchor positioning (left/right)

- [ ] Additional platforms
  - [ ] Gemini (gemini.google.com)
  - [ ] Perplexity (perplexity.ai)
  - [ ] Poe (poe.com)

- [ ] Enhanced navigation
  - [ ] Visual indicator of current message
  - [ ] Mini-map or TOC panel
  - [ ] Anchor numbering option

---

## Notes

### Development Workflow
1. Complete Phase 0 and Phase 1 with ChatGPT support only
2. Test thoroughly on ChatGPT before moving to Phase 2
3. Add Claude support in Phase 2
4. Polish and optimize in Phase 3
5. Test and release in Phase 4

### Success Metrics
- Anchors appear for all messages consistently
- Hover latency < 100ms
- No visible flicker during streaming
- No console errors
- Zero performance impact on chat responsiveness

### Key Principles
- Privacy first: No tracking, no storage, no network requests
- Minimalist design: Blend seamlessly with platform UI
- Reliability: Graceful degradation if DOM changes
- Performance: No impact on chat responsiveness
