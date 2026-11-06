// 只读审计修复的回归测试（newhanzi-audit-fixes）。每个用例对应审计条目编号。
const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

// 1. 慢数据（data_logic.js 晚于 4 秒兜底到达）：兜底不能锁死题库，晚到的数据要生效
test('1. quiz: late data after 4s fallback is still applied', async ({ page }) => {
  await page.route('**/quiz/data_logic.js', async (route) => {
    await new Promise((r) => setTimeout(r, 5500));
    await route.continue();
  });
  // 用 domcontentloaded：动态插入的数据脚本会拖慢 load 事件，不能等到数据到达后才开始断言
  await page.goto('newhanzi/quiz/index.html?tab=logic', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.qz-empty')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.qz-mode').first()).toBeVisible({ timeout: 15000 });
});

// 2. 老数组格式 nhz_learned：不盖今天日期；首页、周报口径一致
test('2. legacy array nhz_learned: no today stamp, weekly total matches home', async ({ page }) => {
  await page.goto('newhanzi/index.html');
  await page.evaluate(() => localStorage.setItem('nhz_learned', JSON.stringify(['一', '二', '三'])));
  await page.reload();
  await expect(page.locator('#learnedCount')).toHaveText('已学 3 / 3500');
  await expect(page.locator('#stToday')).toHaveText('0');

  await page.clock.install();
  await page.goto('newhanzi/zika.html?zi=' + encodeURIComponent('天'));
  await expect(page.locator('.bigzi')).toHaveText('天', { timeout: 20000 });
  /* 只是打开不算学会：停留不足 15 秒时不记为已学 */
  await page.clock.runFor(5000);
  let learned = await page.evaluate(() => JSON.parse(localStorage.getItem('nhz_learned')));
  expect(learned['天']).toBeUndefined();
  /* 停留满 15 秒后才记为已学 */
  await page.clock.runFor(11000);
  learned = await page.evaluate(() => JSON.parse(localStorage.getItem('nhz_learned')));
  expect(learned['一']).not.toBe(todayStr());
  expect(learned['二']).not.toBe(todayStr());
  expect(learned['天']).toBe(todayStr());

  await page.goto('newhanzi/weekly.html');
  await expect(page.locator('body')).toContainText('已学字累计 4 字', { timeout: 15000 });
});

// 3. 搜索无结果时要显示“没有找到”
test('3. index search shows no-result message when zero hits', async ({ page }) => {
  await page.goto('newhanzi/index.html');
  await page.click('#view-home .panel[data-m="shizi"]');
  await page.fill('#q', 'zzzzqqq');
  await expect(page.locator('#list .noresult')).toContainText('没有找到相关汉字', { timeout: 5000 });
  await expect(page.locator('#list .row')).toHaveCount(0);
});

// 4. 语法内容稿校验脚本能找到 wb/index.js（不再 ENOENT）
test('4. check_yufa_neirong.js runs and exits 0', () => {
  execFileSync(process.execPath, [path.join(ROOT, 'tools/content/check_yufa_neirong.js')], { stdio: 'pipe' });
});

// 8. iOS 安装提示：本会话点“知道了”后，刷新页面不再出现
test('8. iOS install hint stays dismissed for the session', async ({ page }) => {
  await page.addInitScript(() => { window.NHZ_INSTALL_TEST_IOS = true; });
  await page.goto('newhanzi/index.html');
  await expect(page.locator('#pwaIosOk')).toBeVisible({ timeout: 10000 });
  await page.click('#pwaIosOk');
  await expect(page.locator('#pwaIosOk')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#view-home')).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page.locator('#pwaIosOk')).toHaveCount(0);
});


// 10. 再次开局前清掉旧计时器：两次 start() 后每秒只减 1 秒
test('10. dedide-dashu start() does not stack timers', async ({ page }) => {
  await page.goto('newhanzi/games/yufa/dedide-dashu.html');
  await page.evaluate(() => { start(); start(); });
  await page.waitForTimeout(2500);
  const elapsed = await page.evaluate(() => 60 - timeLeft);
  expect(elapsed).toBeLessThanOrEqual(2);
});

// 11. 护眼横幅与安装横幅同时出现时不重叠
test('11. eye-care and install banners stack without overlap', async ({ page }) => {
  await page.addInitScript(() => {
    window.NHZ_INSTALL_TEST_IOS = true;
    window.NHZ_EYE_TICK_MS = 1000;
    window.NHZ_EYE_MINUTES = 0.0166;
  });
  await page.goto('newhanzi/index.html');
  await expect(page.locator('[data-nhz-banner]')).toHaveCount(2, { timeout: 10000 });
  const boxes = await page.locator('[data-nhz-banner]').evaluateAll((els) =>
    els.map((e) => { const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; }));
  const [a, b] = boxes;
  expect(a.bottom <= b.top || b.bottom <= a.top, JSON.stringify(boxes)).toBeTruthy();
});

// 9. 路径动画的 dasharray 取真实路径长度（或调用方给的 length），不再固定 500
test('9. anim-engine path uses measured or explicit length', async ({ page }) => {
  await page.goto('newhanzi/index.html');
  await page.addScriptTag({ path: path.join(ROOT, 'anim-engine.js') });
  const r = await page.evaluate(() => ({
    measured: AnimEngine.path({ path: 'M0 0 L 800 0' }),
    explicit: AnimEngine.path({ path: 'M0 0 L 800 0', length: 123 })
  }));
  expect(r.measured).toMatch(/stroke-dasharray="800"/);
  expect(r.explicit).toMatch(/stroke-dasharray="123"/);
});
