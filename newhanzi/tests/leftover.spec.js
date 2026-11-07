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

  test('logic 假言推理四式 gets 十五贯 whiteboard + fanpai (A-16)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/index.html');
    await page.locator('#view-home .panel[data-m="logic"]').click();
    const name = '假言推理四式';
    await page.locator('#logiclist .yw-head', { hasText: name }).first().click({ timeout: 20000 });
    const wb = page.locator('#logiclist .yw-wb[data-lwb="' + name + '"]');
    await wb.locator('[data-lwb-start]').click();
    await expect(wb.locator('svg').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#logiclist a[href="games/luoji/fanpai.html"]').first()).toBeAttached();
    expect(errors).toEqual([]);
  });
});
