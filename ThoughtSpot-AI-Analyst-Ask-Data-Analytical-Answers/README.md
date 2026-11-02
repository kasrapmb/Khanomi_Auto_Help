# ThoughtSpot-inspired AI Analyst — Ask Data & Analytical Answers

A responsive, **independently written** recreation of the publicly visible *Spotter* conversational analytics experience from [ThoughtSpot](https://www.thoughtspot.com/).

**This is not a clone of ThoughtSpot's proprietary source code and is not affiliated with ThoughtSpot.** It does not contain proprietary algorithms, confidential assets, authentication or real ThoughtSpot business data.

## Features

- Conversational "ask your data" interface, with sample questions
- Deterministic natural-language parsing (English + selected Persian keywords)
- Questions about revenue, profit, order count, quantities
- Grouping by region, category, product, channel and time (month/year)
- Ranked top-N groups, year/region/product filters when mentioned in a question
- Interactive chart/table switch with SVG charts generated from aggregate results
- Explanation of calculations ("How this answer was calculated")
- Simple descriptive *why did revenue change?* month-over-month analysis; **not causal inference**
- CSV import, record counts and invalid-row reporting, CSV export
- Client-side saved answers using localStorage
- Responsive layout and clear demo/local processing labels

## Quick start (no npm dependencies)

The application is an ES-module frontend, so use a local web server instead of opening the HTML with a \`file://\` URL.

~~~bash
git clone https://github.com/zia62381-crypto/rea_codex.git
cd rea_codex/ThoughtSpot-AI-Analyst-Ask-Data-Analytical-Answers
python3 -m http.server 8000
~~~

Open **http://localhost:8000**.

If using VS Code, you can also use the Live Server extension.

## Run tests

Requires Node.js 20 or newer; no npm install needed:

~~~bash
npm test
~~~

## Example questions

- \`Total revenue by region\`
- \`Top 5 products by revenue\`
- \`Monthly sales trend\`
- \`Profit by category\`
- \`Orders by channel\`
- \`Why did revenue change?\`
- \`فروش بر اساس منطقه\`
- \`روند فروش ماهانه\`

Not every possible natural-language question is supported. The parser is explicitly limited to known metrics/dimensions; it does **not** use a language model or invoke external AI services.

## CSV schema

Minimum: columns \`date\` and \`revenue\` (or \`sales\`). Optional columns:
\`profit\`, \`orders\`, \`quantity\`, \`region\`, \`category\`, \`product\`, \`channel\`.

Dates must be parseable by the browser as JavaScript dates. Values for monetary and count fields must be numeric. Unsupported or invalid rows are skipped and counted. CSV supports quoted fields with embedded commas and double quotes.

~~~csv
date,region,category,product,channel,revenue,profit,orders,quantity
2026-01-02,West,Electronics,Headphones,Organic Search,450,120,3,5
2026-01-03,East,Furniture,Desk Chair,Paid Search,300,70,1,1
~~~

All computation occurs **in the current browser tab**. CSV files are not uploaded to any server. Saved answers are stored only in localStorage in that browser. The sample dataset is locally generated with fictional retail orders.

## Important calculation notes

- \`revenue\` and \`profit\`: SUM of the respective input values
- \`orders\`: SUM of input order counts (defaults to 1 per row if the column is missing)
- \`quantity\`: SUM of input quantities (defaults to 1 per row)
- grouped analysis: SUM(metric) by the selected dimension
- "why" analysis: comparison of latest two months, **not** evidence of why the change occurred
- chart data directly reflects computed aggregates, not fabricated narrative output

This is a functional learning/demo prototype, not an enterprise AI analyst: there is no semantic-model governance, LLM reasoning, cross-dataset joins, SQL execution, account security or API connector.

## Files

~~~text
ThoughtSpot-AI-Analyst-Ask-Data-Analytical-Answers/
├── index.html
├── styles.css
├── package.json
├── README.md
├── REA_METHOD.md
├── sample-retail.csv
├── src/
│   ├── app.js
│   └── analytics.js
└── tests/
    └── analytics.test.mjs
~~~

## Sources and methodology

Read [REA_METHOD.md](./REA_METHOD.md). Public references include:

- https://www.thoughtspot.com/blog/introducing-spotter-ai-analyst
- https://docs.thoughtspot.com/cloud/26.7.0.cl/spotter-getting-started
- https://www.thoughtspot.com/why-thoughtspot
- https://github.com/zia62381-crypto/rea_codex/tree/main/REA_skills_Codex-main/REA-Skills/reverse-engineer-anything

## Verification status

Files were written and GitHub commits checked, but a real-browser end-to-end run has not been completed in the connected environment.
