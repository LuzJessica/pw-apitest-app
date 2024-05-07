import { test, expect } from '@playwright/test';

test.beforeEach(async ({page}) => {
    await page.goto('https://conduit.bondaracademy.com/')
})

test('first test', async ({page}) => {
    await expect(page.locator('.navbar-brand')).toHaveText('conduit');
})