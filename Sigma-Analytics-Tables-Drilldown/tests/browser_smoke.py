"""Functional browser tests against the built app; starts/stops its own Vite preview."""
import csv
from decimal import Decimal, ROUND_HALF_UP
import json
import os
from pathlib import Path
import re
import socket
import subprocess
import time
import unittest
import urllib.request

from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
KEY = "sigma-analytics-study-view-v1"


class WorkbookTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows = json.loads(subprocess.check_output(["node", "--input-type=module", "-e", "import { orders } from './src/data.js'; process.stdout.write(JSON.stringify(orders))"], cwd=ROOT, text=True))
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(
            executable_path=os.environ.get("CHROMIUM_PATH", "/usr/bin/chromium"),
            headless=True, args=["--no-sandbox"],
        )
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            port = sock.getsockname()[1]
        cls.base = f"http://127.0.0.1:{port}"
        (ROOT / ".runtime").mkdir(exist_ok=True)
        cls.log = (ROOT / ".runtime/preview.log").open("w")
        cls.server = subprocess.Popen(
            ["node", "node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", str(port), "--strictPort"],
            cwd=ROOT, stdout=cls.log, stderr=subprocess.STDOUT,
        )
        cls.addClassCleanup(cls.cleanup)
        for _ in range(100):
            try:
                with urllib.request.urlopen(cls.base, timeout=1) as response:
                    if response.status == 200:
                        return
            except OSError:
                if cls.server.poll() is not None:
                    raise RuntimeError("Vite exited; see .runtime/preview.log")
                time.sleep(0.1)
        raise RuntimeError("Vite did not become ready")

    @classmethod
    def cleanup(cls):
        cls.server.terminate()
        try:
            cls.server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            cls.server.kill()
            cls.server.wait()
        cls.log.close()
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.context = self.browser.new_context(viewport={"width": 1440, "height": 1000})
        self.page = self.context.new_page()
        self.errors = []
        self.external_requests = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.on("request", lambda request: self.external_requests.append(request.url) if not request.url.startswith(self.base + "/") else None)
        self.page.goto(self.base)
        expect(self.page.locator("tbody tr")).to_have_count(15)

    def tearDown(self):
        try:
            self.assertEqual(self.errors, [], "Uncaught JavaScript errors")
            self.assertEqual(self.external_requests, [], "Unexpected third-party runtime requests")
        finally:
            self.context.close()

    def money(self, value):
        return "$" + f"{Decimal(str(value)).quantize(Decimal('1'), rounding=ROUND_HALF_UP):,}"

    def test_totals_region_drill_and_zero_results(self):
        page = self.page
        self.assertEqual(len(self.rows), 240)
        expect(page.get_by_test_id("metric-revenue")).to_have_text(self.money(sum(row["revenue"] for row in self.rows)))
        expect(page.get_by_test_id("metric-profit")).to_have_text(self.money(sum(row["revenue"] - row["cost"] for row in self.rows)))
        expect(page.get_by_test_id("metric-orders")).to_have_text("240")
        page.get_by_role("button", name="Filter to Europe", exact=True).click()
        expect(page.get_by_label("Filter region", exact=True)).to_have_value("Europe")
        rows = [row for row in self.rows if row["region"] == "Europe"]
        expect(page.get_by_test_id("metric-revenue")).to_have_text(self.money(sum(row["revenue"] for row in rows)))
        expect(page.get_by_test_id("metric-orders")).to_have_text(str(len(rows)))
        page.get_by_label("Search orders", exact=True).fill("nonexistent customer")
        expect(page.get_by_text("No matching orders", exact=True)).to_be_visible()
        expect(page.get_by_test_id("metric-revenue")).to_have_text("$0")
        expect(page.get_by_test_id("metric-orders")).to_have_text("0")
        expect(page.get_by_role("button", name="Export CSV", exact=True)).to_be_disabled()

    def test_combined_filters_and_relative_dates(self):
        page = self.page
        page.get_by_label("Filter category", exact=True).select_option("Software")
        page.get_by_label("Filter status", exact=True).select_option("Completed")
        page.get_by_label("Filter date range", exact=True).select_option("Last 30 days")
        rows = [row for row in self.rows if row["category"] == "Software" and row["status"] == "Completed" and row["date"] >= "2026-10-03"]
        expect(page.get_by_test_id("metric-orders")).to_have_text(str(len(rows)))
        expect(page.get_by_test_id("metric-revenue")).to_have_text(self.money(sum(row["revenue"] for row in rows)))
        expect(page.get_by_test_id("metric-average")).to_have_text(self.money(sum(row["revenue"] for row in rows) / len(rows)))
        page.get_by_role("button", name="Reset", exact=True).click()
        expect(page.get_by_test_id("metric-orders")).to_have_text("240")

    def test_numeric_sort_pagination_and_page_size(self):
        page = self.page
        page.get_by_role("columnheader", name=re.compile("Revenue")).get_by_role("button").click()
        expect(page.get_by_role("columnheader", name=re.compile("Revenue"))).to_have_attribute("aria-sort", "ascending")
        expected = sorted(self.rows, key=lambda row: row["revenue"])
        self.assertEqual(page.locator("tbody .order-link").all_text_contents(), [row["id"] for row in expected[:15]])
        page.get_by_role("button", name="Next page", exact=True).click()
        self.assertEqual(page.locator("tbody .order-link").all_text_contents(), [row["id"] for row in expected[15:30]])
        page.get_by_label("Rows per page", exact=True).select_option("25")
        expect(page.locator("tbody tr")).to_have_count(25)
        expect(page.get_by_role("button", name="Previous page", exact=True)).to_be_disabled()

    def test_grouping_expansion_and_column_visibility(self):
        page = self.page
        page.get_by_label("Group rows by", exact=True).select_option("region")
        expect(page.locator(".group-row")).to_have_count(4)
        button = page.locator(".group-row button").filter(has_text="North America")
        rows = [row for row in self.rows if row["region"] == "North America"]
        expect(button).to_contain_text(self.money(sum(row["revenue"] for row in rows)))
        button.click()
        expect(page.locator("tbody .order-link")).to_have_count(len(rows))
        button.click()
        expect(page.locator("tbody .order-link")).to_have_count(0)
        page.get_by_label("Group rows by", exact=True).select_option("none")
        page.locator("summary").click()
        page.locator(".columns-popover").get_by_label("Customer", exact=True).uncheck()
        expect(page.get_by_role("columnheader", name=re.compile("Customer"))).to_have_count(0)
        page.locator(".columns-popover").get_by_label("Customer", exact=True).check()
        expect(page.get_by_role("columnheader", name=re.compile("Customer"))).to_have_count(1)

    def test_record_detail_reconciliation_and_customer_drill(self):
        page = self.page
        page.get_by_label("Filter region", exact=True).select_option("Europe")
        page.locator("tbody .order-link").first.click()
        dialog = page.get_by_role("dialog")
        order_id = dialog.locator("h2").inner_text()
        row = next(row for row in self.rows if row["id"] == order_id)
        expect(dialog.get_by_test_id("detail-revenue")).to_have_text(self.money(row["revenue"]))
        expect(dialog.get_by_test_id("detail-cost")).to_have_text(self.money(row["cost"]))
        expect(dialog.get_by_test_id("detail-profit")).to_have_text(self.money(row["revenue"] - row["cost"]))
        dialog.get_by_role("button", name="View all orders for this customer", exact=True).click()
        expect(page.get_by_label("Filter region", exact=True)).to_have_value("All regions")
        expect(page.get_by_label("Search orders", exact=True)).to_have_value(row["customer"])
        expect(page.get_by_test_id("metric-orders")).to_have_text(str(sum(item["customer"] == row["customer"] for item in self.rows)))

    def test_csv_export_projection_filters_and_selection(self):
        page = self.page
        page.get_by_label("Filter region", exact=True).select_option("Europe")
        page.locator("summary").click()
        page.locator(".columns-popover").get_by_label("Margin", exact=True).uncheck()
        page.locator("summary").click()
        with page.expect_download() as download_info:
            page.get_by_role("button", name="Export CSV", exact=True).click()
        download = download_info.value
        with open(download.path(), encoding="utf-8-sig", newline="") as stream:
            rows = list(csv.DictReader(stream))
        self.assertEqual(len(rows), sum(row["region"] == "Europe" for row in self.rows))
        self.assertTrue(all(row["Region"] == "Europe" for row in rows))
        self.assertNotIn("Margin", rows[0])
        page.locator("tbody input[type=checkbox]").nth(0).check()
        page.locator("tbody input[type=checkbox]").nth(1).check()
        expect(page.get_by_text("2 selected", exact=True)).to_be_visible()
        ids = page.locator("tr.row-selected .order-link").all_text_contents()
        with page.expect_download() as download_info:
            page.get_by_role("button", name="Export selected", exact=True).click()
        with open(download_info.value.path(), encoding="utf-8-sig", newline="") as stream:
            selected = list(csv.DictReader(stream))
        self.assertEqual([row["Order ID"] for row in selected], ids)
        self.assertEqual(len(selected), 2)

    def test_saved_view_restores_filter_sort_and_columns(self):
        page = self.page
        page.get_by_label("Filter region", exact=True).select_option("Asia Pacific")
        page.get_by_role("columnheader", name=re.compile("Revenue")).get_by_role("button").click()
        page.locator("summary").click()
        page.locator(".columns-popover").get_by_label("Customer", exact=True).uncheck()
        page.locator("summary").click()
        page.get_by_role("button", name="Save view", exact=True).click()
        dialog = page.get_by_role("dialog")
        expect(dialog.get_by_label("View name", exact=True)).to_be_focused()
        dialog.get_by_label("View name", exact=True).fill("Asia revenue review")
        dialog.get_by_role("button", name="Save view", exact=True).click()
        page.reload()
        expect(page.get_by_label("Filter region", exact=True)).to_have_value("Asia Pacific")
        expect(page.get_by_role("columnheader", name=re.compile("Customer"))).to_have_count(0)
        expect(page.get_by_role("columnheader", name=re.compile("Revenue"))).to_have_attribute("aria-sort", "ascending")
        expect(page.get_by_role("button", name="Asia revenue review", exact=True)).to_be_visible()

    def test_explore_group_measure_and_source_drill(self):
        page = self.page
        page.locator(".page-tabs").get_by_role("button", name="Explore data", exact=True).click()
        page.get_by_label("Explore group", exact=True).select_option("category")
        page.get_by_label("Explore measure", exact=True).select_option("count")
        expect(page.locator(".explore-results>button")).to_have_count(3)
        software = page.get_by_role("button", name="Drill into Software", exact=True)
        expect(software.locator("b")).to_have_text(str(sum(row["category"] == "Software" for row in self.rows)))
        software.click()
        expect(page.get_by_label("Filter category", exact=True)).to_have_value("Software")
        expect(page.locator(".page-tabs button.selected")).to_have_text("Order explorer")

    def test_mobile_keyboard_modal_and_overflow(self):
        page = self.page
        page.set_viewport_size({"width": 390, "height": 844})
        self.assertFalse(page.evaluate("document.documentElement.scrollWidth > innerWidth"))
        page.get_by_role("button", name="Open navigation", exact=True).click()
        page.locator(".workbook-page").filter(has_text="Order explorer").click()
        expect(page.locator(".page-tabs button.selected")).to_have_text("Order explorer")
        page.keyboard.press("Control+k")
        expect(page.get_by_label("Search orders", exact=True)).to_be_focused()
        page.locator("tbody .order-link").first.click()
        expect(page.get_by_role("dialog")).to_be_visible()
        self.assertFalse(page.get_by_role("dialog").evaluate("el => el.scrollWidth > innerWidth"))
        page.keyboard.press("Escape")
        expect(page.get_by_role("dialog")).to_have_count(0)

    def test_corrupt_saved_view_and_storage_failure(self):
        page = self.page
        page.evaluate(f"localStorage.setItem('{KEY}', '{{broken json')")
        page.reload()
        expect(page.get_by_test_id("metric-orders")).to_have_text("240")
        page.add_init_script("Storage.prototype.setItem = function() { throw new Error('Storage denied'); }")
        page.reload()
        page.get_by_role("button", name="Save view", exact=True).click()
        page.get_by_role("dialog").get_by_role("button", name="Save view", exact=True).click()
        expect(page.get_by_role("alert")).to_contain_text("browser storage is unavailable")


if __name__ == "__main__":
    unittest.main(verbosity=2)
