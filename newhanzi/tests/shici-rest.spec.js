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
  test('A22-14 feihua double/pos modes, clause positions, full list on give-up', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/games/shici/feihua.html');
    // 数据桥：指定位置令按分句判位置（一联两句的行不跨分句数）
    const r = await page.evaluate(() => ({
      src: FEIHUA.src,
      endOk: FEIHUA.okPos('人之初，性本善。', '善', '末'),
      crossBad: FEIHUA.okPos('人之初，性本善。', '性', '4'),
      third: FEIHUA.okPos('江清月近人', '月', '3'),
      dbl: FEIHUA.okDouble('二月春风似剪刀', '春', '风'),
      posAllOk: FEIHUA.bankPos('月', '末').every((x) => x.v.split(/[，。！？；：]/).some((c) => c.trim().endsWith('月')))
    }));
    expect(r).toEqual({ src: '诗库', endOk: true, crossBad: false, third: true, dbl: true, posAllOk: true });
    // 双字令：出一句合规的，AI 接句且不重复；认输后展示本令全部句子并带深链
    await page.locator('.mode-btn[data-mode="double"]').click();
    await page.locator('#pairGrid .kw-btn', { hasText: '明月' }).click();
    await page.locator('#btnStart').click();
    await page.locator('#verseInput').fill('明月松间照');
    await page.locator('#btnSend').click();
    await expect(page.locator('#log .msg.ai')).toHaveCount(2, { timeout: 5000 });
    const aiLine = await page.locator('#log .msg.ai').nth(1).locator('div').nth(1).textContent();
    expect(aiLine.replace(/[，。！？]/g, '')).not.toBe('明月松间照');
    await page.locator('#btnGiveUp').click();
    await expect(page.locator('#fullBox')).toBeVisible();
    await expect(page.locator('#fullTitle')).toContainText(/诗库（\d+ 首）/);
    expect(await page.locator('#fullList li').count()).toBeGreaterThan(5);
    expect(await page.locator('#fullList a[href*="shici.html#poem-"]').count()).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });

  test('A22-14 jichu games deep-link back to poem detail', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/games/shici/jichu/yuefu.html');
    const r = await page.evaluate(() => ({
      cl: POEM_LINK.orderFor(null, '长歌行', ''),
      none: POEM_LINK.orderFor(null, '十五从军征', ''),
      jys: POEM_LINK.href('床前明月光', '静夜思', '李白')
    }));
    expect(r.cl).toBeGreaterThan(0);
    expect(r.none).toBeNull();
    expect(r.jys).toMatch(/shici\.html#poem-\d+$/);
    // 深链落地：诗详情打开对应的诗
    await page.goto('newhanzi/shici.html#poem-' + r.cl);
    await expect(page.locator('body')).toContainText('长歌行', { timeout: 10000 });
    expect(errors).toEqual([]);
  });
});
