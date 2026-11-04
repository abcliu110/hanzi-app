const { test, expect } = require('@playwright/test');

const PAGES = [
  'newhanzi/index.html',
  'newhanzi/zika.html?zi=%E5%A4%A9',
  'newhanzi/fuxi.html',
  'newhanzi/yuwen.html',
  'newhanzi/bushou.html',
  'newhanzi/shici.html',
  'newhanzi/guwen.html',
  'newhanzi/quiz/index.html',
  'newhanzi/weekly.html',
  'newhanzi/share.html',
  'newhanzi/yuedu-xiezuo.html'
];

function isNoiseConsole(text) {
  // 静态服偶发连接拒绝、以及浏览器对缺失 favicon 的噪音
  return /ERR_CONNECTION_REFUSED|favicon\.ico|net::ERR_ABORTED/i.test(text);
}

test.describe.configure({ mode: 'serial' });

test.describe('newhanzi smoke', () => {
  for (const path of PAGES) {
    test(`opens ${path} without page errors`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (msg) => {
        if (msg.type() === 'error' && !isNoiseConsole(msg.text())) errors.push(msg.text());
      });
      const badStatus = [];
      page.on('response', (res) => {
        const u = res.url();
        if (!u.includes('/newhanzi/')) return;
        if (/\.ico($|\?)/i.test(u)) return;
        if (res.status() >= 400) badStatus.push(res.status() + ' ' + u);
      });
      const res = await page.goto(path, { waitUntil: 'load' });
      expect(res, 'navigation response').toBeTruthy();
      expect(res.status(), 'HTTP status').toBeLessThan(400);
      await page.waitForTimeout(500);
      expect(errors, 'page/console errors').toEqual([]);
      expect(badStatus, '4xx/5xx assets').toEqual([]);
    });
  }

  test('home has brand and module panels', async ({ page }) => {
    await page.goto('newhanzi/index.html');
    await expect(page.locator('.brand h1')).toContainText('识字星球');
    await expect(page.locator('.panels .panel')).toHaveCount(7);
  });

  test('zika hides unreliable 小篆 and marks learned only after load', async ({ page }) => {
    await page.goto('newhanzi/zika.html?zi=%E5%A4%A9');
    await expect(page.locator('.bigzi')).toHaveText('天', { timeout: 20000 });
    // 演变阶段名可以含「小篆」；不可再渲染不可靠的小篆字形字段
    await expect(page.locator('.kv .k', { hasText: /^小篆$/ })).toHaveCount(0);
    const learned = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('nhz_learned') || '{}'); }
      catch (e) { return {}; }
    });
    expect(learned['天']).toBeTruthy();
  });

  test('zika missing char does not mark learned', async ({ page }) => {
    await page.goto('newhanzi/zika.html?zi=%E2%9D%8C');
    await expect(page.locator('.err')).toBeVisible({ timeout: 15000 });
    const learned = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('nhz_learned') || '{}'); }
      catch (e) { return {}; }
    });
    expect(learned['❌']).toBeFalsy();
  });

  test('subpages expose back to home', async ({ page }) => {
    await page.goto('newhanzi/fuxi.html');
    const back = page.locator('a.back');
    await expect(back).toBeVisible();
    await expect(back).toHaveAttribute('href', /index\.html/);
  });

  test('internal home links resolve', async ({ page }) => {
    await page.goto('newhanzi/index.html');
    const hrefs = await page.locator('a[href]').evaluateAll((as) =>
      as.map((a) => a.getAttribute('href')).filter((h) => h && !h.startsWith('http') && !h.startsWith('#'))
    );
    for (const href of hrefs) {
      const url = new URL(href, page.url());
      if (!url.pathname.includes('/newhanzi/')) continue;
      const res = await page.request.get(url.toString());
      expect(res.status(), href).toBeLessThan(400);
    }
  });
});
