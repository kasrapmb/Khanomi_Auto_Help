# Local validation

Environment: Node.js 24.19.0, npm 11.9.0, Python 3.12, Playwright 1.62.0 and
installed Chromium.

- `npm ci --ignore-scripts --no-audit --no-fund`: passed from the final lockfile.
- Production Vite build: passed; emitted actual HTML/CSS/JS and local font assets.
- Development startup on loopback port 5200: verified.
- `python3 tests/browser_smoke.py`: **15 tests ran; 15 passed**.

## Browser coverage

1. Official local Sans/Mono font loading plus SHA-256 verification of both files.
2. Theme and active catalog entry persist after reload.
3. Command search, no results, Enter navigation and Escape.
4. Project creation/details, duplicate-name rejection, cancel and confirmed deletion.
5. Project environment filtering, search, no-results state and name sorting.
6. Native email validation and explicit local form submission feedback.
7. Switch, checkbox and radio preference state.
8. Tabs Arrow/End focus and panel content; settings demonstration.
9. Preview/Code selection and real clipboard contents.
10. Success/error live regions and manual toast dismissal.
11. Progress advancement/completion/reset and skeleton disappearance.
12. Token copying and live typography text/size/weight controls.
13. Keyboard-focus tooltip visibility and native select changes.
14. Mobile navigation, dark theme, modal focus and no document/modal overflow.
15. Corrupt preference recovery and explicit storage-write warning.

Each test gets a fresh browser context. Clipboard tests grant Chromium's clipboard
permissions, then read actual browser clipboard contents. The runner starts and
stops its own production preview. No uncaught JavaScript errors or unexpected
third-party runtime requests occurred.

## Visual evidence

Desktop 1512×1080 and mobile 390×844 captures: overview-light.png,
overview-dark.png, tokens.png, typography.png and mobile-dark.png.
These are screenshots of this implementation, not of the blocked reference site.

## Limits

No original Geist UI source recovery, live pixel-parity claim, backend deployment,
real email, telemetry or persistent project database is included. Fonts are
unmodified official packaged assets, independently verified against the saved
manifest. Full cross-browser/accessibility certification was not performed.
