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

// GW 2026-11-07：A21 遗留「逐句对译点读」（guwen/duiyi.js，数据 句[] 由 tools/content/fix_gw_a21_duiyi.py 生成）
test.describe('guwen duiyi (A21)', () => {
  test('篇目页逐句对译：默认收起，展开后注字挂今义、点字今译同亮、停顿与句式', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/guwen.html');
    await page.locator('[data-mod="pianmu"]').first().click();
    await page.locator('[data-go="全部"]').click();
    await page.locator('.gw-item', { hasText: '陋室铭' }).first().click();
    await expect(page.locator('.gw-dy-body')).toBeHidden();
    await page.locator('[data-gwdy="toggle"]').click();
    await expect(page.locator('.gw-dy-row')).toHaveCount(9);
    const si = page.locator('.gw-dy-row').nth(2);
    await expect(si.locator('.dy-w', { hasText: '斯' }).locator('.dy-g')).toHaveText('这');
    await si.locator('.dy-w', { hasText: '斯' }).click();
    await expect(si.locator('.dy-m.on')).toHaveText('这');
    await expect(page.locator('.gw-dy-row').first().locator('.dy-t').first()).toHaveText('/');
    const last = page.locator('.gw-dy-row').nth(8);
    await expect(last.locator('.gw-dy-jin')).toContainText('有什么简陋的呢');
    await last.locator('.gw-from', { hasText: '何…之' }).click();
    await expect(page.locator('#gwmdetail')).toContainText('何…之');
    expect(errors).toEqual([]);
  });
  test('没有对译数据的篇目不出按钮（伯牙鼓琴 Q11 待定）', async ({ page }) => {
    await page.goto('newhanzi/guwen.html');
    await page.locator('[data-mod="pianmu"]').first().click();
    await page.locator('[data-go="全部"]').click();
    await page.locator('.gw-item', { hasText: '伯牙鼓琴' }).first().click();
    await expect(page.locator('.gw-yw')).toBeVisible();
    await expect(page.locator('[data-gwdy="toggle"]')).toHaveCount(0);
  });
});

// GW 2026-11-07：guwen.js 学段字段（tools/content/fix_gw_xueduan.py；供 Q10，不改默认显示）
test('guwen texts 学段 field: only 小学/初中/高中 with 学段源, default list unchanged', async ({ page }) => {
  await page.goto('newhanzi/guwen.html');
  const r = await page.evaluate(() => {
    const c = {};
    window.NHZ_GUWEN.texts.forEach((t) => { const k = t['学段'] || '无'; c[k] = (c[k] || 0) + 1; if (t['学段'] && !t['学段源']) c.bad = (c.bad || 0) + 1; });
    return c;
  });
  expect(r.bad).toBeUndefined();
  expect(Object.keys(r).sort()).toEqual(['初中', '小学', '无', '高中'].sort());
  expect(r['小学']).toBe(14);
  await page.locator('[data-mod="pianmu"]').first().click();
  await expect(page.locator('[data-go="全部"]')).toContainText('59');
});

// GW 2026-11-07：A22-15 P2-B 进阶路线补缺——无册次篇目按 学段 分出统编初中 / 高中两段，未标学段的才按分类排
test('guwen route groups no-ce texts by 学段 (P2-B)', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('newhanzi/guwen.html');
  await page.locator('[data-mod="pianmu"]').first().click();
  await page.locator('[data-go="__route"]').click();
  await expect(page.locator('#gwroute .gw-item')).toHaveCount(59);
  await expect(page.locator('[data-route-xd="初中"]')).toContainText('统编初中');
  await expect(page.locator('[data-route-xd="高中"]')).toContainText('统编高中');
  await expect(page.locator('.gw-route-sec').last()).toContainText('未标学段');
  expect(errors).toEqual([]);
});

// Q10（2026-11-08 负责人拍板）：篇目学段筛选按 学段 字段拆 小学/初中/高中/其他，未标归其他；知识点仍 小学/初高中；默认全部
test('guwen 篇目学段筛选 小学/初中/高中/其他 (Q10)', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('newhanzi/guwen.html');
  await page.locator('[data-mod="pianmu"]').first().click();
  const btn = (lv) => page.locator('#gwlist [data-tlevel="' + lv + '"]');
  await expect(btn('全部')).toHaveClass(/on/);
  await expect(btn('全部')).toContainText('59');
  await expect(btn('小学')).toContainText('14');
  await expect(btn('初中')).toContainText('21');
  await expect(btn('高中')).toContainText('7');
  await expect(btn('其他')).toContainText('17');
  await expect(page.locator('#gwlist [data-level="初高中"]')).toHaveCount(0);
  await btn('高中').click();
  await expect(page.locator('[data-go="全部"]')).toContainText('共7篇');
  await page.locator('[data-go="全部"]').click();
  await expect(page.locator('#gwlist .gw-item')).toHaveCount(7);
  await btn('其他').click();
  await expect(page.locator('#gwlist .gw-item')).toHaveCount(17);
  await expect(page.locator('#gwlist .gw-item', { hasText: '刻舟求剑' })).toHaveCount(1);
  // 知识点列表不受篇目筛选影响，仍是 小学/初高中
  await page.goto('newhanzi/guwen.html');
  await page.locator('[data-mod="wenhua"]').first().click();
  await expect(page.locator('#gwmlist [data-level="初高中"]')).toHaveCount(1);
  await expect(page.locator('#gwmlist [data-tlevel]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
