import { test, expect, request } from "@playwright/test";
import tags from "../test-data/tags.json";
import articles from "../test-data/articles.json";

test.beforeEach(async ({ page }) => {
  /* When we want to create a mock, we need to configure it inside 
    of the playwright framework before browser make a call to a certain API.
    Otherwise playwright will not know which API should be intercepted.*/

  await page.route("*/**/api/tags", async (route) => {
    await route.fulfill({
      body: JSON.stringify(tags),
    });
  });

  await page.goto("https://conduit.bondaracademy.com/");
  
});

test("has title", async ({ page }) => {
  await page.route(
    "*/**/api/articles?limit=10&offset=0", //in this line we intercept the url
    async (route) => {
      const response = await route.fetch(); //doing this we tell to Playwright to complete api call and return the result
      const responseBody = await response.json();
      responseBody.articles[0].title = "This is a MOCK test title";
      responseBody.articles[0].description = "This is a MOCK test description";

      await route.fulfill({
        body: JSON.stringify(responseBody),
      });
    }
  );

  await page.getByText("Global Feed").click();
  await expect(page.locator(".navbar-brand")).toHaveText("conduit");
  await expect(page.locator("app-article-list h1").first()).toContainText(
    "This is a MOCK test title"
  );
  await expect(page.locator("app-article-list p").first()).toContainText(
    "This is a MOCK test description"
  );
});

test("delete article", async ({ page, request }) => {
  
  //Step 2 - Create Article using credential we got before

  const articleResponse = await request.post(
    "https://conduit-api.bondaracademy.com/api/articles/",
    {
      data: {
        article: {
          title: "New article using automation",
          description: "New article created through Playwright automation",
          body: "Testing with Playwright",
          tagList: ["Playwright"],
        },
      },
    }
  );
  expect(articleResponse.status()).toEqual(201);

  //Step 3 - Delete the article

  await page.getByText("Global Feed").click();
  await page.getByText("New article using automation").click();
  await page.getByRole("button", { name: "Delete Article" }).first().click();

  //Step 4 - Check that the article was deletes

  await page.getByText("New article using automation").click();
  await expect(page.locator("app-article-list").first()).not.toHaveText(
    "New article using automation"
  );
});

test("create article", async ({ page, request }) => {
  await page.locator(".nav-link", { hasText: "New Article" }).click();
  await page.getByPlaceholder("Article Title").fill("Article Name");
  await page
    .getByPlaceholder("What's this article about?")
    .fill("Article subject");
  await page
    .getByPlaceholder("Write your article (in markdown)")
    .fill("Article Subscription");
  await page.getByRole("button", { name: "Publish Article" }).click();

  const articleResponse = await page.waitForResponse(
    "https://conduit-api.bondaracademy.com/api/articles/"
  );
  const articleResponseBody = await articleResponse.json();
  const slugId = articleResponseBody.article.slug;

  await expect(page.locator("app-article-page h1")).toHaveText("Article Name");

  await page.locator(".nav-link", { hasText: "Home" }).click();
  await page.locator(".nav-link", { hasText: "Global Feed" }).click();

  await expect(page.locator("app-article-preview h1").first()).toHaveText(
    "Article Name"
  );


  const deleteArticleResponse = await request.delete(
    `https://conduit-api.bondaracademy.com/api/articles/${slugId}`);
  expect(deleteArticleResponse.status()).toEqual(204);
});
