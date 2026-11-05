// 主读音：校验脚本 + 字卡罕用读音标注
const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const path = require('path');

test('主读音校验（newhanzi/tools/fix_pinyin.py check）', () => {
  execFileSync('python3', [path.resolve(__dirname, '../tools/fix_pinyin.py'), 'check'], { stdio: 'pipe', shell: true });
});

test('首页索引用常用音，字卡把古音/罕用音单独标注', async ({ page }) => {
  await page.goto('newhanzi/index.html');
  const idx = await page.evaluate(() => {
    const m = {}; (window.NHZ_INDEX || []).forEach((e) => { m[e.z] = e.py; }); return m;
  });
  expect(idx['们']).toBe('men');
  expect(idx['伯']).toBe('bó');
  expect(idx['瀑']).toBe('pù');
  expect(idx['戌']).toBe('xū');
  await page.goto('newhanzi/zika.html?zi=' + encodeURIComponent('佛'));
  await expect(page.locator('.bigzi')).toHaveText('佛', { timeout: 20000 });
  await expect(page.locator('.hero .pinyin')).toContainText('fó、fú');
  await expect(page.locator('.hero .pinyin .py-rare')).toContainText('bì、bó');
});
