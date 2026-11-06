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

  test('zika hides unreliable 小篆 and marks learned only after load and 15s stay', async ({ page }) => {
    await page.clock.install();
    await page.goto('newhanzi/zika.html?zi=%E5%A4%A9');
    await expect(page.locator('.bigzi')).toHaveText('天', { timeout: 20000 });
    // 演变阶段名可以含「小篆」；不可再渲染不可靠的小篆字形字段
    await expect(page.locator('.kv .k', { hasText: /^小篆$/ })).toHaveCount(0);
    const read = () => page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('nhz_learned') || '{}'); }
      catch (e) { return {}; }
    });
    // 只是打开不算学会：停留不足 15 秒不记
    await page.clock.runFor(5000);
    expect((await read())['天']).toBeFalsy();
    // 停留满 15 秒后才记为已学
    await page.clock.runFor(11000);
    expect((await read())['天']).toBeTruthy();
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
    // 通假已并入「语法」页：古文菜单 → 语法 → 通假
    await page.locator('[data-mod="yufa"]').first().click();
    await page.locator('[data-ysub="m:tongjia"]').first().click();
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
    // 页面出题种子取 Date.now()，测试里固定 Date.now，使每次加载（含 reload）出同一道题、同一手牌。
    // 按现有题库，这个时间出的第一张手牌是错牌，会走「打错→按反馈亮出的正确牌重做」分支；题库变了两条分支都能过
    await page.addInitScript(() => { const t = 1700000000001; Date.now = () => t; });
    await page.goto('newhanzi/games/luoji/miuwu.html');
    await page.evaluate(() => localStorage.removeItem('nhz_fallacy_cards'));
    await page.reload();
    await expect(page.locator('.fcard.lock')).toHaveCount(12);
    await page.locator('[data-tab="play"]').click();
    const sent = (await page.locator('#sent').textContent()).trim();
    await page.locator('[data-play]').first().click();
    await expect(page.locator('#fb')).toContainText('是「');
    await expect(page.locator('.hand .fcard.ok')).toHaveCount(1);
    const okId = await page.locator('.hand .fcard.ok').getAttribute('data-play');
    if (!(await page.locator('#fb').textContent()).startsWith('✓')) {
      // 第一张打错：错题不解锁；按反馈里亮出的正确牌重做同一题
      await expect(page.locator('#fb')).toContainText('✗');
      await page.reload();
      await expect(page.locator('.fcard.lock')).toHaveCount(12);
      await page.locator('[data-tab="play"]').click();
      await expect(page.locator('#sent')).toHaveText(sent);
      await page.locator('[data-play="' + okId + '"]').click();
    }
    await expect(page.locator('#fb')).toContainText('✓');
    await expect(page.locator('#fb')).toContainText('解锁新卡');
    await page.locator('[data-tab="deck"]').click();
    await expect(page.locator('.fcard.lock')).toHaveCount(11);
    await expect(page.locator('[data-card="' + okId + '"]')).not.toHaveClass(/lock/);
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
    // 绝句（两个黄鹂）已有 pz 数据，改用无平仄数据的《江南》（order 124）
    await page.goto('newhanzi/shici.html#poem-124');
    await page.locator('[data-rb="metro"]').click();
    await expect(page.locator('#scbeat .bk-g').first()).toBeVisible();
    await expect(page.locator('#scbeat [data-pzt]')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('shici imagery cards flip, light up and expand', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/shici.html');
    await page.evaluate(() => localStorage.removeItem('nhz_shici_read'));
    await page.locator('.sc-card[data-go="imagery"]').click();
    await expect(page.locator('.sc-imcard')).toHaveCount(19);
    await expect(page.locator('.sc-imcard.lit')).toHaveCount(0);
    const moon = page.locator('.sc-imcard[data-im="0"]');
    await moon.click();
    await expect(moon).toHaveClass(/flip/);
    await expect(moon.locator('.sc-immean2')).toHaveText('思乡');
    await moon.locator('[data-lines]').click();
    const lines = moon.locator('.sc-imlines .sc-hitline');
    expect(await lines.count()).toBeGreaterThanOrEqual(2);
    await expect(lines.first()).toContainText('床前明月光');
    await moon.locator('.sc-imlines [data-o="1"]').click();
    await expect(page.locator('#navtitle')).toHaveText('静夜思');
    await page.goto('about:blank');
    await page.goto('newhanzi/shici.html');
    await page.locator('.sc-card[data-go="imagery"]').click();
    // 《静夜思》含「月」「霜」，两张卡点亮
    await expect(page.locator('.sc-imcard.lit')).toHaveCount(2);
    await expect(page.locator('.sc-imcard.lit[data-im="0"]')).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test('shici scroll whiteboard mounts', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/shici.html#poem-136');
    await page.locator('[data-rb="wb"]').click();
    await expect(page.locator('#scwb svg').first()).toBeVisible({ timeout: 10000 });
    await page.goto('about:blank');
    // 《登鹳雀楼》已在 3384bb59 登记为 scroll 白板（sc_deng_guanque_wang），不再是无白板反例
    await page.goto('newhanzi/shici.html#poem-38');
    await page.locator('[data-rb="wb"]').click();
    await expect(page.locator('#scwb svg').first()).toBeVisible({ timeout: 10000 });
    await page.goto('about:blank');
    // 未登记白板的诗（《咏鹅》）仍不出白板按钮
    await page.goto('newhanzi/shici.html#poem-42');
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

  test('guwen songdu follow-along reading', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.addInitScript(() => {
      // 无头浏览器不一定出声：替换朗读，每段 30ms 后回调 onend，记下读了什么
      window.__said = [];
      const ss = { speaking: false, cancel() { window.__cancel = (window.__cancel || 0) + 1; }, getVoices() { return []; },
        speak(u) { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 30); } };
      Object.defineProperty(window, 'speechSynthesis', { value: ss, configurable: true });
    });
    await page.goto('newhanzi/guwen.html');
    await page.locator('[data-mod="pianmu"]').first().click();
    await page.locator('[data-go="全部"]').click();
    await page.locator('.gw-item', { hasText: '司马光' }).first().click();
    await expect(page.locator('#gwSdTip')).toContainText('停顿');
    await page.locator('[data-gwsd="read"]').click();
    await expect(page.locator('.gw-yw .sdj')).toHaveCount(7);
    await expect(page.locator('.gw-yw .sdt').first()).toHaveText('/');
    await expect(page.locator('#gwSdTip')).toHaveText('读完了', { timeout: 15000 });
    await expect(page.locator('.gw-yw .zd').first()).toBeVisible();
    const said = await page.evaluate(() => window.__said);
    expect(said[0].trim()).toBe('群儿');
    expect(said[1].trim()).toBe('戏于庭');
    // 跟我读：读完一节停下等孩子（约 3 秒），离开篇目即停
    await page.locator('[data-gwsd="follow"]').click();
    await expect(page.locator('.gw-yw .sdj.you')).toHaveCount(1);
    await expect(page.locator('#gwSdTip')).toContainText('该你读了');
    const n1 = await page.evaluate(() => window.__said.length);
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => window.__said.length)).toBe(n1);
    // 内容里不再放「回××」按钮：用界面层级导航回上一级（离开篇目即停）
    expect(await page.evaluate(() => window.NHZNav.up())).toBe(true);
    expect(await page.evaluate(() => window.NHZGwSd.playing())).toBe(false);
    // 没有 停 的篇目：按标点分节（过渡版）
    await page.locator('.gw-item', { hasText: '学而时习之' }).first().click();
    await expect(page.locator('#gwSdTip')).toContainText('过渡版');
    await page.locator('[data-gwsd="read"]').click();
    await expect(page.locator('.gw-yw .sdj')).toHaveCount(7);
    await expect(page.locator('.gw-yw .sdt')).toHaveCount(0);
    await page.locator('[data-gwsd="read"]').click();
    expect(await page.evaluate(() => window.NHZGwSd.playing())).toBe(false);
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

  test('guwen ranze morph whiteboard', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/guwen.html');
    await page.locator('[data-mod="yufa"]').first().click();
    await page.locator('#gwMItems .yw-head', { hasText: '然则' }).first().click();
    await page.locator('#gwmdetail [data-gwwb-start]').click();
    await expect(page.locator('#gwmdetail [data-gwwb] svg').first()).toBeVisible({ timeout: 10000 });
    expect(errors).toEqual([]);
  });

  test('guwen wunai morph whiteboard', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/guwen.html');
    await page.locator('[data-mod="yufa"]').first().click();
    await page.locator('#gwMItems .yw-head', { hasText: '无乃…乎' }).first().click();
    await page.locator('#gwmdetail [data-gwwb-start]').click();
    await expect(page.locator('#gwmdetail [data-gwwb] svg').first()).toBeVisible({ timeout: 10000 });
    expect(errors).toEqual([]);
  });

  test('guwen guyin balance whiteboard', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/guwen.html');
    await page.locator('[data-mod="guyin"]').first().click();
    await page.locator('#gwMItems .yw-head', { hasText: '妻子' }).first().click();
    await page.locator('#gwmdetail [data-gwwb-start]').click();
    await expect(page.locator('#gwmdetail [data-gwwb] svg').first()).toBeVisible({ timeout: 10000 });
    expect(errors).toEqual([]);
  });

  test('guwen guyin balance whiteboard all 16 words (A22-1)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/guwen.html');
    const words = ['妻子','绝境','交通','卑鄙','牺牲','无论','地方','可以','汤','走','去','江','河','涕','臭','颜色'];
    const missing = await page.evaluate((ws) => ws.filter((w) => !(window.NHZ_WB_INDEX || {})['古文:' + w]), words);
    expect(missing).toEqual([]);
    await page.locator('[data-mod="guyin"]').first().click();
    await page.locator('#gwMItems .yw-head', { hasText: '颜色' }).first().click();
    await page.locator('#gwmdetail [data-gwwb-start]').click();
    await expect(page.locator('#gwmdetail [data-gwwb] svg').first()).toBeVisible({ timeout: 10000 });
    expect(errors).toEqual([]);
  });

  test('guwen duoyi star whiteboard keyed by category (A22-5)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/guwen.html');
    await page.locator('[data-mod="duoyi"]').first().click();
    await page.locator('#gwMItems .yw-head', { hasText: '去' }).first().click();
    await expect(page.locator('#gwmdetail [data-gwwb]')).toHaveAttribute('data-gwwb', '古文:一词多义:去');
    await page.locator('#gwmdetail [data-gwwb-start]').click();
    await expect(page.locator('#gwmdetail [data-gwwb] svg').first()).toBeVisible({ timeout: 10000 });
    await page.goto('newhanzi/guwen.html');
    await page.locator('[data-mod="guyin"]').first().click();
    await page.locator('#gwMItems .yw-head', { hasText: '去' }).first().click();
    await expect(page.locator('#gwmdetail [data-gwwb]')).toHaveAttribute('data-gwwb', '古文:去');
    expect(errors).toEqual([]);
  });

  test('guwen huoyong prototype whiteboard + diagram (形容词使动用法)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/guwen.html');
    await page.locator('[data-mod="yufa"]').first().click();
    await page.locator('[data-ysub="m:huoyong"]').first().click();
    await page.locator('#gwMItems .yw-head', { hasText: '形容词使动用法' }).first().click();
    await expect(page.locator('#gwmdetail [data-gwwb]')).toHaveAttribute('data-gwwb', '古文:词类活用:形容词使动用法');
    await expect(page.locator('#gwmdetail .yw-diagram svg[aria-label*="苦其心志"]')).toHaveCount(1);
    await page.locator('#gwmdetail [data-gwwb-start]').click();
    await expect(page.locator('#gwmdetail [data-gwwb] svg').first()).toBeVisible({ timeout: 10000 });
    expect(errors).toEqual([]);
  });

  test('logic domino page (A22-2)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/games/luoji/domino.html');
    await page.locator('#dpush').click();
    await expect(page.locator('#dfb')).toContainText('全倒了', { timeout: 8000 });
    await page.locator('#drow .tile[data-i="2"]').click();
    await page.locator('#dpush2').click();
    await expect(page.locator('#dfb')).toContainText('推不倒', { timeout: 8000 });
    await page.locator('#box [data-a="0"]').click();
    await expect(page.locator('#fb')).toContainText('判对了', { timeout: 8000 });
    await page.locator('#next').click();
    await page.locator('#box [data-a="0"]').click();
    await expect(page.locator('#fb')).toContainText('再看看', { timeout: 8000 });
    await expect(page.locator('.gapnote')).toBeVisible();
    const wrong = await page.evaluate(() => JSON.parse(localStorage.getItem('nhz_wrong') || '[]').filter((w) => w.point === '强加因果').length);
    expect(wrong).toBe(1);
    expect(errors).toEqual([]);
  });

  test('logic concept relations whiteboard + fenchouti drawers (A22-3)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/index.html');
    await page.locator('#view-home .panel[data-m="logic"]').click();
    const name = '概念：定义与划分';
    await page.locator('#logiclist .yw-head', { hasText: name }).first().click({ timeout: 20000 });
    const wb = page.locator('#logiclist .yw-wb[data-lwb="' + name + '"]');
    await wb.locator('[data-lwb-start]').click();
    await expect(wb.locator('svg').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#logiclist a[href="games/luoji/fenchouti.html"]')).toHaveCount(1);
    await page.goto('newhanzi/games/luoji/fenchouti.html');
    await page.evaluate(() => localStorage.removeItem('nhz_wrong'));
    await page.locator('[data-l="男生"]').click();
    await page.locator('[data-l="戴眼镜的"]').click();
    await page.locator('#go').click();
    await expect(page.locator('.drw.smoke')).toHaveCount(2);
    await expect(page.locator('#fb')).toContainText('冒烟');
    const wrong = await page.evaluate(() => JSON.parse(localStorage.getItem('nhz_wrong') || '[]').filter((w) => w.point === '概念：定义与划分').length);
    expect(wrong).toBe(1);
    await page.locator('#retry').click();
    await page.locator('[data-l="戴眼镜的"]').click();
    await page.locator('[data-l="不戴眼镜的"]').click();
    await page.locator('#go').click();
    await expect(page.locator('#fb')).toContainText('✓');
    await expect(page.locator('.drw.smoke')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('logic argument map whiteboard (A22-7 tree)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/index.html');
    await page.locator('#view-home .panel[data-m="logic"]').click();
    for (const name of ['举例论证', '对比论证']) {
      await page.locator('#logiclist .yw-head', { hasText: name }).first().click({ timeout: 20000 });
      const wb = page.locator('#logiclist .yw-wb[data-lwb="' + name + '"]');
      await wb.locator('[data-lwb-start]').click();
      await expect(wb.locator('svg').first()).toBeVisible({ timeout: 10000 });
    }
    expect(errors).toEqual([]);
  });

  test('logic four laws court whiteboard (A22-4 vs + gavel)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/index.html');
    await page.locator('#view-home .panel[data-m="logic"]').click();
    const name = '四大逻辑规律';
    await page.locator('#logiclist .yw-head', { hasText: name }).first().click({ timeout: 20000 });
    const wb = page.locator('#logiclist .yw-wb[data-lwb="' + name + '"]');
    await wb.locator('[data-lwb-start]').click();
    await expect(wb.locator('svg').first()).toBeVisible({ timeout: 10000 });
    await expect(wb.locator('.wb-tabs button')).toHaveCount(6);
    await expect(wb.locator('.wb-tabs')).toContainText('充足理由律');
    expect(errors).toEqual([]);
  });

  test('logic tag questions render as argument map (A22-7)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/quiz/index.html?tab=logic');
    const card = page.locator('[data-mode="tag"]');
    await expect(card).toContainText('论证地图', { timeout: 15000 });
    await card.click();
    await expect(page.locator('#qzModeTag')).toContainText('论证地图');
    await expect(page.locator('#qbox .qz-map .qz-mslot')).toHaveCount(3);
    const prompt = await page.locator('#qbox .qz-q').innerText();
    const cards = page.locator('#qbox .qz-mcards .qz-tok');
    const n = await cards.count();
    expect(n).toBe(3);
    for (let k = 0; k < n; k++) {
      const c = cards.nth(k);
      const txt = (await c.innerText()).trim();
      const tag = await page.evaluate(([p, t]) => {
        for (const q of window.NHZ_QUIZ.modes.tag) {
          if (q.prompt !== p) continue;
          const tok = q.tokens.find((x) => x.t === t);
          if (tok) return tok.tag;
        }
        return null;
      }, [prompt, txt]);
      expect(tag, 'token found in bank').toBeTruthy();
      await c.click();
      await page.locator('#qbox .qz-mslot[data-tag="' + tag + '"]').click();
    }
    await expect(page.locator('#qbox .qz-mhung.right')).toHaveCount(3);
    await expect(page.locator('#qbox .qz-mhung.wrong')).toHaveCount(0);
    await expect(page.locator('#qfb')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('guwen production modes: cut / order / fill from 句 annotations (A22-9)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/quiz/index.html?tab=guwen&text=' + encodeURIComponent('守株待兔'));
    await expect(page.locator('[data-mode="cut"]')).toContainText('断句', { timeout: 15000 });
    await expect(page.locator('[data-mode="fill"]')).toContainText('填今译');
    await expect(page.locator('[data-mode="order"]')).toContainText('排今译');
    await expect(page.locator('[data-mode="choice"]')).toHaveCount(0);
    await page.locator('[data-mode="cut"]').click();
    await expect(page.locator('#qbox .qz-gap').first()).toBeVisible();
    await page.evaluate(() => {
      const s = [...document.querySelectorAll('.qz-cut .qz-cch')].map((e) => e.textContent).join('');
      const q = window.NHZGwChan.build(window.NHZ_GUWEN.texts).cut.find((x) => x.ting.replace(/\//g, '') === s);
      window.NHZGwChan.parseTing(q.ting).ans.forEach((i) => document.querySelector('.qz-gap[data-i="' + i + '"]').click());
    });
    await page.locator('[data-act="csubmit"]').click();
    await expect(page.locator('#qfb .qz-fb.ok')).toBeVisible();
    await page.locator('#btnNext').click();
    await page.locator('[data-act="csubmit"]').click();   /* 不插 / 直接交：错，进统一错题本 */
    await expect(page.locator('#qfb .qz-fb.no')).toBeVisible();
    const wrong = await page.evaluate(() => JSON.parse(localStorage.getItem('nhz_wrong') || '[]'));
    expect(wrong.some((w) => /^断句：/.test(w.q) && w.answer.indexOf('/') > 0)).toBeTruthy();
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
const ALL_PAGES = require('fs').readdirSync(require('path').join(__dirname, '..'), { recursive: true })
  .filter((f) => f.endsWith('.html') && !/^(ziku|docs|tools|tests|node_modules|test-results|playwright-report)[\\/]/.test(f))
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
  // PYTHONUTF8：Windows 控制台默认 GBK，不设则中文输出被错解码，断言“最新”会误判
  const out = execFileSync('python3', ['tools/gen_sw_core.py', '--check-pages'], { cwd: require('path').join(__dirname, '..'), shell: true, env: { ...process.env, PYTHONUTF8: '1' } }).toString();
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
