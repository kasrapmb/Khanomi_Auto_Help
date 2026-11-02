# Investigation ledger — 2026-11-02

## Target and boundary

Requested: https://www.anodot.com/ — dashboard, anomaly detection, alerts and root-cause investigation. Deliverable directory: `Anodot-Dashboard` inside `kasrapmb/Khanomi_Auto_Help`.

The original product's implementation and exact visual behavior remain **unresolved**. This folder contains an independent implementation of the requested workflow, not downloaded proprietary source or a verified product clone.

## Observations

1. The requested skill repository was fetched from GitHub with the existing platform authentication. `reverse-engineer-anything/SKILL.md`, connection recovery, and environment recording guidance were read.
2. No REA tools were advertised in this session. Read-only `rea-agents@6.8.0 doctor --client codex --json` reported Node 24.19.0 below its supported versions and absent Codex registration. The diagnostic completed with an unhealthy result. No registration changes or engine installation was performed. Local implementation work used normal coding tools, as the skill directs for reconstruction.
3. A TLS-verified curl request through the inherited proxy to the public homepage failed before an HTTP origin response: `curl: (56) CONNECT tunnel failed, response 403` and HTTP code `000`. This is a network access failure, not evidence that Anodot itself returned a 403 or that its app requires authentication.
4. Added `www.anodot.com`, `anodot.com`, `docs.anodot.com` to the environment configuration draft, preserving the package-manager preset and the empty prior custom list. A successful draft save does not apply network changes or establish connectivity.
5. No original HTML, JavaScript bundles, source maps, screenshot, authenticated app, product API response or original source repository was obtained. No REA Evidence ID exists for Anodot. Private source availability was not established; this report does not claim it is open or closed source based on a search.

## Independent design decisions

The plain JavaScript application serves static ES modules. It generates six deterministic series with transient disturbances. For each sample after 24 points, it computes a population mean and deviation from the previous 24 points. The noise scale is `max(stddev, abs(mean)*0.015, 0.001)`. A point is anomalous when absolute standardized deviation is at least the configured threshold (2, 3 or 4). The feed deliberately summarizes the seeded onset of each metric's event rather than pretending to be a complete production incident aggregation engine. Critical means score >=10; other detected onsets are Warning. Ranking is descending by onset score.

Related signals have onset indices within two samples (40 minutes). This is a temporal association, not statistical correlation estimation or causal inference. The investigation checklist suggests raw-event, deployment, gateway and traffic checks. No root cause is asserted.

Alert triage and sensitivity live in localStorage. Status transitions change the local inbox and KPI counts. Resolved and Snoozed do not count as open; Acknowledged remains open. No notification is transmitted. CSV includes only visible matching rows, escaping quoted fields.

## Validation of local implementation

- Node test suite: 7 passed, 0 failed. Baseline arithmetic, stable-series negatives, known drops, threshold behavior, six onset fixtures, related-signal boundaries and CSV quoting.
- Chromium through Playwright: 5 passed, 0 failed. Investigation and navigation to related metrics, text/severity filters, actual CSV download, triage persistence, rule persistence/reset, malformed storage, blocked storage, mobile overflow and dialog behavior.
- Tests assert no uncaught browser errors and no external runtime requests.
- Screenshots in this directory are captures of this local implementation only.

## Outstanding investigation

Apply the saved network additions in environment settings, then retry the public target. If product access requires an account, use an authorized instance/session; do not infer product internals from the marketing site. Revisit the visual and interaction reconstruction after actual observation. A source-level explanation requires accessible original artifacts or an explicitly published source repository. The current work does not fulfill that part of the request.
