#!/usr/bin/env python3
"""Optional browser checks: requires Python Playwright and Chromium."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

base = os.environ.get("GRAFANA_URL", "http://127.0.0.1:3000").rstrip("/")
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH", "/usr/bin/chromium"),
                                headless=True, args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 1440, "height": 1100})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(base + "/d/grafana-play-dark?theme=dark", wait_until="domcontentloaded")
    expect(page.get_by_role("button", name="checkout / success", exact=True)).to_be_visible(timeout=30000)
    expect(page.get_by_text("payments", exact=True)).to_be_visible(timeout=30000)
    assert page.locator("canvas").count() >= 4
    assert "theme-dark" in page.locator("body").get_attribute("class")
    print("PASS: dark theme, real chart canvases, and table render")
    page.screenshot(path=str(Path(__file__).resolve().parents[1] / "docs/local-dashboard.png"), full_page=True)
    page.get_by_role("combobox").click()
    page.get_by_role("option", name="payments", exact=True).click()
    expect(page.get_by_role("button", name="payments / success", exact=True)).to_be_visible(timeout=30000)
    assert "var-service=payments" in page.url
    print("PASS: selecting a service updates the rendered series and URL state")
    page.get_by_role("button").filter(has_text="Last 1 hour").click()
    page.get_by_text("Last 6 hours", exact=True).click()
    expect(page.get_by_role("button").filter(has_text="Last 6 hours")).to_be_visible()
    assert "from=now-6h" in page.url
    print("PASS: changing the time picker updates time range and URL state")
    with page.expect_response(lambda response: "/api/ds/query" in response.url and response.request.method == "POST") as query:
        page.get_by_role("button", name="Refresh", exact=True).click()
    assert query.value.ok
    print("PASS: Refresh executes a successful data query")
    assert not errors, errors
    print("PASS: no uncaught JavaScript errors")
    browser.close()
