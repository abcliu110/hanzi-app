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

  test('zika shows 字源讲解 without template text', async ({ page }) => {
    await page.goto('newhanzi/zika.html?zi=' + encodeURIComponent('肠'));
    await expect(page.locator('.bigzi')).toHaveText('肠', { timeout: 20000 });
    const body = await page.locator('body').innerText();
    expect(body).toContain('本义是人和动物的消化器官之一');
    expect(body).not.toMatch(/intestine|是一个常用汉字|很快就记牢了/);
  });

  test('logic quiz can filter by point', async ({ page }) => {
    await page.goto('newhanzi/quiz/index.html?tab=logic&point=' + encodeURIComponent('三段论'));
    await expect(page.locator('#qzTitle')).toContainText('三段论', { timeout: 15000 });
    const ns = await page.locator('.qz-mode-n').allInnerTexts();
    const total = ns.reduce((a, t) => a + parseInt(t, 10), 0);
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThan(211);
  });

  test('zika choice shuffles options and judges by answer text (F6)', async ({ page }) => {
    await page.goto('newhanzi/quiz/index.html?tab=zika');
    await page.locator('[data-mode="choice"]').first().click({ timeout: 15000 });
    const firstPos = [];
    for (let k = 0; k < 6; k++) {
      const q = await page.locator('#qbox .qz-q').innerText();
      const btns = page.locator('#qbox button[data-act="pick"]');
      const texts = await btns.allInnerTexts();
      const ans = await page.evaluate(([qt, ts]) => {
        const key = ts.slice().sort().join('|');
        const it = window.NHZ_QUIZ.modes.choice.find((x) => x.q === qt && x.opts.slice().sort().join('|') === key);
        return it ? it.opts[it.a] : null;
      }, [q, texts]);
      expect(ans, 'question found in bank').toBeTruthy();
      const pos = texts.indexOf(ans);
      firstPos.push(pos);
      await btns.nth(pos).click();
      await expect(page.locator('#qfb .qz-fb.ok')).toBeVisible();
      await page.locator('#btnNext').click();
    }
    expect(firstPos.length).toBe(6);
  });

  test('guwen quiz banks load on demand', async ({ page }) => {
    const reqs = [];
    page.on('request', (r) => reqs.push(r.url()));
    await page.goto('newhanzi/guwen.html');
    await page.waitForTimeout(500);
    expect(reqs.filter((u) => u.includes('quiz_bank_guwen_')).length).toBe(0);
    await page.locator('[data-mod="tongjia"]').first().click();
    await expect(page.locator('#gwMItems .yw-head').first()).toBeVisible({ timeout: 10000 });
    expect(reqs.filter((u) => u.includes('quiz_bank_guwen_')).map((u) => u.split('/').pop())).toEqual(['quiz_bank_guwen_tongjia.js']);
    await page.locator('#gwMItems .yw-head').first().click();
    await expect(page.locator('.yw-bank').first()).toBeAttached();
  });

  test('guwen text knowledge card links both ways', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/guwen.html');
    await page.locator('[data-mod="pianmu"]').first().click();
    await page.locator('[data-go="全部"]').click();
    await page.locator('.gw-item', { hasText: '学而时习之' }).first().click();
    await expect(page.locator('#gwKnowCard')).toBeVisible();
    await expect(page.locator('.gw-kc-sum')).toContainText('本篇：');
    const card = page.locator('.gw-kc[data-gwpoint^="tongjia:"]').first();
    await card.click();
    await expect(page.locator('#gwmdetail')).toBeVisible({ timeout: 10000 });
    const from = page.locator('#gwmdetail .gw-from[data-gwtext="学而时习之"]');
    await expect(from).toBeVisible();
    await from.click();
    await expect(page.locator('#gwdetail h2')).toHaveText('学而时习之');
    expect(errors).toEqual([]);
  });

  test('logic taoquan judge flow', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/games/luoji/taoquan.html');
    await page.evaluate(() => localStorage.removeItem('nhz_wrong'));
    // 第 1 题 铜：有效
    await page.locator('[data-a="in"]').click();
    await page.locator('ellipse[data-r="m"]').click({ position: { x: 130, y: 120 } });
    await page.locator('[data-c="1"]').click();
    await expect(page.locator('#fb')).toContainText('✓');
    await page.locator('#next').click();
    // 第 2 题 鸭嘴兽：答「一定成立」是错的，出反例并进错题本
    await page.locator('[data-a="in"]').click();
    await page.locator('ellipse[data-r="m"]').click({ position: { x: 130, y: 120 } });
    await page.locator('[data-c="1"]').click();
    await expect(page.locator('#fb')).toContainText('反例');
    const wrong = await page.evaluate(() => JSON.parse(localStorage.getItem('nhz_wrong') || '[]'));
    expect(wrong.some((w) => w.point === '三段论')).toBe(true);
    expect(errors).toEqual([]);
  });

  test('logic fanpai flip flow', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/games/luoji/fanpai.html');
    await page.locator('[data-k="P"]').click();
    await page.locator('[data-k="Q"]').click();
    await page.locator('#flip').click();
    await expect(page.locator('#fb')).toContainText('你选了 P 和 Q');
    await expect(page.locator('.grid .red')).toBeVisible();
    await page.locator('#next').click();
    await page.locator('[data-k="P"]').click();
    await page.locator('[data-k="nQ"]').click();
    await page.locator('#flip').click();
    await expect(page.locator('#fb')).toContainText('✓');
    expect(errors).toEqual([]);
  });

  test('logic fallacy card play unlocks card', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/games/luoji/miuwu.html');
    await page.evaluate(() => localStorage.removeItem('nhz_fallacy_cards'));
    await page.reload();
    await expect(page.locator('.fcard.lock')).toHaveCount(12);
    await page.locator('[data-tab="play"]').click();
    // 找出正确的牌：句子 → 卡 id 由页面数据决定，逐张试第一张不对就看反馈里的正确卡名
    await page.locator('[data-play]').first().click();
    await expect(page.locator('#fb')).toContainText('是「');
    await expect(page.locator('.hand .fcard.ok')).toHaveCount(1);
    const okName = (await page.locator('.hand .fcard.ok b').textContent()).trim();
    let unlocked = 0;
    for (let i = 0; i < 20 && unlocked === 0; i++) {
      await page.locator('#nextq').click();
      const btn = page.locator('[data-play]', { hasText: okName });
      if (await btn.count()) {
        const sent = await page.locator('#sent').textContent();
        await btn.first().click();
        if ((await page.locator('#fb').textContent()).startsWith('✓')) unlocked = 1;
        else if (!sent) break;
      } else {
        await page.locator('[data-play]').first().click();
        if ((await page.locator('#fb').textContent()).startsWith('✓')) unlocked = 1;
      }
    }
    await page.locator('[data-tab="deck"]').click();
    if (unlocked) await expect(page.locator('.fcard.lock')).toHaveCount(11);
    expect(errors).toEqual([]);
  });

  test('shici metronome and pingze grid', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/shici.html#poem-38');
    await page.locator('[data-rb="metro"]').click();
    await expect(page.locator('#scbeat .bk-g')).toHaveCount(12);
    await page.locator('#scbeat [data-pzt]').click();
    await expect(page.locator('#scbeat .bk-ru')).toHaveCount(6);
    await expect(page.locator('#scbeat .bk-pz i.ping')).toHaveCount(9);
    await page.locator('#scbeat [data-ru]').first().click();
    await expect(page.locator('#bkmsg')).toContainText('入声');
    await page.locator('#scbeat [data-bpm="100"]').click();
    await page.locator('#scbeat [data-go]').click();
    await expect(page.locator('#scbeat .bk-g.lit')).toHaveCount(1, { timeout: 3000 });
    await page.locator('#scbeat [data-go]').click();
    // 没有逐首校过平仄的诗只做节奏
    await page.goto('about:blank');
    await page.goto('newhanzi/shici.html#poem-136');
    await page.locator('[data-rb="metro"]').click();
    await expect(page.locator('#scbeat .bk-g')).toHaveCount(12);
    await expect(page.locator('#scbeat [data-pzt]')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('shici scroll whiteboard mounts', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/shici.html#poem-136');
    await page.locator('[data-rb="wb"]').click();
    await expect(page.locator('#scwb svg').first()).toBeVisible({ timeout: 10000 });
    await page.goto('about:blank');
    await page.goto('newhanzi/shici.html#poem-38');
    await expect(page.locator('[data-rb="wb"]')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('guwen yuanwen tap-to-gloss', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/guwen.html');
    await page.locator('[data-mod="pianmu"]').first().click();
    await page.locator('[data-go="全部"]').click();
    await page.locator('.gw-item', { hasText: '守株待兔' }).first().click();
    await expect(page.locator('.gw-yw .zd')).toHaveCount(11);
    await expect(page.locator('.gw-yw')).toHaveText(/宋人有耕者。田中有株/);
    await page.locator('.gw-yw .zd[data-zd="走"]').click();
    await expect(page.locator('#gwGloss')).toContainText('走：跑');
    await expect(page.locator('.gw-yw .pu')).toHaveCount(4);
    await page.locator('.gw-yw .pu').first().click();
    expect(errors).toEqual([]);
  });

  test('guwen daozhuang morph whiteboard', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/guwen.html');
    await page.locator('[data-mod="yufa"]').first().click();
    await page.locator('#gwMItems .yw-head', { hasText: '倒装句' }).first().click();
    await page.locator('#gwmdetail [data-gwwb-start]').click();
    await expect(page.locator('#gwmdetail [data-gwwb] svg').first()).toBeVisible({ timeout: 10000 });
    expect(errors).toEqual([]);
  });

  test('guwen panduan morph whiteboard', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/guwen.html');
    await page.locator('[data-mod="yufa"]').first().click();
    await page.locator('#gwMItems .yw-head', { hasText: '判断句' }).first().click();
    await page.locator('#gwmdetail [data-gwwb-start]').click();
    await expect(page.locator('#gwmdetail [data-gwwb] svg').first()).toBeVisible({ timeout: 10000 });
    expect(errors).toEqual([]);
  });

  test('guwen beidong morph whiteboard', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/guwen.html');
    await page.locator('[data-mod="yufa"]').first().click();
    await page.locator('#gwMItems .yw-head', { hasText: '被动句' }).first().click();
    await page.locator('#gwmdetail [data-gwwb-start]').click();
    await expect(page.locator('#gwmdetail [data-gwwb] svg').first()).toBeVisible({ timeout: 10000 });
    expect(errors).toEqual([]);
  });

  test('guwen shenglue morph whiteboard', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/guwen.html');
    await page.locator('[data-mod="yufa"]').first().click();
    await page.locator('#gwMItems .yw-head', { hasText: '省略句' }).first().click();
    await page.locator('#gwmdetail [data-gwwb-start]').click();
    await expect(page.locator('#gwmdetail [data-gwwb] svg').first()).toBeVisible({ timeout: 10000 });
    expect(errors).toEqual([]);
  });

  test('guwen shiyi morph whiteboard', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/guwen.html');
    await page.locator('[data-mod="yufa"]').first().click();
    await page.locator('#gwMItems .yw-head', { hasText: '是以' }).first().click();
    await page.locator('#gwmdetail [data-gwwb-start]').click();
    await expect(page.locator('#gwmdetail [data-gwwb] svg').first()).toBeVisible({ timeout: 10000 });
    expect(errors).toEqual([]);
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

/* MASTER_PLAN 阶段一「渲染验证」：yuwen.html（语法）每一条都能打开详情、正文非空、无页面报错 */
test.describe('yuwen every item renders', () => {
  for (const m of ['grammar']) {
    test(`yuwen ${m} items open`, async ({ page }) => {
      test.setTimeout(120_000);
      const errs = [];
      page.on('pageerror', (e) => errs.push(String(e)));
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto('newhanzi/yuwen.html');
      await expect(page.locator('.yw-head').first()).toBeVisible({ timeout: 20000 });
      const ids = await page.locator('.yw-head').evaluateAll((els) => els.map((e) => e.getAttribute('data-idx')));
      expect(ids.length).toBeGreaterThan(90);
      const empty = [];
      for (const id of ids) {
        const head = page.locator(`.yw-head[data-idx="${id}"]`).first();
        const name = (await head.locator('.yw-name').innerText()).trim();
        await head.click();
        await expect(page.locator('#ywDetailBody')).toBeVisible();
        const txt = (await page.locator('#ywDetailBody').innerText()).trim();
        if (txt.length < 20) empty.push(name);
        await page.locator('#ywBack').click();
      }
      expect(empty, '正文为空的条目').toEqual([]);
      expect(errs, '页面报错').toEqual([]);
    });
  }
});
