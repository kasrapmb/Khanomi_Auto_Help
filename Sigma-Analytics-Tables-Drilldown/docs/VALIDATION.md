# Local validation

Toolchain: Node.js 24.19.0, npm 11.9.0, Python 3.12, Playwright 1.62.0 and
installed Chromium.

- `npm ci --ignore-scripts --no-audit --no-fund`: passed using the committed lockfile.
- `npm run build`: passed; real production HTML/CSS/JS emitted.
- Development startup on loopback port 5188: verified.
- `python3 tests/browser_smoke.py`: **10 tests ran; 10 passed** on the final build.

## Browser scenarios

1. Dataset revenue/profit/order totals, click-to-filter region, and zero results.
2. Combined category/status/date filters and average order value.
3. Numeric revenue sorting, pagination, and page-size changes.
4. Group aggregation/expansion and column visibility.
5. Record detail revenue minus cost equals profit; customer drill resets unrelated controls.
6. Downloaded CSV parsed for filtered rows, visible projection and selected IDs.
7. Named view restores filters, sort and column projection after reload.
8. Explore grouping/measure selection and drill into source orders.
9. Mobile navigation, command-search focus, modal dismissal and no page overflow.
10. Malformed saved-view recovery and explicit storage-write failure warning.

Expected calculations are derived in Python from the raw source rows, without
calling the application's aggregate helpers. Each scenario uses an isolated
browser context and checks for uncaught JavaScript errors and unexpected
third-party runtime requests. Neither was observed. The temporary test server
is stopped automatically.

## Visual evidence

`overview.png`, `order-detail.png`, `explore.png` and `mobile.png` were captured
from the finalized local app. Desktop viewport: 1512×1080; mobile: 390×844.
The table uses its own horizontal scroll container on small screens. These are
not screenshots of Sigma's live product.

## Unverified and excluded scope

The public reference returned HTTP 403. Live visual parity, original source,
authentication, warehouse connections, SQL execution and collaboration were
not inspected or recovered. No REA runtime Evidence or original Sigma code is
claimed. The product is an independent static frontend study over fictional data.
