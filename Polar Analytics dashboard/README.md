# Polar Analytics dashboard — independent financial demo

A self-contained, original financial and management dashboard inspired by the category of ecommerce analytics products. **This is not Polar Analytics source code or a verified visual replica.** The public target could not be inspected from this environment. See [investigation and limitations](docs/INVESTIGATION.md) for the observed access/tool constraints.

## Run

Requires Node.js 22+ and npm.

```sh
cd 'Polar Analytics dashboard'
npm ci
npm run dev
```

Open the local address printed by Vite. Build with `npm run build`, serve the build with `npm run preview`, and run the financial tests with `npm test`.

## Implemented

- Executive overview with revenue, net profit, profit margin, and order KPIs.
- Seven, fourteen, and thirty day filters; channel filters update every KPI, graph, table, and export.
- Revenue/profit chart with per-day SVG tooltips and daily aggregates.
- Cost distribution and searchable channel performance table.
- Profit and loss statement with reconciled subtotals and costs.
- Management reports and filtered CSV download.
- Responsive navigation and dashboard layouts.

## Data and calculations

All numbers are deterministic synthetic demo records for September 3 through November 1, 2026. There is no backend, authentication, store connection, or real customer information. The anchor date is fixed so the demonstration stays reproducible.

Net revenue is gross sales minus refunds. Net profit subtracts product costs, advertising, shipping, processing fees, and operating expenses from net revenue. Margin is net profit divided by net revenue. Previous-period comparisons use the immediately preceding equally sized window. The source of these original demo formulas and dataset is `src/finance.js`; tests cover reconciliation, period/channel filtering, aggregation, zero denominators, and CSV escaping.

## Architecture

React 18 renders the client-only workspace; Vite 6 provides development and production builds. `src/main.jsx` contains the page views and controls, `src/finance.js` the pure data functions, and `src/styles.css` responsive styling. Lucide provides open-source interface icons. No proprietary source, logos, screenshots, or brand assets are included. The sidebar wordmark is an original text/CSS treatment used to identify this study.

For production use, replace the demo dataset with authenticated API data, add server-side authorization and currency/timezone/accounting rules, and validate financial calculations against the actual ledger. Browser CSV exports contain only the selected synthetic records.
