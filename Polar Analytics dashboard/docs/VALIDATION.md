# Validation

Validated on 2026-11-02 with Node 24.19.0 and Chromium against a local Vite production preview.

- `npm run build`: passed; production JS and CSS emitted.
- `node src/finance.test.js`: five tests passed, zero failures or skips. Tests reconcile net profit and costs, current/previous periods, channel selection, daily aggregation, empty inputs, and CSV quoting.
- Playwright browser smoke check: passed. Date filtering changes KPI values; selecting Meta Ads leaves one channel row; the profit chart switches; unmatched search shows an empty state; downloaded CSV contains exactly seven selected Meta Ads records; the P&L contains eleven lines; all three report cards render; mobile navigation works at 390 px without horizontal document overflow. No page errors were observed.

These checks validate this independent demo only. They do not validate parity with Polar Analytics or real financial integrations. Build outputs and installed dependencies are intentionally ignored by Git; reproduce them with `npm ci && npm run build`.

## Continuation after publication

- Production build passed with the report builder and goals/alerts modules.
- All 15 unit tests passed: five original financial tests, six reporting/storage/CSV tests and four goal/calendar/rule tests.
- Chromium smoke test passed: filters changed values, report grouping produced seven selected daily rows, save/rename/load/delete worked across reloads, custom CSV had seven rows plus header and total, editable goals persisted, threshold rules triggered correctly, corrupt localStorage recovered, and the 390 px mobile report view had no document overflow. No browser page errors occurred.
- The repeatable smoke test is `scripts/browser-smoke.cjs`; use `npm run test:browser` with a running local production preview and Chromium.
- REA static analysis completed on 91 extracted public inline scripts using an isolated Node 24.22.1. See `REA-SUMMARY.json` for scope and limitations. The marketing pages were fetched successfully; the separate public demo application origin remained blocked, so visual/private-dashboard parity remains unvalidated.
