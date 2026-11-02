# Polar Analytics — Financial Analytics & Executive Reporting (v2)

**Independent recreation of public Polar Analytics dashboard concepts.** All source in this folder is independently authored for an educational demonstration. This is NOT a copy of Polar's proprietary JavaScript or backend, and has no Polar affiliation or authenticated service access.

This revision **replaces the previous Stage 3 implementation in the same GitHub directory**, rather than creating a duplicate.

## What works

- **Financial Overview:** six KPI cards (net revenue, contribution profit, modeled net profit, margin, advertising expense and AOV), revenue mini-trend, interactive sales/net-profit time-series charts.
- **Executive Reports:** interactive custom table/chart builder with selectable metrics (gross sales, net sales, modeled profit, contribution, spend, orders, margin, AOV, COGS), grouping by channel/week/month, and top-row limits.
- **Profit & Loss:** itemized simplified P&L from gross revenue through discounts, refunds, cost of goods, fees, shipping, ad spend and overhead to modeled profit.
- **Global filters:** current 7/30/90/365-day periods and an optional marketing-channel filter. Prior-period comparisons use the immediately preceding period of equal calendar-day length.
- **Scenario analysis:** adjust incremental operating expense from 0 to 20 percent of net revenue; P&L, KPI cards and reports recalculate automatically.
- **Export:** download a CSV of currently selected financial groupings.
- **Executive highlights:** deterministic observations based on current financial totals, not AI-generated or causal claims.
- **Demo data:** 365 locally generated daily synthetic records; no server or credential integration.

## Run from the cloned repository

```bash
git clone https://github.com/kasrapmb/Khanomi_Auto_Help.git
cd Khanomi_Auto_Help/Polar-Analytics-Financial-Analytics-Management-Reports
python3 -m http.server 8000
```

Open **http://localhost:8000**. This is a static HTML/CSS/ES-module project and has no runtime npm dependencies.

## Automated tests

Node.js 20+:

```bash
npm test
```

The repository includes 9 Node tests in `tests/finance.test.mjs`. During authoring the revised finance functions and UI were also smoke-checked in JavaScript with 12 successful checks. Those checks are **not** a substitute for a full browser-based test or a confirmed `npm test` run on the committed tree.

## Financial formulas

```text
Net revenue = Gross sales - Discounts - Refunds
Gross profit = Net revenue - Cost of goods (COGS)
Contribution profit = Gross profit - Shipping - Payment fees - Advertising
Modeled net profit = Contribution profit - Overhead - Scenario additional costs
Profit margin = Modeled net profit / Net revenue
AOV = Net revenue / Order count
```

Financial model is simplified: no taxes, FX translation, cash timing, inventory accounting, reconciliation or attribution validation. Demo numbers are **not** business decisions or audited financial statements.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Static page entry |
| `styles.css` | Responsive dashboard and report builder |
| `src/app.js` | Navigation, KPI cards, charts, filters, scenario and CSV controls |
| `src/finance.js` | Synthetic data, chronological periods, aggregations and exports |
| `tests/finance.test.mjs` | Data, reconciliation, period, grouping, scenario and CSV tests |
| `REA_METHOD.md` | Skill evidence and investigative boundaries |
| `package.json` | npm test entry point |

## References

- [Polar — Understanding Dashboards](https://support.polaranalytics.com/articles/2935697766-understanding-dashboards)
- [Polar — Understanding Custom Tables & Charts](https://support.polaranalytics.com/articles/8011212834-understanding-custom-tables-charts)
- [Polar — Custom metrics](https://support.polaranalytics.com/articles/2460261789-understanding-custom-metrics)
- [Polar — Exporting data](https://support.polaranalytics.com/articles/2421837954-exporting-data-in-polar)
- [REA skill repository](https://github.com/zia62381-crypto/rea_codex/tree/main/REA_skills_Codex-main/REA-Skills/reverse-engineer-anything)

See `REA_METHOD.md` for exact claims and limitations.
