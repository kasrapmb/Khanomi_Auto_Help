# Architecture and evidence

## Scope

Independent component-gallery implementation inspired by the requested Geist
reference. HTTPS GET of the reference returned 403, so original UI source, live
visual parity and authenticated behavior were not inspected. The requested REA
instructions inform this boundary; no connected REA MCP, browser capture of the
reference, or REA Evidence IDs are claimed.

Two official unmodified font binaries are the exception to independently authored
assets: Geist Sans and Geist Mono variable WOFF2 from geist@1.9.0. They are
self-hosted with the original SIL OFL, copyright, npm package integrity and
SHA-256 manifest. No full font-source repository or original Geist UI component
library is vendored. The unused Next.js font-loader dependency was removed;
plain @font-face serves local files from public/fonts.

## Structure

- App.jsx owns theme, current catalog entry, search state, session project data,
  project dialogs and a single notification. It also contains the tokens and
  typography explorer views.
- components.jsx exports Button, Modal, ExampleCard, Toast and Tooltip. Native
  dialog owns focus containment; initial focus is set after showModal.
- demos.jsx implements local states and browser controls for each demonstration.
  The table receives project state and CRUD callbacks from App.
- catalog.js defines 11 component entries, foundations, seed projects,
  illustrative usage snippets and preference validation.
- tokens.css is the palette/rhythm/radius source of truth. Theme changes update
  documentElement.dataset.theme and colorScheme; component styles share variables.

This is an application, not a packaged drop-in replacement for Vercel's private
component APIs. Snippets illustrate usage and may omit imports/supporting code;
the working implementation is in the source modules.

## State and browser behavior

Theme and active catalog entry persist in one origin-scoped localStorage record.
Malformed/unsupported preferences fall back to light/overview; write failure
shows a warning. Demo projects are deliberately session-only and reset on reload.
Native form constraints reject invalid project names/emails; duplicate project
names produce a visible error. Creation/deletion only changes local React state.
No real deployment, email, analytics collection or remote API is involved.

The command dialog filters catalog text; Enter prevents its default action before
opening a result, avoiding accidental activation in the next view. Escape and
explicit close buttons dismiss dialogs. Example Preview/Code tabs and project
content tabs maintain aria-selected, tabIndex and keyboard focus. Actual tooltip
visibility follows hover or focus-within. Table headers expose aria-sort.
Progress is controlled by explicit Advance/Reset; loading buttons use a cleaned-up
local timer. Toast timers are replaced/cleared with notice state.

Clipboard handlers await the real browser API and show success only after it
resolves. Failures instruct manual copying. Localhost or HTTPS is expected for
secure-context clipboard/UUID APIs. No credentials are required.

## Delivery and limits

Vite builds a static frontend. Assets, SVG icons and fonts are local; no automatic
third-party runtime requests are required. The Source navigation link is an
explicit outbound link to the user's repository. Static hosting should serve the
application and /fonts paths from the same root.

Responsive layout hides the decorative hero art on small screens and gives
wide tables/code their own scroll containers. Reduced-motion preferences disable
animation/transitions. These checks are not full accessibility certification.
All sample times, domains, uptime/latency figures, activities and status labels
are illustrative fixed data rather than telemetry.

Tests launch a production preview and isolated Chromium contexts. They validate
real clipboard content, native form behavior, table actions, local font loading,
font file hashes, keyboard controls, theme persistence and mobile overflow.
Screenshots record the local implementation only.
