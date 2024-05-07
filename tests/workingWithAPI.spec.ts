import { test, expect } from "@playwright/test";
import tags from "../test-data/tags.json";

test.beforeEach(async ({ page }) => {
  /* When we want to create a mock, we need to configure it inside 
    of the playwright framework before browser make a call to a certain API.
    Otherwise playwright will not know which API should be intercepted.*/

  await page.route(
    "*/**/api/tags",
    async (route) => {
      await route.fulfill({
        body: JSON.stringify(tags),
      });
    }
  );
  await page.goto("https://conduit.bondaracademy.com/");
  await page.waitForTimeout(500);
});

test("first test", async ({ page }) => {
  await expect(page.locator(".navbar-brand")).toHaveText("conduit");
});
