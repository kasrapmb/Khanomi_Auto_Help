"""Functional browser tests against the built app; starts/stops its own Vite preview."""
import csv
import sqlite3
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
KEY = "hex-data-notebook-study-v1"


class NotebookTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixture = json.loads(subprocess.check_output(["node", "--input-type=module", "-e", "import {orders,schema,queries} from './src/data.js'; process.stdout.write(JSON.stringify({orders,schema,queries}))"], cwd=ROOT, text=True))
        cls.reference = sqlite3.connect(":memory:")
        cls.reference.execute("CREATE TABLE orders (" + ",".join(name + " " + kind for name, kind in cls.fixture["schema"]) + ")")
        cls.reference.executemany("INSERT INTO orders VALUES (?,?,?,?,?,?,?,?)", [[row[name] for name, _ in cls.fixture["schema"]] for row in cls.fixture["orders"]])
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
        cls.reference.close()

    def setUp(self):
        self.context = self.browser.new_context(viewport={"width": 1440, "height": 1000})
        self.page = self.context.new_page()
        self.errors = []
        self.external_requests = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.on("request", lambda request: self.external_requests.append(request.url) if not request.url.startswith(self.base + "/") else None)
        self.page.goto(self.base, wait_until="domcontentloaded")
        expect(self.page.get_by_test_id("query-status")).to_have_attribute("data-status", "success", timeout=15000)
        expect(self.page.get_by_test_id("result-row-count")).to_have_text("6")

    def tearDown(self):
        try:
            self.assertEqual(self.errors, [], "Uncaught JavaScript errors")
            self.assertEqual(self.external_requests, [], "Unexpected third-party runtime requests")
        finally:
            self.context.close()

    def money(self, value):
        amount = Decimal(str(value))
        return ("-" if amount < 0 else "") + "$" + f"{abs(amount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP):,}"

    def run_query(self, sql, success=True):
        page = self.page
        page.get_by_label("SQL query", exact=True).fill(sql)
        page.get_by_role("button", name="Run SQL cell", exact=True).click()
        expect(page.get_by_test_id("query-status")).to_have_attribute("data-status", "success" if success else "error", timeout=15000)

    def test_real_sqlite_monthly_totals(self):
        page = self.page
        total = sum(row["revenue_cents"] for row in self.fixture["orders"]) / 100
        profit = sum(row["revenue_cents"] - row["cost_cents"] for row in self.fixture["orders"]) / 100
        expect(page.get_by_test_id("result-sum")).to_have_text(self.money(total))
        expect(page.get_by_test_id("result-profit")).to_have_text(self.money(profit))
        expect(page.get_by_role("table", name="Query result", exact=True).locator("tbody tr")).to_have_count(6)
        expected = self.reference.execute(self.fixture["queries"]["monthly"], {"region":"All regions"}).fetchall()
        actual = page.get_by_role("table", name="Query result", exact=True).locator("tbody tr").first
        expect(actual).to_contain_text(expected[0][0])
        expect(actual).to_contain_text(self.money(expected[0][2]))
        expect(page.get_by_test_id("chart-bar")).to_have_count(6)

    def test_parameter_change_is_stale_until_run(self):
        page = self.page
        before = page.get_by_test_id("result-sum").inner_text()
        page.get_by_label("Region parameter", exact=True).select_option("Europe")
        expect(page.get_by_test_id("result-sum")).to_have_text(before)
        expect(page.locator(".result-provenance.stale")).to_contain_text("Draft or parameters changed")
        page.get_by_role("button", name="Run SQL cell", exact=True).click()
        expected = sum(row["revenue_cents"] for row in self.fixture["orders"] if row["region"] == "Europe") / 100
        expect(page.get_by_test_id("result-sum")).to_have_text(self.money(expected), timeout=15000)
        expect(page.locator(".result-provenance.stale")).to_have_count(0)

    def test_editable_sql_changes_shape_and_chart_axes(self):
        sql = "SELECT category, SUM(quantity) AS units FROM orders GROUP BY category ORDER BY units DESC;"
        self.run_query(sql)
        page = self.page
        expect(page.get_by_test_id("result-row-count")).to_have_text("3")
        expect(page.get_by_label("Chart X axis", exact=True)).to_have_value("category")
        expect(page.get_by_label("Chart Y axis", exact=True)).to_have_value("units")
        expect(page.get_by_test_id("chart-bar")).to_have_count(3)
        expected = self.reference.execute(sql).fetchall()
        expect(page.get_by_role("table", name="Query result", exact=True).locator("tbody tr").first).to_contain_text(str(expected[0][1]))

    def test_read_only_and_single_statement_guards(self):
        page = self.page
        self.run_query("DELETE FROM orders;", success=False)
        expect(page.get_by_role("alert")).to_contain_text(re.compile("read.only|readonly|SELECT", re.I))
        expect(page.get_by_test_id("result-row-count")).to_have_text("6")
        self.run_query("SELECT 1 AS value; SELECT 2 AS other;", success=False)
        expect(page.get_by_role("alert")).to_contain_text("one SELECT statement")
        self.run_query("SELECT COUNT(*) AS order_count FROM orders;")
        expect(page.get_by_test_id("result-row-count")).to_have_text("1")
        expect(page.get_by_role("table", name="Query result", exact=True)).to_contain_text("240")

    def test_syntax_error_retains_last_success_and_recovers(self):
        page = self.page
        before = page.get_by_test_id("result-sum").inner_text()
        self.run_query("SELECT missing_column FROM orders;", success=False)
        expect(page.get_by_role("alert")).to_contain_text("missing_column")
        expect(page.get_by_test_id("result-sum")).to_have_text(before)
        expect(page.get_by_test_id("chart-bar")).to_have_count(6)
        self.run_query("SELECT region, COUNT(*) AS orders FROM orders GROUP BY region;")
        expect(page.get_by_test_id("result-row-count")).to_have_text("4")

    def test_result_sort_search_csv_and_pagination(self):
        page = self.page
        self.run_query("SELECT order_id, region, revenue_cents FROM orders;")
        expect(page.get_by_test_id("result-row-count")).to_have_text("240")
        table = page.get_by_role("table", name="Query result", exact=True)
        table.get_by_role("columnheader", name=re.compile("revenue_cents")).get_by_role("button").click()
        expect(table.get_by_role("columnheader", name=re.compile("revenue_cents"))).to_have_attribute("aria-sort", "ascending")
        expected = sorted(self.fixture["orders"], key=lambda row: row["revenue_cents"])
        expect(table.locator("tbody tr").first).to_contain_text(expected[0]["order_id"])
        page.get_by_role("button", name="Next Query result page", exact=True).click()
        expect(table.locator("tbody tr").first).to_contain_text(expected[8]["order_id"])
        page.get_by_label("Query result rows per page", exact=True).select_option("15")
        expect(table.locator("tbody tr")).to_have_count(15)
        page.get_by_label("Search Query result", exact=True).fill("Europe")
        with page.expect_download() as info:
            page.get_by_role("button", name="Export Query result CSV", exact=True).click()
        with open(info.value.path(),encoding="utf-8-sig",newline="") as stream:
            records = list(csv.DictReader(stream))
        self.assertEqual(len(records), sum(row["region"] == "Europe" for row in self.fixture["orders"]))
        self.assertTrue(all(row["region"] == "Europe" for row in records))
        self.assertEqual([int(row["revenue_cents"]) for row in records], sorted(int(row["revenue_cents"]) for row in records))

    def test_helper_discloses_templates_and_executes_supported_question(self):
        page = self.page
        expect(page.get_by_text("Template-based · no LLM connected", exact=True)).to_be_visible()
        initial_sql = page.get_by_label("SQL query", exact=True).input_value()
        page.get_by_label("Ask local data helper", exact=True).fill("Which region has the most revenue?")
        page.get_by_role("button", name="Submit helper question", exact=True).click()
        expect(page.get_by_test_id("helper-reply")).to_contain_text("Review it below")
        expect(page.get_by_label("SQL query", exact=True)).to_have_value(initial_sql)
        page.get_by_role("button", name="Run suggested query", exact=True).click()
        expect(page.get_by_test_id("result-row-count")).to_have_text("4", timeout=15000)
        expected = self.reference.execute(self.fixture["queries"]["region"], {"region":"All regions"}).fetchall()
        expect(page.get_by_test_id("helper-reply")).to_contain_text(expected[0][0])
        expect(page.get_by_test_id("helper-reply")).to_contain_text(self.money(expected[0][2]))
        expect(page.get_by_label("SQL query", exact=True)).to_have_value(self.fixture["queries"]["region"])

    def test_unsupported_helper_question_does_not_invent_answer(self):
        page = self.page
        initial_sql = page.get_by_label("SQL query", exact=True).input_value()
        page.get_by_label("Ask local data helper", exact=True).fill("What is the weather tomorrow?")
        page.get_by_role("button", name="Submit helper question", exact=True).click()
        expect(page.get_by_test_id("helper-reply")).to_contain_text("no AI model is connected")
        expect(page.get_by_role("button", name="Run suggested query", exact=True)).to_have_count(0)
        expect(page.get_by_label("SQL query", exact=True)).to_have_value(initial_sql)

    def test_note_query_persistence_and_notebook_export(self):
        page = self.page
        page.get_by_role("button", name="Edit note", exact=True).click()
        page.get_by_label("Notebook introduction", exact=True).fill("A validated local analysis.")
        page.get_by_role("button", name="Done", exact=True).click()
        sql = "SELECT COUNT(*) AS order_count FROM orders;"
        self.run_query(sql)
        page.reload(wait_until="domcontentloaded")
        expect(page.get_by_test_id("query-status")).to_have_attribute("data-status", "success", timeout=15000)
        expect(page.get_by_test_id("result-row-count")).to_have_text("1")
        expect(page.get_by_text("A validated local analysis.", exact=True)).to_be_visible()
        with page.expect_download() as info:
            page.get_by_role("button", name="Export", exact=True).click()
        notebook = json.loads(Path(info.value.path()).read_text())
        self.assertEqual(notebook["format"], "hex-study-v1")
        self.assertEqual(notebook["query"], sql)
        self.assertEqual(notebook["note"], "A validated local analysis.")

    def test_chart_controls_and_app_preview(self):
        page = self.page
        page.get_by_role("button", name="Line chart", exact=True).click()
        expect(page.get_by_role("img", name="Line chart of revenue by month", exact=True)).to_be_visible()
        page.get_by_label("Chart Y axis", exact=True).select_option("gross_profit")
        expect(page.get_by_role("img", name="Line chart of gross_profit by month", exact=True)).to_be_visible()
        page.locator(".workspace-tabs").get_by_role("button", name="App preview", exact=True).click()
        expect(page.get_by_label("SQL query", exact=True)).to_have_count(0)
        expect(page.get_by_role("table", name="Query result", exact=True)).to_be_visible()
        page.get_by_label("Region parameter", exact=True).select_option("Asia Pacific")
        expect(page.get_by_text("Draft or parameters changed. Run analysis to update this preview.", exact=True)).to_be_visible()

    def test_source_data_schema_and_full_csv(self):
        page = self.page
        page.locator(".workspace-tabs").get_by_role("button", name="Data", exact=True).click()
        expect(page.locator(".source-schema>span")).to_have_count(8)
        page.get_by_label("Region parameter", exact=True).select_option("Europe")
        expected = [row for row in self.fixture["orders"] if row["region"] == "Europe"]
        with page.expect_download() as info:
            page.get_by_role("button", name="Export Source orders CSV", exact=True).click()
        with open(info.value.path(),encoding="utf-8-sig",newline="") as stream:
            records = list(csv.DictReader(stream))
        self.assertEqual(len(records), len(expected))
        self.assertTrue(all(row["region"] == "Europe" for row in records))
        self.assertEqual(sum(int(row["revenue_cents"]) for row in records), sum(row["revenue_cents"] for row in expected))

    def test_result_cap_unique_columns_and_sql_string_semicolon(self):
        page = self.page
        self.run_query("SELECT a.order_id AS left_id, b.order_id AS right_id FROM orders a CROSS JOIN orders b;")
        expect(page.get_by_test_id("result-row-count")).to_have_text("500")
        expect(page.locator(".truncation-note")).to_contain_text("Result capped at 500")
        self.run_query("SELECT 1 AS duplicate, 2 AS duplicate;",success=False)
        expect(page.get_by_role("alert")).to_contain_text("unique alias")
        self.run_query("-- valid leading comment\nSELECT '; still one statement' AS note; -- trailing comment")
        expect(page.get_by_test_id("result-row-count")).to_have_text("1")
        expect(page.get_by_role("table", name="Query result", exact=True)).to_contain_text("; still one statement")

    def test_cancel_worker_then_run_again(self):
        page = self.page
        page.get_by_label("SQL query", exact=True).fill("SELECT COUNT(*) AS count FROM orders a CROSS JOIN orders b CROSS JOIN orders c CROSS JOIN orders d;")
        page.get_by_role("button", name="Run SQL cell", exact=True).click()
        page.get_by_role("button", name="Cancel query", exact=True).click()
        expect(page.get_by_test_id("query-status")).to_have_attribute("data-status", "cancelled", timeout=10000)
        expect(page.get_by_test_id("result-row-count")).to_have_text("6")
        self.run_query("SELECT COUNT(*) AS order_count FROM orders;")
        expect(page.get_by_test_id("result-row-count")).to_have_text("1")
        expect(page.get_by_role("table", name="Query result", exact=True)).to_contain_text("240")

    def test_history_restore_requires_explicit_run(self):
        page = self.page
        self.run_query("SELECT COUNT(*) AS order_count FROM orders;")
        expect(page.get_by_test_id("result-row-count")).to_have_text("1")
        page.locator(".helper-tabs").get_by_role("button", name=re.compile("Runs")).click()
        expect(page.locator(".run-history>button")).to_have_count(2)
        page.locator(".run-history>button").last.click()
        expect(page.get_by_label("SQL query", exact=True)).to_have_value(self.fixture["queries"]["monthly"])
        expect(page.get_by_test_id("result-row-count")).to_have_text("1")
        expect(page.locator(".result-provenance.stale")).to_be_visible()
        page.get_by_role("button", name="Run SQL cell", exact=True).click()
        expect(page.get_by_test_id("result-row-count")).to_have_text("6",timeout=15000)

    def test_mobile_helper_keyboard_and_document_overflow(self):
        page = self.page
        page.set_viewport_size({"width":390,"height":844})
        self.assertFalse(page.evaluate("document.documentElement.scrollWidth > innerWidth"))
        page.get_by_role("button", name="Open navigation", exact=True).click()
        page.locator(".sidebar").get_by_role("button", name=re.compile("^Data")).click()
        expect(page.get_by_role("table", name="Source orders", exact=True)).to_be_visible()
        self.assertFalse(page.evaluate("document.documentElement.scrollWidth > innerWidth"))
        page.keyboard.press("Control+k")
        expect(page.get_by_label("Ask local data helper", exact=True)).to_be_focused()
        expect(page.get_by_text("Template-based · no LLM connected", exact=True)).to_be_visible()
        page.get_by_role("button", name="Close helper", exact=True).click()
        expect(page.locator(".helper-panel")).not_to_have_class(re.compile("mobile-open"))

    def test_corrupt_saved_notebook_and_storage_failure(self):
        page = self.page
        page.evaluate(f"localStorage.setItem('{KEY}', '{{bad-json')")
        page.reload(wait_until="domcontentloaded")
        expect(page.get_by_test_id("query-status")).to_have_attribute("data-status", "success", timeout=15000)
        expect(page.get_by_test_id("result-row-count")).to_have_text("6")
        page.add_init_script("Storage.prototype.setItem=function(){throw new Error('Storage denied')}")
        page.reload(wait_until="domcontentloaded")
        expect(page.get_by_role("alert")).to_contain_text("Notebook changes are not saved")


if __name__ == "__main__":
    unittest.main(verbosity=2)
