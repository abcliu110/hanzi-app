// 逻辑区补齐（2026-11-07 luoji-rest）：逻辑一分钟（A22-8）及后续白板入口
const { test, expect } = require('@playwright/test');

async function pool(page) {
  return page.evaluate(() => window.NHZ_LOGIC_DAILY.items);
}

test.describe('logic daily one-minute (A22-8)', () => {
  test('rotates by date, wrong answer goes to review, answered state persists', async ({ page }) => {
    await page.clock.setFixedTime(new Date(2026, 10, 7, 9, 0, 0));
    await page.goto('newhanzi/games/luoji/daily.html');
    const items = await pool(page);
    expect(items.length).toBeGreaterThanOrEqual(30);
    const dayNum = Math.floor(Date.UTC(2026, 10, 7) / 86400000);
    const it = items[dayNum % items.length];
    await expect(page.locator('#sent')).toHaveText(it.s);
    await expect(page.locator('#btns .btn')).toHaveCount(3);
    // 点一个错的
    const wrong = it.opts.find((o) => o !== it.a);
    await page.locator('#btns .btn', { hasText: wrong }).first().click();
    await expect(page.locator('#fb')).toContainText('错题本');
    await expect(page.locator('#expl')).toBeVisible();
    await expect(page.locator('#btns .btn.ok')).toHaveText(it.a);
    const st = await page.evaluate(() => ({
      wrong: JSON.parse(localStorage.getItem('nhz_wrong') || '[]'),
      log: JSON.parse(localStorage.getItem('nhz_logic_daily') || '{}')
    }));
    expect(st.wrong.some((w) => w.q.indexOf(it.s) >= 0 && w.answer === it.a && w.point === it.point)).toBe(true);
    expect(st.log['2026-11-07']).toMatchObject({ ok: false, pick: wrong });
    // 同一天再打开：保持已答状态，按钮不可再点
    await page.reload();
    await expect(page.locator('#btns .btn').first()).toBeDisabled();
    await expect(page.locator('#fb')).toContainText('今天这句');
    // 专题直达链接
    await expect(page.locator('#more')).toHaveAttribute('href', new RegExp('point=' + encodeURIComponent(it.point).replace(/[()]/g, '\\$&')));
  });

  test('consecutive days do not repeat within the pool', async ({ page }) => {
    const seen = new Set();
    let n = 0;
    for (let d = 1; d <= 5; d++) {
      await page.clock.setFixedTime(new Date(2026, 10, d, 9, 0, 0));
      await page.goto('newhanzi/games/luoji/daily.html');
      seen.add(await page.locator('#sent').textContent());
      n++;
    }
    expect(seen.size).toBe(n);
  });

  test('home card shows today status and links to the daily page', async ({ page }) => {
    await page.clock.setFixedTime(new Date(2026, 10, 7, 9, 0, 0));
    await page.goto('newhanzi/index.html');
    const card = page.locator('#view-home #logicDailyCard');
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('href', 'games/luoji/daily.html');
    await expect(page.locator('#ldStatus')).toContainText('还没做');
    await page.evaluate(() => localStorage.setItem('nhz_logic_daily', JSON.stringify({ '2026-11-07': { i: 0, ok: true, pick: 'x' } })));
    await page.reload();
    await expect(page.locator('#ldStatus')).toContainText('答对了');
  });

  for (const w of [768, 1280]) {
    test('daily page no horizontal overflow at ' + w, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      const errs = [];
      page.on('pageerror', (e) => errs.push(String(e)));
      await page.goto('newhanzi/games/luoji/daily.html');
      await expect(page.locator('#btns .btn')).toHaveCount(3);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(over).toBeLessThanOrEqual(0);
      expect(errs).toEqual([]);
    });
  }
});

test.describe('logic whiteboards added 2026-11-07 (luoji-rest)', () => {
  const cases = [['隐含前提', 4, '查一查']];
  for (const [name, n, tab] of cases) {
    test('whiteboard ' + name, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto('newhanzi/index.html');
      await page.locator('#view-home .panel[data-m="logic"]').click();
      await page.locator('#logiclist .yw-head', { hasText: name }).first().click({ timeout: 20000 });
      const wb = page.locator('#logiclist .yw-wb[data-lwb="' + name + '"]');
      await wb.locator('[data-lwb-start]').click();
      await expect(wb.locator('svg').first()).toBeVisible({ timeout: 10000 });
      await expect(wb.locator('.wb-tabs button')).toHaveCount(n);
      await expect(wb.locator('.wb-tabs')).toContainText(tab);
      expect(errors).toEqual([]);
    });
  }
});
