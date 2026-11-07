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
  test('guwen shici same-name item has no guyin whiteboard (A-09)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/guwen.html');
    await page.locator('[data-mod="yufa"]').first().click();
    await page.locator('[data-ysub="m:shici"]').first().click();
    await page.locator('#gwMItems .yw-head').filter({ has: page.getByText('去', { exact: true }) }).first().click();
    await expect(page.locator('#gwmdetail')).toBeVisible();
    await expect(page.locator('#gwmdetail [data-gwwb]')).toHaveCount(0);
    await page.goto('newhanzi/guwen.html');
    await page.locator('[data-mod="yufa"]').first().click();
    await page.locator('[data-ysub="m:guyin"]').first().click();
    await page.locator('#gwMItems .yw-head', { hasText: '去' }).first().click();
    await expect(page.locator('#gwmdetail [data-gwwb]')).toHaveAttribute('data-gwwb', '古文:去');
    expect(errors).toEqual([]);
  });
});
