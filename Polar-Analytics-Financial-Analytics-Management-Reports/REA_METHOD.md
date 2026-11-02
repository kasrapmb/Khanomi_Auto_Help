# REA Skill Investigation: Polar Analytics Financial Reporting — Stage 3 Revision

## Exact requested skill repository

https://github.com/zia62381-crypto/rea_codex/tree/main

The following checked-in instructions were reviewed through the connected GitHub repository:

- `REA_skills_Codex-main/REA-Skills/reverse-engineer-anything/SKILL.md`
- `REA_skills_Codex-main/REA-Skills/reverse-engineer-anything/references/javascript-applications.md`
- `REA_skills_Codex-main/REA-Skills/reverse-engineer-anything/references/runtime-observation.md`
- `REA_skills_Codex-main/REA-Skills/reverse-engineer-anything/references/connection-and-recovery.md`

The skill provides routing for static JavaScript/bundle inspection, browser capture and Evidence. **REA's MCP browser and static-analysis operations were not installed/registered in this live ChatGPT connection.** Reading a skill does not install the runtime or make proprietary Polar application source available. We did not claim to have reverse-engineered a private bundle.

## Publicly grounded UI scope

1. Polar Dashboards: metric and sparkline cards, charts, tables, global filters.
   https://support.polaranalytics.com/articles/2935697766-understanding-dashboards
2. Custom Tables & Charts: choosing metrics, dimensions, filters, date range, ranking and chart/table display.
   https://support.polaranalytics.com/articles/8011212834-understanding-custom-tables-charts
3. Custom Metrics: configurable business formula concepts.
   https://support.polaranalytics.com/articles/2460261789-understanding-custom-metrics
4. Export: CSV output from custom reports.
   https://support.polaranalytics.com/articles/2421837954-exporting-data-in-polar
5. Chart/card types in the product help center.
   https://support.polaranalytics.com/articles/9477148819-building-custom-dashboards-charts-cards

## Changes over the initial Stage 3 version

- Corrected the period-selection model to use distinct current/previous calendar windows regardless of selected channel.
- Implemented an actual custom report builder: metrics, channel/week/month grouping, table/chart switch and row limits.
- Separated a dedicated simplified P&L statement in the finance view from executive reporting.
- Added a data-derived net-sales sparkline, stronger KPI consistency, and reworked report filters.
- Updated CSV export to reflect current report breakdowns; strings resembling spreadsheet formulas are escaped without converting legitimate negative numeric amounts to text.
- Expanded tests for finance reconciliation, periods, custom costs, weekday groups and CSV.
- Replaced source files **in place** at the previous destination in `kasrapmb/Khanomi_Auto_Help`.

## Validation and remaining limits

All changed files are in GitHub. A local JavaScript model/UI smoke harness reported 12/12 passing checks. Nine Node.js automated test cases are included in the repository, but `npm test` itself and a real browser E2E check have not been run against the published tree in this session.

No internal Polar APIs, authenticated views, raw assets or proprietary attribution/financial algorithms were acquired. This remains an independent demonstration using synthetic data.
