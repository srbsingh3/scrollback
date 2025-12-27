# Privacy Policy

**Scrollback – Navigate ChatGPT & Claude Conversations**

*Last updated: December 27, 2025*

## Overview

Scrollback is a browser extension that adds visual navigation anchors to AI chat conversations. This extension is designed with privacy as a core principle.

## Data Collection

**We do not collect any data.**

Specifically, Scrollback:

- Does **not** collect personal information
- Does **not** collect browsing history
- Does **not** read or store your chat messages
- Does **not** track your usage or behavior
- Does **not** use analytics or telemetry
- Does **not** use cookies or similar tracking technologies

## Data Storage

**We do not store any data.**

Scrollback:

- Does **not** use localStorage
- Does **not** use IndexedDB
- Does **not** use Chrome storage APIs
- Does **not** maintain any persistent state

All visual anchors are generated in-memory and reset when you refresh or close the page.

## Network Requests

**We make zero network requests.**

Scrollback operates entirely offline. It does not communicate with any servers, APIs, or external services. All functionality runs locally in your browser.

## Permissions

Scrollback requests only the minimum permissions necessary:

- **Host permissions** (`chatgpt.com`, `claude.ai`): Required to inject the navigation anchor UI into these specific chat platforms. The extension only runs on these sites and cannot access any other websites.

## How It Works

Scrollback is a content-script-only extension that:

1. Observes the chat interface DOM to detect messages
2. Injects small visual anchor indicators next to messages
3. Enables click-to-scroll navigation within conversations

The extension operates in a read-only manner—it never modifies, reads, or transmits your chat content.

## Third Parties

We do not share data with third parties because we do not collect any data.

## Open Source

Scrollback is open source. You can review the complete source code to verify these privacy claims.

## Changes to This Policy

If we make changes to this privacy policy, we will update the "Last updated" date above.

## Contact

If you have questions about this privacy policy, please open an issue on our GitHub repository.
