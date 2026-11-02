"""Functional browser tests against the built app; starts/stops its own Vite preview."""
import hashlib
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
KEY = "geist-study-preferences-v1"


class GeistTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
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
        expect(self.page.locator(".example-card")).to_have_count(5)

    def tearDown(self):
        try:
            self.assertEqual(self.errors, [], "Uncaught JavaScript errors")
            self.assertEqual(self.external_requests, [], "Unexpected third-party runtime requests")
        finally:
            self.context.close()

    def navigate(self, name):
        self.page.get_by_role("navigation", name="Component navigation", exact=True).get_by_role("button", name=re.compile("^" + re.escape(name) + r"(?:\s+NEW)?$")).click()

    def test_official_local_fonts_and_file_integrity(self):
        manifest = json.loads((ROOT / "licenses/FONT-SOURCE.json").read_text())
        self.assertEqual(manifest["version"], "1.9.0")
        for item in manifest["files"]:
            self.assertEqual(hashlib.sha256((ROOT / item["path"]).read_bytes()).hexdigest(), item["sha256"])
        fonts = self.page.evaluate("""async () => {
          await document.fonts.ready;
          return [...document.fonts].map(font => ({family: font.family, status: font.status}));
        }""")
        self.assertTrue(any(font["family"].strip('"') == "Geist Sans" and font["status"] == "loaded" for font in fonts))
        self.assertTrue(any(font["family"].strip('"') == "Geist Mono" and font["status"] == "loaded" for font in fonts))

    def test_theme_and_component_preference_persist(self):
        page = self.page
        page.get_by_role("button", name="Switch to dark theme", exact=True).click()
        expect(page.locator("html")).to_have_attribute("data-theme", "dark")
        self.navigate("Input")
        page.reload()
        expect(page.locator("html")).to_have_attribute("data-theme", "dark")
        expect(page.get_by_role("heading", name="Input.", exact=True)).to_be_visible()
        self.assertEqual(json.loads(page.evaluate(f"localStorage.getItem('{KEY}')")), {"theme":"dark","active":"input"})

    def test_search_keyboard_enter_escape_and_empty_results(self):
        page = self.page
        page.keyboard.press("Control+k")
        search = page.get_by_role("textbox", name="Search component library", exact=True)
        expect(search).to_be_focused()
        search.fill("no such component")
        expect(page.get_by_text("No components match that search.", exact=True)).to_be_visible()
        search.fill("progress")
        page.keyboard.press("Enter")
        expect(page.get_by_role("heading", name="Progress.", exact=True)).to_be_visible()
        expect(page.get_by_role("progressbar", name="Build progress", exact=True)).to_have_attribute("value", "40")
        page.keyboard.press("Control+k")
        page.keyboard.press("Escape")
        expect(page.get_by_role("dialog")).to_have_count(0)

    def test_project_create_details_duplicate_and_confirmed_delete(self):
        page = self.page
        self.navigate("Table")
        table = page.get_by_role("table", name="Demo projects", exact=True)
        expect(table.locator("tbody tr")).to_have_count(4)
        page.get_by_role("button", name="New project", exact=True).click()
        dialog = page.get_by_role("dialog")
        name = dialog.get_by_label("New project name", exact=True)
        expect(name).to_be_focused()
        name.fill("demo-workspace")
        dialog.get_by_label("New project environment", exact=True).select_option("Preview")
        dialog.get_by_role("button", name="Create sample project", exact=True).click()
        expect(table.locator("tbody tr")).to_have_count(5)
        page.get_by_role("button", name="Open project demo-workspace", exact=True).click()
        expect(page.get_by_role("dialog")).to_contain_text("Preview")
        page.get_by_role("button", name="Close project details", exact=True).click()
        page.get_by_role("button", name="New project", exact=True).click()
        page.get_by_label("New project name", exact=True).fill("demo-workspace")
        page.get_by_role("button", name="Create sample project", exact=True).click()
        expect(page.get_by_role("alert")).to_contain_text("already exists")
        page.keyboard.press("Escape")
        page.get_by_role("button", name="Delete project demo-workspace", exact=True).click()
        page.get_by_role("button", name="Cancel", exact=True).click()
        expect(table.locator("tbody tr")).to_have_count(5)
        page.get_by_role("button", name="Delete project demo-workspace", exact=True).click()
        page.get_by_role("button", name="Confirm delete", exact=True).click()
        expect(table.locator("tbody tr")).to_have_count(4)

    def test_table_filter_search_and_sort(self):
        page = self.page
        self.navigate("Table")
        table = page.get_by_role("table", name="Demo projects", exact=True)
        page.get_by_label("Project environment filter", exact=True).select_option("Production")
        expect(table.locator("tbody tr")).to_have_count(2)
        page.get_by_label("Project environment filter", exact=True).select_option("All environments")
        page.get_by_label("Search demo projects", exact=True).fill("analytics")
        expect(table.locator("tbody tr")).to_have_count(1)
        expect(table).to_contain_text("analytics-api")
        page.get_by_label("Search demo projects", exact=True).fill("missing")
        expect(page.get_by_text("No matching projects. Try another filter.", exact=True)).to_be_visible()
        page.get_by_label("Search demo projects", exact=True).fill("")
        table.get_by_role("columnheader", name="Project", exact=True).get_by_role("button").click()
        expect(table.get_by_role("columnheader", name="Project", exact=True)).to_have_attribute("aria-sort", "descending")
        self.assertEqual(table.locator(".project-open strong").all_text_contents(), sorted(["khanomi-web","analytics-api","design-system","checkout-service"], reverse=True))

    def test_input_native_validation_and_local_submission(self):
        page = self.page
        self.navigate("Input")
        field = page.get_by_label("Email address", exact=True)
        field.fill("invalid")
        page.get_by_role("button", name="Subscribe", exact=True).click()
        self.assertFalse(field.evaluate("input => input.validity.valid"))
        expect(page.locator(".input-feedback")).to_have_count(0)
        field.fill("demo@example.com")
        page.get_by_role("button", name="Subscribe", exact=True).click()
        expect(page.locator(".input-feedback")).to_contain_text("Demo submission accepted for demo@example.com")

    def test_switch_checkbox_and_radio_preferences(self):
        page = self.page
        self.navigate("Switch & Checkbox")
        switch = page.get_by_role("switch", name="Email notifications", exact=True)
        expect(switch).to_be_checked()
        switch.click()
        expect(switch).not_to_be_checked()
        page.get_by_role("checkbox", name=re.compile("Enable sample usage analytics")).check()
        page.get_by_role("radio", name="Compact", exact=True).check()
        expect(page.locator(".preference-summary")).to_contain_text("Notifications off")
        expect(page.locator(".preference-summary")).to_contain_text("Analytics on")
        expect(page.locator(".switch-demo")).to_have_class(re.compile("density-compact"))

    def test_tabs_arrow_key_focus_and_panel_content(self):
        page = self.page
        self.navigate("Tabs")
        tablist = page.get_by_role("tablist", name="Project detail tabs", exact=True)
        tablist.get_by_role("tab", name="Overview", exact=True).focus()
        page.keyboard.press("ArrowRight")
        expect(tablist.get_by_role("tab", name="Activity", exact=True)).to_be_focused()
        expect(tablist.get_by_role("tab", name="Activity", exact=True)).to_have_attribute("aria-selected", "true")
        expect(page.get_by_text("Sample build completed", exact=True)).to_be_visible()
        page.keyboard.press("End")
        expect(page.get_by_label("Sample project name", exact=True)).to_be_visible()
        page.get_by_label("Sample project name", exact=True).fill("sample-settings")
        page.get_by_role("button", name="Save demo settings", exact=True).click()
        expect(page.locator(".toast")).to_contain_text("sample-settings")

    def test_code_preview_and_real_clipboard_copy(self):
        page = self.page
        self.context.grant_permissions(["clipboard-read", "clipboard-write"])
        self.navigate("Button")
        card = page.get_by_role("region", name="Button example", exact=True)
        card.get_by_role("tab", name="Code", exact=True).click()
        expect(card.locator("pre")).to_contain_text('<Button variant="primary">')
        card.get_by_role("button", name="Copy Button code", exact=True).click()
        expect(page.locator(".toast")).to_contain_text("Code copied to clipboard")
        text = page.evaluate("navigator.clipboard.readText()")
        self.assertIn('<Button variant="primary">Create project</Button>', text)
        card.get_by_role("tab", name="Preview", exact=True).click()
        expect(card.get_by_role("button", name="Create project", exact=True)).to_be_visible()

    def test_toasts_success_error_and_dismissal(self):
        page = self.page
        self.navigate("Toast")
        page.get_by_role("button", name="Show success", exact=True).click()
        expect(page.get_by_role("status")).to_contain_text("Sample operation completed successfully")
        page.get_by_role("button", name="Dismiss notification", exact=True).click()
        expect(page.locator(".toast")).to_have_count(0)
        page.get_by_role("button", name="Show error", exact=True).click()
        expect(page.get_by_role("alert")).to_contain_text("Sample error")

    def test_progress_advances_completes_and_resets(self):
        page = self.page
        self.navigate("Progress")
        progress = page.get_by_role("progressbar", name="Build progress", exact=True)
        for value in [60,80,100]:
            page.get_by_role("button", name="Advance", exact=True).click()
            expect(progress).to_have_attribute("value", str(value))
        expect(page.get_by_role("button", name="Advance", exact=True)).to_be_disabled()
        expect(page.get_by_text("Demo build complete", exact=True)).to_be_visible()
        expect(page.locator(".skeleton-preview")).to_have_count(0)
        page.get_by_role("button", name="Reset", exact=True).click()
        expect(progress).to_have_attribute("value", "0")

    def test_tokens_copy_and_typography_controls(self):
        page = self.page
        self.context.grant_permissions(["clipboard-read", "clipboard-write"])
        self.navigate("Design tokens")
        page.get_by_role("button", name="Copy Background color", exact=True).click()
        self.assertEqual(page.evaluate("navigator.clipboard.readText()"), "--background: #ffffff;")
        self.navigate("Typography")
        page.get_by_label("Typography specimen text", exact=True).fill("Clear by design.")
        page.get_by_label("Typography font weight", exact=True).select_option("700")
        page.get_by_label("Typography font size", exact=True).fill("32")
        expect(page.get_by_test_id("sans-specimen")).to_have_text("Clear by design.")
        expect(page.get_by_test_id("sans-specimen")).to_have_css("font-weight", "700")
        expect(page.get_by_test_id("sans-specimen")).to_have_css("font-size", "32px")

    def test_tooltip_and_native_select(self):
        page = self.page
        self.navigate("Tooltip")
        page.get_by_role("button", name="Copy sample command", exact=True).focus()
        expect(page.get_by_role("tooltip", name="Copy a sample command", exact=True)).to_be_visible()
        self.navigate("Select")
        page.get_by_label("Demo environment", exact=True).select_option("Preview")
        page.get_by_label("Demo region", exact=True).select_option("fra1")
        expect(page.locator(".selected-config")).to_contain_text("Preview configuration")
        expect(page.locator(".selected-config")).to_contain_text("fra1")

    def test_mobile_navigation_dark_theme_and_no_overflow(self):
        page = self.page
        page.set_viewport_size({"width":390,"height":844})
        self.assertFalse(page.evaluate("document.documentElement.scrollWidth > innerWidth"))
        page.get_by_role("button", name="Open navigation", exact=True).click()
        self.navigate("Table")
        expect(page.get_by_role("heading", name="Table.", exact=True)).to_be_visible()
        self.assertFalse(page.evaluate("document.documentElement.scrollWidth > innerWidth"))
        page.get_by_role("button", name="New project", exact=True).click()
        expect(page.get_by_label("New project name", exact=True)).to_be_focused()
        self.assertFalse(page.get_by_role("dialog").evaluate("el => el.scrollWidth > innerWidth"))
        page.keyboard.press("Escape")
        page.get_by_role("button", name="Switch to dark theme", exact=True).click()
        expect(page.locator("html")).to_have_attribute("data-theme", "dark")

    def test_corrupt_preferences_and_storage_failure(self):
        page = self.page
        page.evaluate(f"localStorage.setItem('{KEY}', '{{bad-json')")
        page.reload()
        expect(page.locator(".example-card")).to_have_count(5)
        expect(page.locator("html")).to_have_attribute("data-theme", "light")
        page.add_init_script("Storage.prototype.setItem=function(){throw new Error('Storage denied')}")
        page.reload()
        expect(page.get_by_role("alert")).to_contain_text("Preferences are not saved")


if __name__ == "__main__":
    unittest.main(verbosity=2)
