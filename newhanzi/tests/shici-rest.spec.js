// 古诗区收尾（2026-11-07 SC1）：A22-12 画中有诗、A22-14 飞花令/回流深链、A19 scroll 水墨长卷
const { test, expect } = require('@playwright/test');

test.describe('shici-rest', () => {
  test('A22-12 huazhong quiz shows final frame without caption, 4 options', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/games/shici/huazhong.html');
    const start = page.locator('[data-mode="hua"], .qz-mode, #qzStart').first();
    if (await start.count()) { try { await start.click({ timeout: 3000 }); } catch (e) {} }
    await expect(page.locator('.qz-wb svg').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.qz-opts .qz-btn')).toHaveCount(4);
    // 定格画：无页签/播放条/字幕
    await expect(page.locator('.qz-wb .wb-ctl')).toHaveCount(0);
    await expect(page.locator('.qz-wb .wb-tabs')).toHaveCount(0);
    // 板顶句字已藏（选项里任何一句都不应作为可见文字出现在画里）
    const opts = await page.locator('.qz-opts .qz-btn').allTextContents();
    const visibleText = await page.locator('.qz-wb svg').evaluate((svg) =>
      Array.from(svg.querySelectorAll('text')).filter((t) => {
        let n = t; while (n && n !== svg) { if (n.style && n.style.display === 'none') return false; n = n.parentNode; }
        return true;
      }).map((t) => t.textContent).join('|'));
    for (const o of opts) expect(visibleText.includes(o)).toBe(false);
    await page.locator('.qz-opts .qz-btn').first().click();
    await expect(page.locator('#qfb')).toBeVisible();
    expect(errors).toEqual([]);
  });
});
