// 古文 2026-11-07 guwen-rest 线：P2-C 遗留图示、进阶路线、逐字今译、学段字段等（独立文件，不进 smoke 的 serial 链）
const { test, expect } = require('@playwright/test');

async function openYufaItem(page, group, name) {
  await page.goto('newhanzi/guwen.html');
  await page.locator('[data-mod="yufa"]').first().click();
  await page.locator('[data-ysub="g:' + group + '"]').first().click();
  await page.locator('#gwMItems .yw-head', { hasText: name }).first().click();
}

test.describe('guwen-rest', () => {
  test('P2-C daozhuang four sub-points have block diagrams; 宾语 block is 何陋', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    for (const n of ['宾语前置', '定语后置', '状语后置', '主谓倒装']) {
      await openYufaItem(page, '特殊句式', n);
      await expect(page.locator('#gwmdetail .yw-diagram svg[aria-label^="' + n + '图解"]')).toHaveCount(1);
    }
    await openYufaItem(page, '句子成分', '宾语');
    await expect(page.locator('#gwmdetail .yw-diagram svg')).toContainText('何陋');
    expect(errors).toEqual([]);
  });
});
