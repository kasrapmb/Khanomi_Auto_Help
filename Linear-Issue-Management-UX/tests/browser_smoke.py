"""Functional browser tests against the built app; starts/stops its own Vite preview."""
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
KEY = "linear-ux-study-v1"


class WorkspaceTests(unittest.TestCase):
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
        expect(self.page.locator(".issue-row")).to_have_count(16)

    def tearDown(self):
        try:
            self.assertEqual(self.errors, [], "Uncaught JavaScript errors")
            self.assertEqual(self.external_requests, [], "Unexpected third-party runtime requests")
        finally:
            self.context.close()

    def open_issue(self, issue_id):
        self.page.get_by_role("button", name=re.compile(f"^Open {issue_id}:")).click()
        return self.page.get_by_role("dialog")

    def test_create_edit_comment_persist_favorite_and_delete(self):
        page = self.page
        page.get_by_role("button", name=re.compile("^New issue")).click()
        dialog = page.get_by_role("dialog")
        expect(dialog.get_by_role("button", name="Create issue", exact=True)).to_be_disabled()
        dialog.get_by_label("Issue title", exact=True).fill("Verify checkout recovery")
        dialog.get_by_label("Issue description", exact=True).fill("Recover a failed checkout without losing the basket.")
        dialog.get_by_label("Priority", exact=True).select_option("High")
        dialog.get_by_label("Status", exact=True).select_option("In Progress")
        dialog.get_by_role("button", name="Create issue", exact=True).click()
        expect(page.locator(".issue-row")).to_have_count(17)
        dialog = self.open_issue("KHA-117")
        dialog.get_by_label("Edit issue title", exact=True).fill("Verify checkout recovery · updated")
        dialog.get_by_label("Issue status", exact=True).select_option("In Review")
        dialog.get_by_label("Issue assignee", exact=True).select_option("Nina")
        dialog.get_by_label("Issue priority", exact=True).select_option("Urgent")
        dialog.get_by_label("Issue due date", exact=True).fill("2026-12-01")
        dialog.get_by_label("Write a comment", exact=True).fill("Ready for a focused review.")
        dialog.get_by_role("button", name="Post comment", exact=True).click()
        expect(dialog.get_by_text("Ready for a focused review.", exact=True)).to_be_visible()
        dialog.get_by_role("button", name="Add to favorites", exact=True).click()
        dialog.get_by_role("button", name="Close details", exact=True).click()
        page.reload()
        dialog = self.open_issue("KHA-117")
        expect(dialog.get_by_label("Edit issue title", exact=True)).to_have_value("Verify checkout recovery · updated")
        expect(dialog.get_by_label("Issue status", exact=True)).to_have_value("In Review")
        expect(dialog.get_by_label("Issue assignee", exact=True)).to_have_value("Nina")
        expect(dialog.get_by_label("Issue priority", exact=True)).to_have_value("Urgent")
        expect(dialog.get_by_label("Issue due date", exact=True)).to_have_value("2026-12-01")
        expect(dialog.get_by_text("Ready for a focused review.", exact=True)).to_be_visible()
        dialog.get_by_role("button", name="Close details", exact=True).click()
        page.get_by_role("button", name="Favorites", exact=True).click()
        expect(page.locator(".issue-row")).to_have_count(2)
        self.open_issue("KHA-117")
        page.once("dialog", lambda confirm: confirm.accept())
        page.get_by_role("button", name="Delete issue", exact=True).click()
        page.reload()
        self.assertNotIn("KHA-117", page.evaluate(f"localStorage.getItem('{KEY}')"))

    def test_search_filters_sort_and_collapse(self):
        page = self.page
        page.get_by_label("Filter issues by text", exact=True).fill("tooltip")
        expect(page.locator(".issue-row")).to_have_count(1)
        expect(page.locator(".issue-row")).to_contain_text("KHA-114")
        page.get_by_label("Filter issues by text", exact=True).fill("does not exist")
        expect(page.get_by_role("heading", name="No issues found")).to_be_visible()
        page.get_by_label("Filter issues by text", exact=True).fill("")
        page.locator("summary").click()
        page.get_by_label("Filter by status", exact=True).select_option("Todo")
        page.get_by_label("Filter by priority", exact=True).select_option("High")
        expect(page.locator(".issue-row")).to_have_count(2)
        page.get_by_role("button", name="Clear filters", exact=True).first.click()
        page.locator("summary").click()
        page.get_by_label("Sort issues", exact=True).select_option("Priority")
        expect(page.locator(".issue-row").first).to_contain_text("KHA-104")
        group = page.locator(".issue-group").first
        group.locator(".group-heading button").first.click()
        expect(group.locator(".issue-row")).to_have_count(0)
        group.locator(".group-heading button").first.click()
        expect(group.locator(".issue-row")).to_have_count(4)

    def test_board_drag_and_drop_persists(self):
        page = self.page
        page.get_by_role("button", name="Board", exact=True).click()
        expect(page.locator(".issue-card")).to_have_count(16)
        card = page.get_by_role("button", name=re.compile("^Open KHA-111:"))
        card.drag_to(page.get_by_role("region", name="Todo column", exact=True).locator(".board-heading"))
        expect(page.get_by_role("region", name="Todo column", exact=True).get_by_role("button", name=re.compile("^Open KHA-111:"))).to_be_visible()
        page.reload()
        issue = next(issue for issue in json.loads(page.evaluate(f"localStorage.getItem('{KEY}')")) if issue["id"] == "KHA-111")
        self.assertEqual(issue["status"], "Todo")

    def test_navigation_projects_and_inbox(self):
        page = self.page
        page.get_by_role("button", name=re.compile("^My issues")).click()
        expect(page.locator(".issue-row")).to_have_count(3)
        page.get_by_role("button", name=re.compile("^Projects")).click()
        expect(page.locator(".project-card")).to_have_count(3)
        page.locator(".project-card").filter(has_text="Analytics & insights").click()
        expect(page.locator(".issue-row")).to_have_count(3)
        self.open_issue("KHA-106")
        page.get_by_label("Write a comment", exact=True).fill("A useful insight for the team")
        page.get_by_role("button", name="Post comment", exact=True).click()
        page.get_by_role("button", name="Close details", exact=True).click()
        page.get_by_role("button", name="Open inbox", exact=True).click()
        expect(page.locator(".inbox-entry")).to_have_count(1)
        page.locator(".inbox-entry").click()
        expect(page.get_by_label("Edit issue title", exact=True)).to_have_value("Create reusable chart color tokens")

    def test_keyboard_search_dialog_focus_and_escape(self):
        page = self.page
        page.keyboard.press("Control+k")
        search = page.get_by_role("textbox", name="Search workspace", exact=True)
        expect(search).to_be_focused()
        search.fill("KHA-104")
        page.keyboard.press("Enter")
        expect(page.get_by_label("Edit issue title", exact=True)).to_have_value("Reduce initial dashboard load time")
        page.keyboard.press("Escape")
        expect(page.get_by_role("dialog")).to_have_count(0)
        page.locator("body").click(position={"x": 1200, "y": 15})
        page.keyboard.press("c")
        expect(page.get_by_label("Issue title", exact=True)).to_be_focused()
        page.keyboard.press("Escape")
        expect(page.get_by_role("dialog")).to_have_count(0)

    def test_mobile_navigation_detail_and_no_page_overflow(self):
        page = self.page
        page.set_viewport_size({"width": 390, "height": 844})
        self.assertFalse(page.evaluate("document.documentElement.scrollWidth > innerWidth"))
        page.get_by_role("button", name="Open navigation", exact=True).click()
        page.get_by_role("button", name=re.compile("^My issues")).click()
        expect(page.get_by_role("heading", name="My issues.", exact=True)).to_be_visible()
        expect(page.locator(".issue-row")).to_have_count(3)
        self.open_issue("KHA-102")
        expect(page.get_by_label("Edit issue title", exact=True)).to_be_visible()
        self.assertFalse(page.get_by_role("dialog").evaluate("el => el.scrollWidth > innerWidth"))
        page.get_by_role("button", name="Close details", exact=True).click()

    def test_corrupt_cache_falls_back_to_seed(self):
        page = self.page
        page.evaluate(f"localStorage.setItem('{KEY}', '{{not-json')")
        page.reload()
        expect(page.locator(".issue-row")).to_have_count(16)
        self.assertEqual(len(json.loads(page.evaluate(f"localStorage.getItem('{KEY}')"))), 16)
        page.evaluate(f"""() => {{
          const issues = JSON.parse(localStorage.getItem('{KEY}'));
          issues[0].createdAt = 'invalid date';
          localStorage.setItem('{KEY}', JSON.stringify(issues));
        }}""")
        page.reload()
        expect(page.locator(".issue-row")).to_have_count(16)
        self.assertEqual(json.loads(page.evaluate(f"localStorage.getItem('{KEY}')"))[0]["createdAt"], "2026-11-02T08:00:00+03:30")

    def test_storage_failure_shows_unsaved_warning(self):
        self.page.add_init_script("Storage.prototype.setItem = function () { throw new Error('Storage unavailable'); }")
        self.page.reload()
        expect(self.page.get_by_role("alert")).to_contain_text("Changes will be lost")
        expect(self.page.get_by_text("Changes are not saved", exact=True)).to_be_visible()
        expect(self.page.locator(".issue-row")).to_have_count(16)


if __name__ == "__main__":
    unittest.main(verbosity=2)
