// 图示动画：生成脚本校验 + “↻ 重播”真的让 SMIL 从头播放 + 字卡畸形链接不卡死
const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

test('anim3 生成脚本校验：整字==字卡字、无扩展区字符、与 spec 一致', () => {
  execFileSync(process.execPath, [path.join(ROOT, 'tools/anim3/gen_zika_split.js'), 'check'], { stdio: 'pipe' });
  execFileSync(process.execPath, [path.join(ROOT, 'tools/anim3/check_anim.js')], { stdio: 'pipe' });
});

// 等动画跑一会儿，点重播，断言 svg 被换成新节点且时间线回到开头
async function expectReplay(page, boxSel) {
  const box = page.locator(boxSel).first();
  await expect(box.locator('svg')).toHaveCount(1);
  await page.waitForTimeout(1500);
  const before = await box.evaluate((d) => { const s = d.querySelector('svg'); window.__oldSvg = s; return s.getCurrentTime(); });
  expect(before).toBeGreaterThan(1);
  await box.locator('[data-replay]').click();
  const after = await box.evaluate((d) => {
    const s = d.querySelector('svg');
    return { t: s.getCurrentTime(), replaced: s !== window.__oldSvg, oldGone: !window.__oldSvg.isConnected };
  });
  expect(after.replaced).toBe(true);
  expect(after.oldGone).toBe(true);
  expect(after.t).toBeLessThan(before);
  expect(after.t).toBeLessThan(0.8);
}

test('字卡机制图有重播按钮且有效', async ({ page }) => {
  await page.goto('newhanzi/zika.html?zi=' + encodeURIComponent('付'));
  await expect(page.locator('.bigzi')).toHaveText('付', { timeout: 20000 });
  await expect(page.locator('.yw-diagram #fullChar')).toHaveText('付');
  await expectReplay(page, '.yw-diagram');
});

test('古诗知识卡“↻ 重播”有效', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('newhanzi/shici.html');
  const target = await page.evaluate(() => {
    const ks = window.NHZ_SHICI.knowledge || [];
    const i = ks.findIndex((k) => k['图示']);
    return i < 0 ? null : { i, m: ks[i].m };
  });
  expect(target, '有带图示的知识卡').toBeTruthy();
  await page.locator('.sc-card[data-go="know"]').click();
  await page.locator(`.sc-panel[data-midx="${target.m}"]`).click();
  await page.locator(`.sc-knowtitle[data-idx="${target.i}"]`).click();
  await expectReplay(page, '.sc-anim');
  expect(errors).toEqual([]);
});

test('古诗意象卡“↻ 重播”有效', async ({ page }) => {
  await page.goto('newhanzi/shici.html');
  const i = await page.evaluate(() => (window.NHZ_SHICI.imagery || []).findIndex((g) => g['图示']));
  test.skip(i < 0, '暂无带图示的意象');
  await page.locator('.sc-card[data-go="imagery"]').click();
  await page.locator(`.sc-imcard[data-im="${i}"]`).click();
  await page.locator(`.sc-imcard[data-im="${i}"] .sc-imfull`).click();
  await expectReplay(page, '.sc-anim');
});

test('字卡畸形编码链接显示友好错误，不卡在加载中', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('newhanzi/zika.html?zi=%E0%A4');
  await expect(page.locator('#app .err')).toContainText('编码', { timeout: 5000 });
  await expect(page.locator('.loading')).toHaveCount(0);
  expect(errors).toEqual([]);
});
