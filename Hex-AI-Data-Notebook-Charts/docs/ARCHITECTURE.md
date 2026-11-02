# Architecture and evidence

## Scope

Independent React analytical notebook inspired by the requested Hex workflow.
The reference returned HTTP 403; no original source, live recording or visual
parity is claimed. The requested REA instructions inform this distinction. No
connected REA MCP output or original-source recovery was used.

The helper is visibly template-based. It is not a connected LLM. It classifies
supported keywords into monthly revenue, region revenue, category performance
or recent-order templates. A suggestion does not execute until requested. Its
response is constructed from the actual returned rows. Unsupported questions
receive the explicit capability boundary, not a generated factual answer.

## Immutable input and real SQL

`data.js` provides 240 deterministic fictional orders, eight declared columns,
SQL templates and saved-draft validation. Source amounts are integer cents.
Template queries aggregate in SQLite and divide by 100 to expose dollar columns.
Gross profit is revenue less recorded product cost, not fully loaded net profit.

`runner.js` starts a fresh module worker per execution. It owns a timeout and
AbortSignal listener; success/error/cancel/timeout terminates the worker and
cleans its timer/listener. An 8-second deadline includes initialization. React's
sequence guard ignores superseded responses and unmounted executions.

`query-worker.js` initializes SQL.js/WASM, creates the table, inserts the rows
inside a transaction, and enables PRAGMA query_only. SQLite itself parses the
statements; exactly one must exist and its leading command, after comments,
must be SELECT. No WITH/DDL/DML/PRAGMA command is accepted. This preserves SQL
string/comment handling without splitting on semicolons. Column aliases must
be unique. The region control is bound, not concatenated into SQL. The reader
returns at most 500 rows plus an explicit truncation flag. Prepared statements
and the DB are freed; the parent also terminates the worker.

The database is always rebuilt from the immutable local source; no write query
or shared database mutation is part of the workflow. SQLite/worker isolation
is a local demo boundary, not a hosted multi-tenant security service.

## Lineage and views

App owns draft SQL/note, parameter, mode, chart options, execution status, history
and last successful result. A result records the exact SQL, region, timestamp,
measured duration and run ID. Draft edits/parameter changes mark that output
stale without silently replacing it. SQL errors and cancellation retain the
last successful output and show the corresponding status. A valid new run
updates data and chooses valid axes atomically from its result columns.

    immutable orders -> worker SQLite SELECT -> returned rows/columns
      -> result table + derived totals + row-based chart
      -> helper's data response only for an explicitly run suggestion

App preview presents the same last-success output. Source Data is a separate
read-only preview of the raw input, with the current region control applied.
It is not confused with execution of the notebook draft.

`ui.jsx` applies search/sort/pagination only to the result table. CSV exports
all matching returned rows, not just the current page. Raw numeric SQL values
are exported; cents are only formatted for display. Cells are quoted/escaped,
and formula-looking strings are prefixed. `chart.jsx` plots at most the first
40 result rows; it does not secretly aggregate. Negative values use a zero
baseline. Numeric-free/zero-row results have an explicit empty state.

## Persistence and interaction

Only SQL draft, plain-text note, region and chart type persist in localStorage.
Malformed records fall back to defaults; write failures show an unsaved warning.
A restored draft is re-executed on load, not paired with a cached trusted result.
History stores at most eight session run metadata records; restoring one changes
the draft and requires an explicit run. Export is the study's own configuration
JSON, not a Hex-native file or import facility.

All text/errors are rendered as React text. No eval, Python execution, remote
warehouse, model request, credential or external data fetch is implemented. The
WASM and worker are built and served as same-origin assets. Sample dates are
May–October 2026; run clocks use Asia/Tehran.

Vite pre-optimizes SQL.js for worker development and emits an ES module worker.
The production bundle includes the WASM asset. Browser tests use actual compiled
assets and independent Python SQLite reference results. Full arbitrary SQL,
Python notebooks, real AI, collaboration and cloud publication remain outside
this study. Screenshots record only the local implementation.
