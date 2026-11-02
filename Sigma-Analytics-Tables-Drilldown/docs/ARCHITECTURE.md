# Architecture and evidence boundaries

## Identity

Independent React implementation of the requested analytics-table and drilldown
workflow. The reference site returned HTTP 403. Original Sigma code, bundles,
source maps, authenticated workflows and visual fidelity were not inspected.
The requested REA skill informs this distinction. No REA Evidence IDs, runtime
capture of Sigma or original-source recovery are claimed.

## One data pipeline

`src/data.js` generates 240 deterministic fictional order records. Each record
contains gross price, discount, revenue, cost, profit and margin as well as
customer, region, category, date and status.

`App` owns workbook controls, sort, visible columns, page, grouping, selection,
detail record and saved-view dialog state. Its derived pipeline is:

    generated orders -> filterRows -> sortRows -> page rows / grouped rows
                                -> summarize -> KPIs and charts
                                -> Explore grouping -> source-row drill
                                -> visible projection / selection -> CSV

All totals come from the full filtered dataset, not just the current page.
Gross margin is a weighted aggregate (sum profit / sum revenue). Order statuses
are descriptive; refund rows are not subtracted from recorded revenue. The UI
and README explain that explicitly. Relative date windows use the newest sample
date so the demo remains deterministic.

Table groups preserve all matching rows and can expand into source orders.
Explore independently chooses a grouping dimension and a sum/count measure.
Its drill updates the corresponding control, or searches the exact sample
customer name, and opens the source table. Customer drill from an order resets
other controls so it really shows all orders for that customer.

## Projection and CSV

Columns are controlled by their keys. At least one column remains visible. If
Order ID is hidden, a separate details action remains available. Sorting uses
numeric comparisons for numeric fields and textual comparisons for labels/dates.
ISO dates sort chronologically. Pagination operates after sorting.

CSV exports the full filtered/sorted set or the selected matching records, with
only visible data columns. Values are quoted and embedded quotes escaped; a BOM
supports common spreadsheet tools. Formula-looking string cells are prefixed
with an apostrophe. Numeric values stay numeric. Object URLs are revoked after
the download starts. No server receives exported data.

## Persistence and accessibility

A single named view saves filters, sort and visible keys under
`sigma-analytics-study-view-v1`. It does not save data edits, pagination, grouping
or multi-user state. Saved shapes and allowed values are checked before use.
Malformed/unavailable storage falls back to defaults. Save failures remain
visible inside the modal; unsaved settings are not reported as saved.

Native dialog provides focus containment; focus is set after showModal. Escape
and explicit buttons dismiss. Table headers use aria-sort. Form controls have
labels. Mobile tables scroll inside their container rather than widening the
whole document. Full accessibility compliance has not been audited.

## Delivery

Vite emits a static application into dist. The lockfile pins dependency
resolution. Charts are local SVG and DOM bars; icons use lucide-react. No remote
fonts, API keys, data sources, third-party runtime calls or Sigma assets are used.
The CSS mark is an independently drawn study mark.

Browser tests start/stop their own production preview and use isolated contexts.
Expected totals are calculated independently in Python from the raw source
records, rather than calling the app's summarization helpers. CSV downloads are
parsed and compared to active controls/selected IDs. Screenshots record this
local implementation only. Dates displayed in detail retain the ISO order date;
humanized dates use Asia/Tehran.
