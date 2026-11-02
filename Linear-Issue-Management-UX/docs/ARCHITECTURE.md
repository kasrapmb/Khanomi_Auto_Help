# Architecture and evidence

## What this implementation is

An independently authored React single-page application inspired by the general
issue-management workflow requested for Linear. A GET to the reference domain
returned HTTP 403. No authenticated workspace, original JavaScript bundle,
source map, live screenshot, or REA browser capture was acquired. The layout,
colors, component structure, seed data and behavior here are implementation
choices. They are not observations of Linear internals or a pixel-parity claim.

The requested REA skill was read from the user's repository. Its evidence
boundaries are preserved: local browser tests establish behavior of this app,
not the remote product. REA MCP remains unavailable, so no REA execution or
Evidence identifier is claimed. No credentials or registration changes are needed
for this independent local workflow.

## Data flow

`src/data.js` provides 16 fictional issues and enumerated properties. On startup,
`loadIssues` reads a versioned localStorage key. It validates core fields,
statuses, dates, comment/activity shapes, and falls back to a fresh copy of the
seed if loading fails. Empty issue arrays are valid; deleting everything does
not silently resurrect the seed on refresh.

`App` owns the issue collection and transient view state. Views derive their
counts, project progress, search results and filtered groups from the same
collection. CRUD, status changes and board drops update that state; an effect
persists it. Storage failures show a visible warning and an unsaved indicator.
There is no backend or remote API. Origin-scoped browser storage is not shared
between ports, profiles, machines or users; simultaneous tabs are not synchronized.

`updateIssue` optionally appends a property-change activity event. Description
and title inputs save directly; comments append distinct records. Inbox projects
those comment records into a time-ordered conversation list. Favorites and
assignee-based views are derived filters. Initial chart-like bars are decorative,
not a historical analytics series.

## Components and interactions

- `App`: navigation, counters, text/property filtering, sorting, list grouping,
  board drag/drop, project cards, and persistence.
- `CreateIssue`: required nonblank title, property controls, and ID allocation.
- `IssueDetail`: editable properties/description/title, due date, comments,
  favorite toggle, and confirmed deletion.
- `CommandMenu`: title/ID search, Enter to open a match, and create shortcut.
- `Modal`: native HTML dialog, modal focus containment, Escape and close actions.
- `InboxView`: local conversations or an explicit empty state.

React renders text values without raw HTML injection. Icons come from
lucide-react; there are no copied Linear assets, remote fonts, API keys or
third-party runtime data requests. All application source is included.

## Local runtime and validation

Vite builds static assets from React. Production can serve `dist/` from any
static host. `npm run preview` is for local verification, not a production backend.
The lockfile fixes dependency resolution; use `npm ci` to reproduce it.

`tests/browser_smoke.py` starts an isolated production preview and uses installed
Chromium via Python Playwright. Tests exercise persistence, CRUD, filters,
board movement, project/inbox navigation, keyboard dialogs, mobile layout and
malformed-cache recovery. Each test gets a new browser context. The temporary
server is stopped at the end. Screenshots in this directory were captured from
the local app, not from linear.app.

Dates shown by the UI use Asia/Tehran; seed timestamps are fictional. The app has
no background scheduled work. Browser storage is convenient demo persistence,
not a database, backup system or authorization boundary.
