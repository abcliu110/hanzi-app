// LEFTOVER 2026-11-07：盘点后 A 类小修的回归用例
const { test, expect } = require('@playwright/test');

test.describe('leftover 2026-11-07', () => {
  test('quiz next button hidden until answered (A-04)', async ({ page }) => {
    await page.goto('newhanzi/quiz/index.html?tab=zika');
    await page.locator('.qz-mode[data-mode="choice"]').first().click();
    const next = page.locator('#btnNext');
    await expect(page.locator('.qz-opts .qz-btn').first()).toBeVisible();
    await expect(next).toBeHidden();
    await page.locator('.qz-opts .qz-btn').first().click();
    await expect(next).toBeVisible();
  });
});
