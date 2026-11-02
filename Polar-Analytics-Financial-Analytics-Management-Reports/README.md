# Polar Analytics-inspired Financial Analytics & Executive Reports

Independent, original-source recreation of the **financial analytics and management reporting** experience publicly described by [Polar Analytics](https://www.polaranalytics.com/). This is **not** Polar's proprietary application, source code, financial data, brand identity, or official API.

## Implemented
- Responsive finance dashboard with six KPI cards
- Net revenue, contribution profit, modeled net profit, margin, ad spend, AOV
- Interactive period filters (7 / 30 / 90 / 365 days) and channel selector
- Revenue/profit time-series chart
- Reconciled financial profit bridge from gross sales to net profit
- Channel profitability table
- Executive highlights based on deterministic calculations
- Adjustable extra operating-cost scenario (0–20% of net sales)
- Export channel-level finance report to CSV
- Deterministic 365-day synthetic demo data, no external accounts

## Run
No dependencies or build step. Use a local HTTP server for ES modules:

```bash
git clone https://github.com/kasrapmb/Khanomi_Auto_Help.git
cd Khanomi_Auto_Help/Polar-Analytics-Financial-Analytics-Management-Reports
python3 -m http.server 8000
```

Open http://localhost:8000.

## Tests
Requires Node.js 20+:

```bash
npm test
```

## Model definitions
- Net revenue = gross sales − discounts − refunds
- Gross profit = net revenue − cost of goods
- Contribution profit = gross profit − shipping − payment fees − ad spend
- Modeled net profit = contribution profit − overhead − additional scenario costs
- Margin = net profit / net revenue
- AOV = net revenue / order count
- MER = net revenue / ad spend (computed by finance engine; not currently displayed)

These simplified figures are **not** audited accounting profit or Polar's official contribution-margin methodology. They exclude tax, payment timing, multi-currency consolidation and accounting reconciliation. Period-over-period comparisons use adjacent equal-length date ranges.

## Files
- `index.html` — entry point
- `styles.css` — responsive layout
- `src/app.js` — dashboard interactions, SVG charts, filters, CSV export
- `src/finance.js` — demo data and financial model
- `tests/finance.test.mjs` — financial reconciliation and behavior tests
- `REA_METHOD.md` — evidence and limitations

## Source references
- https://www.polaranalytics.com/features/custom-report
- https://www.polaranalytics.com/post/ecommerce-analytics-without-a-data-team-is-it-possible-in-2026
- https://www.polaranalytics.com/post/shopify-reports-explained-sales-inventory-and-pos-data-in-one-place
- https://github.com/zia62381-crypto/rea_codex/tree/main/REA_skills_Codex-main/REA-Skills/reverse-engineer-anything

## Verification
All source files have been committed to GitHub. Automated tests are supplied but a live browser execution was not completed in this session.
