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
KEY = "trueprofit-study-expenses-v1"


class ProfitTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixture = json.loads(subprocess.check_output(["node", "--input-type=module", "-e", "import { baseOrders, dailyCosts } from './src/data.js'; process.stdout.write(JSON.stringify({baseOrders,dailyCosts}))"], cwd=ROOT, text=True))
        cls.rows = [dict(row, ads=0, operating=0) for row in cls.fixture["baseOrders"]]
        for cost in cls.fixture["dailyCosts"]:
            matching = [row for row in cls.rows if row["date"] == cost["date"] and row["store"] == cost["store"]]
            for key in ["ads", "operating"]:
                for index, row in enumerate(matching):
                    row[key] += cost[key] // len(matching) + (index < cost[key] % len(matching))
        for row in cls.rows:
            row["totalCosts"] = sum(row[key] for key in ["cogs", "shippingCost", "paymentFees", "fulfillment", "ads", "operating"])
            row["netProfit"] = row["revenue"] - row["totalCosts"]
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
        expect(self.page.locator("tbody tr")).to_have_count(10)

    def tearDown(self):
        try:
            self.assertEqual(self.errors, [], "Uncaught JavaScript errors")
            self.assertEqual(self.external_requests, [], "Unexpected third-party runtime requests")
        finally:
            self.context.close()

    def money(self, cents):
        amount = abs(Decimal(str(cents))) / 100
        return ("-" if cents < 0 else "") + "$" + f"{amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP):,}"

    def selected_rows(self, start="2026-10-03", store="All stores"):
        return [row for row in self.rows if row["date"] >= start and (store == "All stores" or row["store"] == store)]

    def add_expense(self, amount="100.01", store="All stores"):
        self.page.locator(".page-heading").get_by_role("button", name="Add expense", exact=True).click()
        dialog = self.page.get_by_role("dialog")
        expect(dialog.get_by_label("Expense name", exact=True)).to_be_focused()
        dialog.get_by_label("Expense name", exact=True).fill("Design software")
        dialog.get_by_label("Expense amount", exact=True).fill(amount)
        dialog.get_by_label("Expense store", exact=True).select_option(store)
        dialog.get_by_role("button", name="Add expense", exact=True).click()

    def test_ledger_totals_and_statement_reconcile(self):
        page = self.page
        rows = self.selected_rows()
        self.assertEqual(len(self.rows), 180)
        self.assertEqual(len(rows), 90)
        revenue = sum(row["gross"] - row["discount"] - row["refund"] + row["shippingCollected"] for row in rows)
        costs = sum(row["totalCosts"] for row in rows)
        expect(page.get_by_test_id("metric-revenue")).to_have_text(self.money(revenue))
        expect(page.get_by_test_id("metric-totalCosts")).to_have_text(self.money(costs))
        expect(page.get_by_test_id("metric-netProfit")).to_have_text(self.money(revenue - costs))
        expect(page.get_by_test_id("statement-net")).to_have_text(self.money(revenue - costs))
        expect(page.get_by_test_id("metric-count")).to_have_text("90")

    def test_store_and_period_controls(self):
        page = self.page
        page.get_by_label("Date range", exact=True).select_option("Last 7 days")
        page.get_by_label("Store filter", exact=True).select_option("Shopify")
        rows = self.selected_rows(start="2026-10-26", store="Shopify")
        expect(page.get_by_test_id("metric-count")).to_have_text(str(len(rows)))
        expect(page.get_by_test_id("metric-netProfit")).to_have_text(self.money(sum(row["netProfit"] for row in rows)))
        page.get_by_label("Date range", exact=True).select_option("Last 60 days")
        expect(page.locator(".no-comparison")).to_have_count(4)

    def test_expense_changes_profit_persists_and_deletes(self):
        page = self.page
        baseline = sum(row["netProfit"] for row in self.selected_rows())
        self.add_expense()
        expect(page.get_by_test_id("metric-netProfit")).to_have_text(self.money(baseline - 10001))
        page.reload()
        expect(page.get_by_test_id("metric-netProfit")).to_have_text(self.money(baseline - 10001))
        stored = json.loads(page.evaluate(f"localStorage.getItem('{KEY}')"))
        self.assertEqual(stored[0]["amount"], 10001)
        page.get_by_role("navigation", name="Main navigation").get_by_role("button", name="Costs", exact=True).click()
        expect(page.get_by_role("table", name="Added expenses")).to_contain_text("$100.01")
        page.once("dialog", lambda dialog: dialog.accept())
        page.get_by_role("button", name="Delete expense Design software", exact=True).click()
        expect(page.get_by_test_id("metric-netProfit")).to_have_text(self.money(baseline))
        page.reload()
        expect(page.get_by_test_id("metric-netProfit")).to_have_text(self.money(baseline))

    def test_all_store_expense_splits_every_cent(self):
        page = self.page
        self.add_expense()
        for store, cost in [("Shopify", 6667), ("Amazon", 3334)]:
            page.get_by_label("Store filter", exact=True).select_option(store)
            baseline = sum(row["netProfit"] for row in self.selected_rows(store=store))
            expect(page.get_by_test_id("metric-netProfit")).to_have_text(self.money(baseline - cost))
        page.get_by_label("Store filter", exact=True).select_option("All stores")
        baseline = sum(row["netProfit"] for row in self.selected_rows())
        expect(page.get_by_test_id("metric-netProfit")).to_have_text(self.money(baseline - 10001))

    def test_store_specific_expense_does_not_leak(self):
        page = self.page
        self.add_expense(amount="57.19", store="Shopify")
        page.get_by_label("Store filter", exact=True).select_option("Amazon")
        expect(page.get_by_test_id("metric-netProfit")).to_have_text(self.money(sum(row["netProfit"] for row in self.selected_rows(store="Amazon"))))
        page.get_by_label("Store filter", exact=True).select_option("Shopify")
        expect(page.get_by_test_id("metric-netProfit")).to_have_text(self.money(sum(row["netProfit"] for row in self.selected_rows(store="Shopify")) - 5719))

    def test_table_search_status_sort_and_pagination(self):
        page = self.page
        baseline = page.get_by_test_id("metric-netProfit").inner_text()
        page.get_by_label("Search orders", exact=True).fill("not a customer")
        expect(page.get_by_role("heading", name="No matching orders", exact=True)).to_be_visible()
        expect(page.get_by_test_id("metric-netProfit")).to_have_text(baseline)
        page.get_by_label("Search orders", exact=True).fill("")
        page.get_by_label("Order status filter", exact=True).select_option("Refunded")
        self.assertTrue(all("Refunded" in text for text in page.locator("tbody tr").all_text_contents()))
        page.get_by_label("Order status filter", exact=True).select_option("All statuses")
        page.get_by_role("columnheader", name="Net profit", exact=True).get_by_role("button").click()
        expected = sorted(self.selected_rows(), key=lambda row: row["netProfit"])
        expect(page.get_by_role("columnheader", name="Net profit", exact=True)).to_have_attribute("aria-sort", "ascending")
        self.assertEqual(page.locator("tbody .order-link").all_text_contents(), [row["id"] for row in expected[:10]])
        page.get_by_role("button", name="Next page", exact=True).click()
        self.assertEqual(page.locator("tbody .order-link").all_text_contents(), [row["id"] for row in expected[10:20]])
        page.get_by_label("Rows per page", exact=True).select_option("20")
        expect(page.locator("tbody tr")).to_have_count(20)

    def test_refund_detail_retains_costs_and_shows_loss(self):
        page = self.page
        page.get_by_role("button", name="TP-20841", exact=True).click()
        row = next(row for row in self.rows if row["id"] == "TP-20841")
        self.assertLess(row["netProfit"], 0)
        dialog = page.get_by_role("dialog")
        expect(dialog.get_by_test_id("detail-revenue")).to_have_text("$0.00")
        expect(dialog.get_by_test_id("detail-costs")).to_have_text(self.money(row["totalCosts"]))
        expect(dialog.get_by_test_id("detail-profit")).to_have_text(self.money(row["netProfit"]))
        page.keyboard.press("Escape")
        expect(page.get_by_role("dialog")).to_have_count(0)

    def test_csv_full_filter_and_cost_equations(self):
        page = self.page
        self.add_expense()
        page.get_by_label("Store filter", exact=True).select_option("Shopify")
        page.get_by_label("Order status filter", exact=True).select_option("Paid")
        with page.expect_download() as download_info:
            page.get_by_role("button", name="Export CSV", exact=True).click()
        with open(download_info.value.path(), encoding="utf-8-sig", newline="") as stream:
            records = list(csv.DictReader(stream))
        expected = [row for row in self.selected_rows(store="Shopify") if row["status"] == "Paid"]
        self.assertEqual(len(records), len(expected))
        self.assertGreater(len(records), 10)
        for row in records:
            self.assertEqual(row["Store"], "Shopify")
            costs = sum(Decimal(row[key]) for key in ["COGS USD", "Shipping USD", "Fees USD", "Fulfillment USD", "Ads USD", "Base overhead USD", "Added expenses USD"])
            self.assertEqual(costs, Decimal(row["Total costs USD"]))
            self.assertEqual(Decimal(row["Revenue USD"]) - costs, Decimal(row["Net profit USD"]))

    def test_product_profit_rollup_and_order_drill(self):
        page = self.page
        page.get_by_role("navigation", name="Main navigation").get_by_role("button", name="Products", exact=True).click()
        expect(page.get_by_role("table", name="Product profitability").locator("tbody tr")).to_have_count(6)
        first = page.get_by_role("table", name="Product profitability").locator("tbody tr").first
        name = first.locator(".product-name strong").inner_text()
        expected_product = [row for row in self.selected_rows() if row["product"] == name]
        expect(first.locator("td").nth(4)).to_have_text(self.money(sum(row["netProfit"] for row in expected_product)))
        first.get_by_role("button", name=f"View orders for {name}", exact=True).click()
        expect(page.get_by_label("Search orders", exact=True)).to_have_value(name)
        expect(page.locator("tbody .order-link")).to_have_count(min(10, len(expected_product)))
        self.assertTrue(all(row["product"] == name for row in self.selected_rows() if row["id"] in page.locator("tbody .order-link").all_text_contents()))

    def test_chart_measures_show_real_totals(self):
        page = self.page
        page.locator(".metric-switch").get_by_role("button", name="Revenue", exact=True).click()
        expect(page.get_by_test_id("trend-total")).to_have_text(page.get_by_test_id("metric-revenue").inner_text())
        expect(page.get_by_role("img", name="Daily revenue chart", exact=True)).to_be_visible()
        page.locator(".metric-switch").get_by_role("button", name="Costs", exact=True).click()
        expect(page.get_by_test_id("trend-total")).to_have_text(page.get_by_test_id("metric-totalCosts").inner_text())

    def test_custom_range_and_invalid_range(self):
        page = self.page
        page.get_by_label("Date range", exact=True).select_option("Custom range")
        page.get_by_label("Start date", exact=True).fill("2026-11-01")
        expect(page.get_by_test_id("metric-count")).to_have_text("3")
        page.get_by_label("End date", exact=True).fill("2026-10-31")
        expect(page.get_by_role("alert")).to_contain_text("Start date must be on or before end date")
        expect(page.get_by_test_id("metric-count")).to_have_text("0")
        expect(page.get_by_test_id("metric-netProfit")).to_have_text("$0.00")

    def test_mobile_navigation_keyboard_and_focus(self):
        page = self.page
        page.set_viewport_size({"width":390,"height":844})
        self.assertFalse(page.evaluate("document.documentElement.scrollWidth > innerWidth"))
        page.get_by_role("button", name="Open navigation", exact=True).click()
        page.get_by_role("navigation", name="Main navigation").get_by_role("button", name="Costs", exact=True).click()
        page.locator(".page-heading").get_by_role("button", name="Add expense", exact=True).click()
        expect(page.get_by_label("Expense name", exact=True)).to_be_focused()
        self.assertFalse(page.get_by_role("dialog").evaluate("el => el.scrollWidth > innerWidth"))
        page.keyboard.press("Escape")
        page.keyboard.press("Control+k")
        expect(page.get_by_label("Search orders", exact=True)).to_be_focused()

    def test_corrupt_storage_and_write_failure(self):
        page = self.page
        page.evaluate(f"localStorage.setItem('{KEY}', '{{broken-json')")
        page.reload()
        expect(page.get_by_test_id("metric-count")).to_have_text("90")
        self.assertEqual(json.loads(page.evaluate(f"localStorage.getItem('{KEY}')")), [])
        page.add_init_script("Storage.prototype.setItem=function(){throw new Error('Storage denied')}")
        page.reload()
        expect(page.get_by_role("alert")).to_contain_text("Expenses are not saved")


if __name__ == "__main__":
    unittest.main(verbosity=2)
