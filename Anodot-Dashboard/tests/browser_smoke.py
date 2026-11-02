"""Functional tests of the independent local implementation; no Anodot traffic."""
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
import unittest
import urllib.request
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]

class DashboardTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        cls.base = f'http://127.0.0.1:{port}/'
        cls.server = subprocess.Popen(['python3', '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        cls.addClassCleanup(cls.stop_server)
        for _ in range(50):
            try:
                urllib.request.urlopen(cls.base, timeout=1).close()
                break
            except OSError:
                time.sleep(.1)
        else:
            raise RuntimeError('Test server not ready')
        cls.p = sync_playwright().start()
        cls.addClassCleanup(cls.p.stop)
        cls.browser = cls.p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), headless=True, args=['--no-sandbox'])
        cls.addClassCleanup(cls.browser.close)

    @classmethod
    def stop_server(cls):
        cls.server.terminate()
        cls.server.wait(timeout=5)

    def setUp(self):
        self.context = self.browser.new_context(viewport={'width': 1440, 'height': 1100})
        self.addCleanup(self.context.close)
        self.page = self.context.new_page()
        self.errors = []
        self.external = []
        self.page.on('pageerror', lambda e: self.errors.append(str(e)))
        self.page.on('request', lambda r: self.external.append(r.url) if not r.url.startswith(self.base) else None)
        self.page.goto(self.base)
        expect(self.page.locator('tbody tr')).to_have_count(6)

    def tearDown(self):
        self.assertEqual(self.errors, [])
        self.assertEqual(self.external, [])

    def test_overview_and_investigation(self):
        p = self.page
        expect(p.get_by_role('heading', name='Every signal. In focus.')).to_be_visible()
        expect(p.locator('.charts svg')).to_have_count(3)
        p.get_by_role('button', name='Investigate Revenue', exact=True).click()
        d = p.get_by_role('dialog')
        expect(d.get_by_role('heading', name='Revenue', exact=True)).to_be_visible()
        expect(d.locator('.related')).to_have_count(4)
        expect(d).to_contain_text('does not establish a root cause')
        d.get_by_role('button', name='API latency').click()
        expect(p.get_by_role('dialog').get_by_role('heading', name='API latency', exact=True)).to_be_visible()
        p.keyboard.press('Escape')
        expect(p.get_by_role('dialog')).to_have_count(0)

    def test_filter_and_export(self):
        p = self.page
        p.get_by_label('Search anomalies').fill('revenue')
        expect(p.locator('tbody tr')).to_have_count(1)
        with p.expect_download() as info:
            p.get_by_role('button', name='Export CSV').click()
        text = Path(info.value.path()).read_text()
        self.assertIn('Revenue', text)
        self.assertEqual(len(text.splitlines()), 2)
        p.get_by_label('Search anomalies').fill('no matching metric')
        expect(p.locator('tbody')).to_contain_text('No anomalies match')
        p.get_by_label('Search anomalies').fill('')
        p.get_by_label('Filter severity').select_option('Warning')
        expect(p.locator('tbody .badge')).to_have_count(1)
        for badge in p.locator('tbody .badge').all():
            expect(badge).to_contain_text('Warning')

    def test_triage_persistence_rules_and_reset(self):
        p = self.page
        p.get_by_role('button', name='Investigate Revenue', exact=True).click()
        p.get_by_label('Alert status').select_option('Resolved')
        p.keyboard.press('Escape')
        expect(p.locator('.kpis article').first).to_contain_text('5')
        p.reload()
        expect(p.locator('tbody tr').filter(has_text='Revenue').locator('.status')).to_have_text('Resolved')
        p.get_by_role('button', name='Settings', exact=True).click()
        p.get_by_label('Sensitivity').select_option('4')
        p.reload()
        p.get_by_role('button', name='Settings', exact=True).click()
        expect(p.get_by_label('Sensitivity')).to_have_value('4')
        p.get_by_role('button', name='Reset local settings').click()
        expect(p.get_by_label('Sensitivity')).to_have_value('3')
        p.get_by_role('button', name='Alerts', exact=True).click()
        expect(p.locator('tbody .status').filter(has_text='Open')).to_have_count(6)

    def test_corrupt_storage_and_mobile(self):
        p = self.page
        p.evaluate("localStorage.setItem('signal-anodot-study-v1','broken')")
        p.reload()
        expect(p.locator('tbody tr')).to_have_count(6)
        p.set_viewport_size({'width': 390, 'height': 844})
        self.assertTrue(p.evaluate('document.documentElement.scrollWidth <= innerWidth'))
        p.get_by_role('button', name='Anomalies', exact=True).click()
        expect(p.get_by_role('heading', name='Anomalies', exact=True)).to_be_visible()
        p.get_by_role('button', name='Revenue', exact=True).click()
        expect(p.get_by_role('dialog')).to_be_visible()
        self.assertTrue(p.evaluate('document.documentElement.scrollWidth <= innerWidth'))

    def test_storage_failure_is_reported(self):
        p = self.page
        p.evaluate("() => { Storage.prototype.setItem = () => {throw new Error('blocked')}; }")
        p.get_by_role('button', name='Settings', exact=True).click()
        p.get_by_label('Sensitivity').select_option('2')
        expect(p.get_by_role('alert')).to_contain_text('could not be saved')

if __name__ == '__main__':
    unittest.main(verbosity=2)
