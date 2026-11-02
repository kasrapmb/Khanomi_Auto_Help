# Architecture and financial model

## Target and evidence

Independent React implementation of the requested net-profit/order/cost UX.
The reference https://trueprofit.io/ returned HTTP 403. No original source,
source maps, authenticated workspace, live UI recording or pixel parity was
established. The requested REA instructions guide this evidence boundary; no
connected REA MCP output or Evidence IDs are claimed. Screenshots and browser
tests in this folder describe the local implementation only.

## Integer-cent ledger

`src/data.js` produces 180 deterministic fictional orders (three per day), with
both demo stores represented on every date. It also produces 120 daily store
advertising/operating cost records. Raw order fields include gross item amount,
discount, refund, shipping collected, COGS, carrier cost, transaction fees,
fulfillment and a separate pass-through tax amount.

`enrichOrders(expenses)` builds an immutable working ledger. Daily ad and base
operating costs are assigned to eligible orders sharing that date and store.
User expenses are assigned by their date and selected store, or all orders on
that date. Division uses integer quotient plus deterministic remainder cents;
allocation does not lose or invent fractions of a cent. Because every sample
date has both stores, valid user expenses always have eligible orders.

Revenue subtracts discounts and refunds and adds shipping collected. Tax stays
outside revenue/profit. Total costs sum all seven displayed categories. Net
profit is revenue minus total costs. Refunded rows retain recorded expenses;
no fee reversals or inventory recovery are assumed. The fee formula is an
explicit sample model, not a processor invoice reconstruction.

`aggregate` sums the enriched ledger. Aggregate margin is net profit divided
by revenue; average order value is revenue divided by order count. Revenue per
ad dollar is revenue divided by advertising costs, using the same selected
orders and allocations. Zero denominators return zero; order detail uses a
dash for margin when revenue is zero.

## Derived views

`App` owns date/store controls, expense records, current view, chart measure,
table search/status/sort/page, and selected order ID. Its pipeline is:

    raw orders + daily costs + saved expenses -> enriched cent ledger
      -> date/store selection -> aggregate -> KPI, chart, profit statement
                              -> product rollups -> order drill
                              -> table-only search/status -> sort -> page
                                                          -> complete CSV

Cost allocation happens before filtering. Changing store/period never reallocates
an all-store expense to fewer eligible orders. Product profit includes its
orders' allocated share of all costs. Selected order IDs resolve from the
current enriched ledger, so expense changes update detail values correctly.

Previous-period comparison is available only if the entire equally long prior
window fits within the sample's September 3–November 1 coverage. No missing
prior window is treated as zero. Relative date presets use the dataset end date.
Custom inverted ranges show an explicit warning and zero matching orders.

Search/status scope is limited to the order table and export; KPI scope remains
the selected date/store. The UI states this distinction. CSV includes all matching
rows, not only the visible page; monetary fields are exported as dollar decimals.
Rows reconcile revenue minus component costs to net profit. Quoted cells escape
quotes; formula-looking string cells are prefixed; numeric negative profit stays
numeric. Download object URLs are revoked after use.

## Expenses and persistence

Expense entry requires a nonblank name, positive amount up to $1,000,000,
a supported category/store and an existing sample date. Source loading validates
saved records and unique IDs; bad/unavailable JSON falls back to an empty list.
Only added expenses persist, in `trueprofit-study-expenses-v1`; no browser-to-browser
or tab synchronization, authentication or backend is implemented. Storage write
failure shows an explicit warning; in-memory changes can still be explored.
Deleting an expense uses a confirmation and recomputes the ledger.

The expense list shows full entered amounts, whereas filtered KPI totals show
only the selected store's allocated share. This is stated in the UI and README.

## UI and validation

Local SVG handles the daily profit/revenue/cost chart, derived sparkline and
cost donut. React renders text without raw HTML insertion. Native dialogs
contain focus and support Escape; initial focus is set after showModal. Table
headers expose aria-sort; small screens use internal table scrolling. Full
accessibility certification has not been performed.

The static build uses Vite, React and lucide-react with a pinned lockfile. No
external data calls, store credentials, remote fonts or original product assets
are used. The study mark is drawn independently in CSS.

Browser tests start and stop a production preview. Expected values are derived
in Python from raw orders/daily cost records without calling the application's
allocation or aggregate helpers. Tests check ordinary and refunded orders,
expense cent conservation and store isolation, CSV equations, view interactions,
mobile layout and persistence. All dates shown as human-readable labels use
Asia/Tehran; order ISO dates and sample end date remain explicit.
