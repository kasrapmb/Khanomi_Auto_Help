# Source map and evidence boundaries

## Target identity

Requested reference: https://play.grafana.org/ (live GET: HTTP 403 in this environment).
Available implementation: official Grafana OSS v13.3.0 at commit
`752e3462ff71a43a5c1fb62d00a482fa2dc0ee6a`. This does not identify the
version, private configuration, plugins, or data deployed by Grafana Play.

## How the dashboard works

1. `provisioning/datasources/testdata.yaml` registers Grafana's built-in synthetic
   data provider as `demo-testdata`. No external database is needed for charts.
2. `provisioning/dashboards/demo.yaml` imports `dashboards/overview.json`.
   JSON declares panel type, grid coordinates, field configuration, queries,
   variables, time range, and refresh interval; it is not the rendering engine.
3. The Go backend handles HTTP, provisioning, SQLite storage, and data queries.
   Start reading `source/pkg/server/`, `source/pkg/api/`,
   `source/pkg/services/provisioning/`, and `source/pkg/tsdb/grafana-testdata-datasource/`.
4. React/TypeScript dashboard composition lives in
   `source/public/app/features/dashboard-scene/scene/DashboardScene.tsx`.
   It imports scene time-range, query-runner, variable, and panel objects.
5. `source/public/app/plugins/panel/timeseries/TimeSeriesPanel.tsx` receives
   frames, time range, options, dimensions, and time-range change callbacks.
   It prepares graphable fields and composes tooltip, event, annotation,
   keyboard, and axis interactions. Follow its imports into
   `source/public/app/core/components/TimeSeries/` and `source/packages/grafana-ui/`.
6. Other panel renderers live in `source/public/app/plugins/panel/stat/`,
   `gauge/`, and `table/`. Their `module.tsx` files register plugins and options.
7. Theme tokens live in `source/packages/grafana-data/src/themes/createColors.ts`
   (`DarkColors`), `createTheme.ts`, and the related palette/spacing/type files.
   Shared React components obtain the active theme through hooks such as
   `useTheme2` and styles through Grafana's Emotion-based styling system.
8. The TestData frontend editor lives in
   `source/public/app/plugins/datasource/grafana-testdata-datasource/`.
   `scenarioId` selects random-walk or CSV behavior. Our selector changes query
   aliases; it does not filter a real production database.

## What was copied and what was authored

- `source/`: complete unmodified Git archive of the pinned upstream release,
  including official example dashboards in `source/devenv/dev-dashboards/`.
- Outside `source/`: newly authored Compose/provisioning, one study dashboard,
  smoke test, documentation, and provenance metadata.
- Running instance: official prebuilt image of the matching release, pinned by
  registry digest. This is runtime validation, not a local source build.

## Checks and limitations

Run `python3 scripts/smoke.py` after `docker compose up -d --wait`.
It checks database/version health, dashboard provisioning and panel types,
variable/refresh/cursor settings, default datasource, real random-walk queries
for two time windows, CSV table output, and frontend HTML delivery.

The HTTP checks alone do not establish pixel fidelity or browser gesture behavior.
The optional `scripts/browser_smoke.py` was also executed with Chromium: it
verified the dark theme, real chart canvases, table rendering, service selection
updating series and URL state, time-picker changes, a successful refresh query,
and no uncaught JavaScript errors. `docs/local-dashboard.png` records the local UI.
No live Play dashboard JSON, authenticated data, browser recording, or screenshot
was acquired. A browser test against this local instance can establish local
interaction behavior, but cannot prove parity with the blocked live site.

The requested REA skill explicitly routes ordinary complete-source architecture
analysis to normal repository tools. REA's optional diagnostic was attempted:
CLI 6.8.0 requires Node ^22.23.4 / ^24.22.1 / >=26.12.1, while this machine has
24.19.0; MCP registration is absent. No client configuration or unrelated native
analysis engine was installed. Evidence here consists of source inspection and
our local runtime checks, not REA Evidence IDs.

The image health endpoint reports build commit
`6f8ce3c693b493043ebcd4787566d2b6b118b0f0`, different from the release-tag
source snapshot. Both identify version 13.3.0. Source/blob identity and image
digest are pinned independently; byte-for-byte build equivalence is not claimed.
