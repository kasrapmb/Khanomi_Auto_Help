#!/usr/bin/env python3
"""Exercise the real Grafana HTTP and TestData query APIs (stdlib only)."""
import json
import os
import urllib.request

base = os.environ.get("GRAFANA_URL", "http://127.0.0.1:3000").rstrip("/")

def request(path, body=None):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(base + path, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)

health = request("/api/health")
assert health["database"] == "ok" and health["version"] == "13.3.0", health
print("PASS: Grafana 13.3.0 and SQLite health")
dashboard = request("/api/dashboards/uid/grafana-play-dark")["dashboard"]
assert len(dashboard["panels"]) == 8
assert {p["type"] for p in dashboard["panels"]} == {"stat", "timeseries", "gauge", "table"}
print("PASS: provisioned dashboard and all four visualization types")
assert dashboard["templating"]["list"][0]["name"] == "service"
assert dashboard["refresh"] == "10s" and dashboard["graphTooltip"] == 1
print("PASS: service selector, auto refresh, and synchronized cursor configuration")
sources = request("/api/datasources")
assert any(s["uid"] == "demo-testdata" and s["isDefault"] for s in sources)
print("PASS: provisioned default TestData source")
for interval in [3600000, 21600000]:
    result = request("/api/ds/query", {
        "from": str(1700000000000 - interval), "to": "1700000000000",
        "queries": [{"refId": "A", "datasource": {"type": "grafana-testdata-datasource", "uid": "demo-testdata"},
                     "scenarioId": "random_walk", "alias": "checkout", "intervalMs": 15000, "maxDataPoints": 100}]
    })["results"]["A"]
    assert not result.get("error"), result
    frames = result["frames"]
    assert frames and any(f["data"]["values"] and len(f["data"]["values"][0]) > 1 for f in frames), result
    print(f"PASS: real random-walk query returns time-series data for {interval // 3600000}h")
result = request("/api/ds/query", {
    "from": "1699996400000", "to": "1700000000000",
    "queries": [{"refId": "A", "datasource": {"type": "grafana-testdata-datasource", "uid": "demo-testdata"},
                 "scenarioId": "csv_content", "csvContent": dashboard["panels"][-1]["targets"][0]["csvContent"],
                 "intervalMs": 15000, "maxDataPoints": 100}]
})["results"]["A"]
assert not result.get("error"), result
assert any("payments" in column for f in result["frames"] for column in f["data"]["values"]), result
print("PASS: service inventory query returns actual table rows")
with urllib.request.urlopen(base + "/d/grafana-play-dark?theme=dark", timeout=30) as response:
    html = response.read().decode()
assert "grafanaBootData" in html and "build/" in html
print("PASS: dashboard route serves the real Grafana frontend")
