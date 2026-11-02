# Validation of the local study

- Official source snapshot: all **24,113** archived blobs, including exact symlink
  targets, match the Git object identities of the pinned upstream commit.
- `docker compose up -d --wait --wait-timeout 120`: healthy local Grafana/SQLite.
- `python3 scripts/smoke.py`: **8 checks passed**. Version/health; dashboard and
  four visualization types; variable/refresh/cursor configuration; default
  datasource; actual time-series queries for 1h and 6h; CSV table rows; frontend route.
- `python3 scripts/browser_smoke.py`: **5 checks passed** in installed Chromium.
  Dark theme and chart/table rendering; service selection; time-range change;
  refresh query; no uncaught JavaScript errors.
- Local rendering captured in `local-dashboard.png`.

Startup fixes made during validation: bind-mounted public provisioning files
must be readable by the container user; loopback health checks must not go
through the egress proxy; optional external plugin preinstallation is disabled.
The required TestData plugin is built in and its real query API was exercised.

Not run: a complete local Grafana source build and upstream test suite. Runtime
checks used the pinned official prebuilt image. The online reference site
returned HTTP 403, so its actual dashboard configuration, deployed version,
visual parity, and data remain unverified. REA diagnostic results and the
source-only analysis route are explained in ARCHITECTURE.md.
