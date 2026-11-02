# Validation

Verified in the managed development environment with Node.js 24.19.0, npm
11.9.0, Python 3.12, Playwright 1.62.0, and installed Chromium.

## Reproducible installation and build

- `npm ci --ignore-scripts --no-audit --no-fund`: passed from the committed lockfile.
- `npm run build`: passed. Vite emitted the real production HTML, CSS and JS.
- Development startup on loopback port 5177: verified.

## Production browser suite

`python3 tests/browser_smoke.py`: **8 tests ran, 8 passed**.

1. Board drag/drop changes issue status and persists after reload.
2. Malformed JSON and invalid stored dates recover to valid demo data.
3. Creation, property/title editing, comments, favorites, persistence and confirmed deletion.
4. Command search, Enter to open, initial dialog focus, C to create and Escape to close.
5. Mobile navigation, detail rendering and no horizontal document overflow at 390px.
6. Assignee/project navigation, comment-derived Inbox and opening a conversation.
7. Text search, no-results state, combined property filters, priority sorting and group collapse.
8. Storage write failure shows an explicit unsaved warning while the UI remains usable.

Each test checks for uncaught JavaScript errors and unexpected third-party
runtime requests; none occurred. Tests run against a built Vite preview, in
isolated browser contexts; their server is stopped automatically.

Local screenshots: desktop.png, board.png, issue-detail.png, mobile.png.
They are local implementation captures, not screenshots of the live reference.

## Fixes found by validation

Explicit labels were added to creation controls. Enter in the command menu
now prevents the default action before opening another dialog. Modal input
focus is set after showModal, so keyboard creation starts in the title field.
Stored timestamps are validated before date formatting, and unsaved state is
shown truthfully when browser storage is unavailable.

## Unverified scope

The live reference request returned HTTP 403. Original Linear code, visual
parity, backend behavior and authenticated workflows were not inspected or
recovered. This is an independent, local-only implementation. No upstream
product tests, collaboration, production authentication or remote integration
are claimed.
