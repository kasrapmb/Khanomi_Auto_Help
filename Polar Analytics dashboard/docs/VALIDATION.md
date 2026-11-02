# Validation

Validated on 2026-11-02 with Node 24.19.0 and Chromium against a local Vite production preview.

- `npm run build`: passed; production JS and CSS emitted.
- `node src/finance.test.js`: five tests passed, zero failures or skips. Tests reconcile net profit and costs, current/previous periods, channel selection, daily aggregation, empty inputs, and CSV quoting.
- Playwright browser smoke check: passed. Date filtering changes KPI values; selecting Meta Ads leaves one channel row; the profit chart switches; unmatched search shows an empty state; downloaded CSV contains exactly seven selected Meta Ads records; the P&L contains eleven lines; all three report cards render; mobile navigation works at 390 px without horizontal document overflow. No page errors were observed.

These checks validate this independent demo only. They do not validate parity with Polar Analytics or real financial integrations. Build outputs and installed dependencies are intentionally ignored by Git; reproduce them with `npm ci && npm run build`.
