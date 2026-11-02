# Local validation

Toolchain: Node.js 24.19.0, npm 11.9.0, Python 3.12, Playwright 1.62.0 and
installed Chromium.

- `npm ci --ignore-scripts --no-audit --no-fund`: passed from the lockfile.
- `npm run build`: passed; real production HTML/CSS/JS emitted.
- Development startup on loopback port 5199: verified.
- `python3 tests/browser_smoke.py`: **13 tests ran; 13 passed**.

## Tested behavior

1. Revenue minus every cost category equals net profit; statement and KPI agree.
2. Date/store controls and absence of a fabricated prior-period comparison.
3. Added expense decreases profit, persists after reload and reverses after confirmed deletion.
4. A $100.01 all-store expense allocates $66.67/$33.34 to its eligible stores, conserving every cent.
5. Store-specific expense does not change the other store's profit.
6. Table-scoped search/status, numeric profit sort, pagination and page size.
7. Refunded order retains costs, has zero revenue and shows a real loss.
8. Downloaded CSV contains all matching rows and each row's component costs reconcile to total/net profit.
9. Product-level profit and source-order drill.
10. Profit/revenue/cost chart measures use the corresponding real totals.
11. Custom date window and explicit invalid-range warning with zero matching data.
12. Mobile navigation, no page/modal overflow, dialog focus, Escape and command-search shortcut.
13. Corrupt expense storage recovery and explicit write-failure warning.

Expected amounts are derived in Python from raw order and daily-cost fixtures,
not by calling the application's allocation/aggregation helpers. Currency is
checked to the cent. Each scenario runs in an isolated context against a
production preview. The test runner starts and stops its own temporary server.
No uncaught JavaScript errors or unexpected third-party runtime requests were
observed across the suite.

## Visual captures

`overview.png`, `costs.png`, `products.png`, `order-profitability.png` and
`mobile.png` record the local app. Desktop viewport: 1512×1080; mobile: 390×844.
Initial 30-day sample: 90 orders, revenue $10,968.52, costs $8,151.83,
net profit $2,816.69. These are fictional demo values, not store results.

## Scope limits

The reference request returned HTTP 403. Live product parity, original code,
store connections, ad attribution, actual accounting, inventory recovery and
multi-user behavior were not inspected or recovered. This is an independently
authored model with documented assumptions. No REA runtime Evidence is claimed.
