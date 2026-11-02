# Triple Whale-inspired commerce analytics dashboard

Independent front-end recreation of a commerce analytics overview with KPI cards, sales/profit charts, channel performance and date filtering. **Not** the proprietary source code of Triple Whale; not affiliated with or endorsed by Triple Whale.

## Features
- Revenue, net profit, orders, margin, ROAS, and ad spend KPI cards
- Interactive sales vs previous-period chart and profit chart
- 7 / 30 / 90-day range filters
- Channel performance table
- Responsive layout and local deterministic **demo data** (no real store connection)

## Run
```bash
npm install
npm run dev
```
Open the Vite local URL shown in the terminal.

## Build
```bash
npm run build
```

## Source and scope
This is an original React/Vite implementation based on publicly described analytics dashboard concepts. Replace `src/data.js` with your own authorized API data to use real business figures. KPI definitions in this demo: profit = 38% of sales minus ad spend; margin = profit / sales; ROAS = sales / ad spend. These are illustrative simplified calculations, not Triple Whale's proprietary attribution methodology.

Requested reference: https://www.triplewhale.com/
Skills reference: https://github.com/kasrapmb/REA_skills_Codex (repository README inspected; full skills contents not verified).
