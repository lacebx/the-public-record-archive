import { test, expect } from "@playwright/test";

test.describe("Public Internet Record — smoke tests", () => {
  test("homepage loads with today's snapshot", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Permanent Historical Archive")).toBeVisible();
    await expect(page.locator("text=Today")).toBeVisible();
    await expect(page.locator("text=Recently Archived")).toBeVisible();
  });

  test("browse page loads and displays records", async ({ page }) => {
    await page.goto("/browse");
    await expect(page.locator("text=Browse Records")).toBeVisible();
    const rows = page.locator("tbody tr");
    await expect(rows.first()).toBeVisible();
  });

  test("browse category filter works", async ({ page }) => {
    await page.goto("/browse?category=News");
    await expect(page.locator("text=Showing")).toBeVisible();
  });

  test("search page loads and shows prompt", async ({ page }) => {
    await page.goto("/search");
    await expect(page.locator("text=Search Archive")).toBeVisible();
    await expect(page.locator("text=Enter a query above")).toBeVisible();
  });

  test("search returns results", async ({ page }) => {
    await page.goto("/search?q=test");
    await expect(page.locator("text=result")).toBeVisible();
  });

  test("snapshots page loads", async ({ page }) => {
    await page.goto("/snapshots");
    await expect(page.locator("text=Snapshots")).toBeVisible();
  });

  test("snapshot detail page loads", async ({ page }) => {
    await page.goto("/snapshots");
    const link = page.locator("a").filter({ hasText: /\d{4}-\d{2}-\d{2}/ });
    if ((await link.count()) > 0) {
      const href = await link.first().getAttribute("href");
      if (href) {
        await page.goto(href);
        await expect(page.locator("text=Snapshot")).toBeVisible();
      }
    }
  });

  test("record detail page shows record", async ({ page }) => {
    await page.goto("/browse");
    const recordLink = page.locator("tbody tr a").first();
    if ((await recordLink.count()) > 0) {
      const href = await recordLink.getAttribute("href");
      if (href) {
        await page.goto(href);
        await expect(page.locator("text=Record Identifier")).toBeVisible();
      }
    }
  });

  test("API documentation page loads", async ({ page }) => {
    await page.goto("/api");
    await expect(page.locator("text=API Documentation")).toBeVisible();
  });

  test("API playground loads", async ({ page }) => {
    await page.goto("/api/playground");
    await expect(page).toHaveTitle(/Scalar/);
  });

  test("health endpoint returns expected fields", async ({ page }) => {
    const response = await page.goto("/api/v1/health");
    expect(response?.ok()).toBeTruthy();
    const text = await response?.text();
    expect(text).toContain("status");
  });

  test("snapshots API endpoint returns data", async ({ page }) => {
    const response = await page.goto("/api/v1/snapshots");
    expect(response?.ok()).toBeTruthy();
    const text = await response?.text();
    expect(text).toContain("snapshots");
  });

  test("openapi.json is accessible", async ({ page }) => {
    const response = await page.goto("/openapi.json");
    expect(response?.ok()).toBeTruthy();
    const text = await response?.text();
    expect(text).toContain("openapi");
  });

  test("compare page loads with selectors", async ({ page }) => {
    await page.goto("/compare");
    await expect(page.locator("text=Compare Snapshots")).toBeVisible();
  });

  test("documentation page loads", async ({ page }) => {
    await page.goto("/documentation");
    await expect(page.locator("text=Documentation")).toBeVisible();
  });

  test("about page loads", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("text=About")).toBeVisible();
  });

  test("navigation links are present", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav");
    await expect(nav.locator("text=Browse")).toBeVisible();
    await expect(nav.locator("text=Search")).toBeVisible();
    await expect(nav.locator("text=Snapshots")).toBeVisible();
    await expect(nav.locator("text=API")).toBeVisible();
    await expect(nav.locator("text=Documentation")).toBeVisible();
    await expect(nav.locator("text=About")).toBeVisible();
  });

  test("footer links are present", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Public Internet Record")).toBeVisible();
  });

  test("404 page shows for unknown routes", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.locator("text=404")).toBeVisible();
  });
});
