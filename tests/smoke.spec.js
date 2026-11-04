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
    // 面板数随模块增减，不写死；至少要有若干个且每个都有标题
    const n = await page.locator('.panels .panel').count();
    expect(n).toBeGreaterThanOrEqual(6);
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

/* 首页与语法页初始加载预算：子页 iframe、逻辑数据、语法题库都应按需加载。
   实测（2026-11-04 懒加载后）：首页 9 请求 / 0.36MB，语法页 5 请求 / 0.75MB；
   改前首页 140 请求 / 11.2MB。阈值留余量，超了说明有东西又被提前加载了。 */
async function measureLoad(page, path) {
  let n = 0, bytes = 0;
  const pending = [];
  page.on('requestfinished', (r) => {
    n++;
    pending.push(r.sizes().then((s) => { bytes += s.responseBodySize; }).catch(() => {}));
  });
  await page.goto(path, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  await Promise.all(pending);
  return { n, mb: bytes / 1048576 };
}

test.describe('load budget', () => {
  test('home initial load is small (lazy iframes)', async ({ page }) => {
    const { n, mb } = await measureLoad(page, 'newhanzi/index.html');
    console.log(`home: ${n} requests, ${mb.toFixed(2)} MB`);
    expect(n).toBeLessThan(25);
    expect(mb).toBeLessThan(1.0);
    await expect(page.locator('iframe[src]')).toHaveCount(0);
  });

  test('yuwen initial load is small (lazy quiz banks)', async ({ page }) => {
    const { n, mb } = await measureLoad(page, 'newhanzi/yuwen.html');
    console.log(`yuwen: ${n} requests, ${mb.toFixed(2)} MB`);
    expect(n).toBeLessThan(15);
    expect(mb).toBeLessThan(1.5);
  });

  test('home panels load iframe / logic on open', async ({ page }) => {
    await page.goto('newhanzi/index.html');
    await page.click('#view-home .panel[data-m="logic"]');
    await expect(page.locator('#logiclist .yw-item').first()).toBeVisible();
    await page.click('#btnBack');
    await page.click('#view-home .panel[data-m="yuwen"]');
    await expect(page.locator('#panel-yuwen iframe')).toHaveAttribute('src', 'yuwen.html');
  });

  test('yuwen quiz bank loads on demand', async ({ page }) => {
    await page.goto('newhanzi/yuwen.html');
    await page.locator('.yw-head:has(.yw-name:text-is("名词"))').click();
    await expect(page.locator('#ywdetail .bank-qs .quiz-q')).toHaveCount(10);
    await page.click('#ywBack');
    await page.locator('.yw-head:has(.yw-name:text-is("把字句"))').click();
    await expect(page.locator('#ywdetail .bank-qs .quiz-q')).toHaveCount(10);
  });
});

/* 只支持平板和桌面（负责人 2026-11-04）：平板 768x1024、桌面 1280x800 下所有页面不得横向溢出 */
const ALL_PAGES = require('fs').readdirSync(require('path').join(__dirname, '..', 'newhanzi'), { recursive: true })
  .filter((f) => f.endsWith('.html') && !f.startsWith('ziku'))
  .map((f) => 'newhanzi/' + f.split(require('path').sep).join('/'))
  .sort();

for (const vp of [{ name: 'tablet', width: 768, height: 1024 }, { name: 'desktop', width: 1280, height: 800 }]) {
  test.describe(`${vp.name} ${vp.width}px no horizontal overflow`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });
    for (const path of ALL_PAGES) {
      test(`no overflow ${vp.name} ${path}`, async ({ page }) => {
        await page.goto(path, { waitUntil: 'load' });
        await page.waitForTimeout(300);
        const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
        expect(r.sw, `scrollWidth ${r.sw} > clientWidth ${r.cw}`).toBeLessThanOrEqual(r.cw);
      });
    }
  });
}

/* sw.js 预缓存清单要覆盖全部页面：新增/删除页面后运行 python3 tools/gen_sw_core.py */
test('sw.js precache list is up to date', async () => {
  const { execFileSync } = require('child_process');
  const out = execFileSync('python3', ['tools/gen_sw_core.py', '--check-pages'], { cwd: require('path').join(__dirname, '..') }).toString();
  expect(out).toContain('最新');
});

/* 原型/游戏/练习页都要能一键回首页；原型页不得依赖外部字体等外链 */
test.describe('home links & no external deps', () => {
  const EXTRA = ALL_PAGES.filter((p) => /\/games\/|proto-yuwen|speedtest|quiz\/index/.test(p));
  for (const path of EXTRA) {
    test(`home link ${path}`, async ({ page }) => {
      const external = [];
      page.on('request', (r) => { if (!r.url().startsWith('http://127.0.0.1')) external.push(r.url()); });
      await page.goto(path, { waitUntil: 'load' });
      const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.href));
      expect(hrefs.some((h) => /\/newhanzi\/index\.html$/.test(h)), 'link to newhanzi/index.html').toBeTruthy();
      expect(external, 'external requests').toEqual([]);
    });
  }
});
