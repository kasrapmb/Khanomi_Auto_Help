# Local validation

Toolchain: Node.js 24.19.0, npm 11.9.0, Python 3.12, Playwright 1.62.0 and
installed Chromium. SQL engine: sql.js 1.15.2 / SQLite WASM.

- `npm ci --ignore-scripts --no-audit --no-fund`: passed from the final lockfile.
- Development server on loopback 5210: real worker query succeeded with six rows.
- Production Vite build: passed, including real module-worker and WASM assets.
- Local production execution: initial query completed with six monthly rows.
- `python3 tests/browser_smoke.py`: **16 tests ran; 16 passed**.

## Browser scenarios

1. Initial monthly totals and rows match independent Python SQLite/raw-source totals.
2. Parameter changes mark output stale until explicitly executed.
3. Arbitrary SELECT changes result shape and picks valid chart axes.
4. Writes/multiple statements are rejected; next valid query sees the intact source.
5. Syntax failure retains the last good result and recovers on valid SQL.
6. Numeric sorting, paging, search and downloaded CSV across all matching rows.
7. Disclosed template helper generates a suggestion, then executes real SQL and derives its response.
8. Unsupported question does not invent an answer or modify SQL.
9. Note/draft persist; reload re-executes SQL; JSON configuration export is correct.
10. Chart axes/type and app preview retain explicit execution lineage.
11. Raw source schema and full filtered CSV agree with source data.
12. Row cap, unique aliases and semicolons inside SQL strings/comments.
13. An expensive worker query can be cancelled; a subsequent query succeeds.
14. Restoring run history does not silently execute it.
15. Mobile navigation/helper focus and no document overflow.
16. Malformed saved notebook recovery and explicit storage-write warning.

The runner starts/stops its own production preview and uses isolated contexts.
Expected queries are executed in independent Python sqlite3, not the JS query
helper. No uncaught JavaScript errors or unexpected third-party runtime requests
were observed across the suite. SQL errors intentionally returned to the UI are
expected test outcomes rather than uncaught runtime failures.

## Screenshots and limits

Desktop 1512×1080 and mobile 390×844: notebook.png, local-helper.png,
app-preview.png, source-data.png and mobile.png. These are local captures.

The reference returned HTTP 403. Original Hex code, visual parity, remote SQL,
Python, cloud publication, collaboration and real LLM capability were not
inspected or implemented. The local helper is labelled template-based, and the
actual SQL engine is independently licensed/provenanced in licenses/.
