const { chromium } = require("playwright-core");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { join } = require("node:path");
const output = fs.mkdtempSync(
  join(require("node:os").tmpdir(), "polar-smoke-"),
);

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.BASE_URL || "http://127.0.0.1:4173");
    await page
      .getByRole("heading", { name: "Business overview", exact: true })
      .waitFor();
    const initial = await page.locator(".kpi-value").first().innerText();
    await page.getByLabel("Date range").selectOption("7");
    assert.notEqual(
      await page.locator(".kpi-value").first().innerText(),
      initial,
    );
    await page.getByLabel("Channel filter").selectOption("Meta Ads");
    assert.equal(await page.locator("tbody tr").count(), 1);
    await page.getByRole("button", { name: "Reports", exact: true }).click();
    await page.getByLabel("Report metric").selectOption("profit");
    await page.getByLabel("Report dimension").selectOption("date");
    assert.equal(
      await page
        .getByRole("table", { name: "Custom report results" })
        .locator("tbody tr")
        .count(),
      7,
    );
    await page.getByLabel("Report name", { exact: true }).fill("Weekly profit");
    await page
      .getByRole("button", { name: "Save report", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Rename Weekly profit", exact: true })
      .click();
    await page
      .getByLabel("New report name", { exact: true })
      .fill("Profit review");
    await page.getByLabel("Confirm report rename").click();
    await page.reload();
    await page.getByRole("button", { name: "Reports", exact: true }).click();
    await page
      .getByRole("button", { name: /Profit review Net profit by date/ })
      .click();
    assert.equal(await page.getByLabel("Report metric").inputValue(), "profit");
    assert.equal(
      await page.getByLabel("Report dimension").inputValue(),
      "date",
    );
    // Global filters remain current; stored configurations do not restore old data scopes.
    await page.getByLabel("Date range").selectOption("7");
    await page.getByLabel("Channel filter").selectOption("Meta Ads");
    const downloadEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export custom report" }).click();
    const download = await downloadEvent;
    await download.saveAs(join(output, "polar-custom-report.csv"));
    const csv = fs.readFileSync(
      join(output, "polar-custom-report.csv"),
      "utf8",
    );
    assert.equal(csv.split("\r\n").length, 9);
    assert.match(csv, /Net profit/);
    assert.match(csv, /Total/);
    await page.screenshot({
      path: join(output, "polar-reports-v2.png"),
      fullPage: true,
      animations: "disabled",
    });
    await page
      .getByRole("button", { name: "Delete Profit review", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Delete Profit review", exact: true })
        .count(),
      0,
    );
    await page
      .getByRole("button", { name: "Goals & alerts", exact: true })
      .click();
    await page
      .getByLabel("Monthly net revenue target", { exact: true })
      .fill("1000000");
    await page.getByLabel("Minimum profit margin", { exact: true }).fill("99");
    await page.getByRole("button", { name: "Save goals", exact: true }).click();
    assert.ok(
      (await page.getByText("Needs attention", { exact: true }).count()) >= 2,
    );
    await page.reload();
    await page
      .getByRole("button", { name: "Goals & alerts", exact: true })
      .click();
    assert.equal(
      await page
        .getByLabel("Monthly net revenue target", { exact: true })
        .inputValue(),
      "1000000",
    );
    assert.equal(
      await page
        .getByLabel("Minimum profit margin", { exact: true })
        .inputValue(),
      "99",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel("Open navigation").click();
    await page.getByRole("button", { name: "Reports", exact: true }).click();
    await page
      .getByRole("heading", { name: "Build a management report" })
      .waitFor();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
    await page.screenshot({
      path: join(output, "polar-mobile-v2.png"),
      fullPage: true,
      animations: "disabled",
    });
    await page.evaluate(() => {
      localStorage.setItem("polar-demo.management-reports.v1", "{broken");
      localStorage.setItem("polar-demo-goals-v1", "{broken");
    });
    await page.reload();
    await page.getByLabel("Open navigation").click();
    await page.getByRole("button", { name: "Reports", exact: true }).click();
    await page
      .getByRole("heading", { name: "Build a management report" })
      .waitFor();
    assert.deepEqual(errors, []);
    console.log("Artifacts: " + output);
    console.log(
      "PASS: period/channel scope, report grouping/metric, save/rename/load/delete after reload, CSV content, goals and alert triggering/persistence, corrupt storage, mobile no overflow, zero page errors",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
