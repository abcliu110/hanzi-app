// 主读音：校验脚本 + 字卡罕用读音标注
const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const path = require('path');

test('主读音校验（newhanzi/tools/fix_pinyin.py check）', () => {
  execFileSync('python3', [path.resolve(__dirname, '../tools/fix_pinyin.py'), 'check'], { stdio: 'pipe', shell: true });
});

test('拼音音节校验（newhanzi/tools/check_pinyin_syllables.js）：3500 字读音可解析、标调位置合规', () => {
  execFileSync(process.execPath, [path.resolve(__dirname, '../tools/check_pinyin_syllables.js')], { stdio: 'pipe' });
});

test('音节解析器在浏览器里可用（pinyin/syllables.js + syllable.js）', async ({ page }) => {
  await page.goto('newhanzi/pinyin.html');
  await page.addScriptTag({ url: 'pinyin/syllables.js' });
  await page.addScriptTag({ url: 'pinyin/syllable.js' });
  const r = await page.evaluate(() => {
    const S = window.NHZPinyinSyllable;
    const a = S.parse('guì'), b = S.parse('qu4'), c = S.parse('gúi');
    return [a.initial, a.final, a.tone, b.final, b.audio, c.ok, c.errors[0].code, S.mark('liu', 2), S.LEGAL.length];
  });
  expect(r).toEqual(['g', 'uei', 4, 'ü', 'qu4', false, 'tone_position', 'liú', 415]);
});

test('Q17 拼音开关：逐字注音用 pron 覆盖 + 查表主音，@行号 只对该行生效', async ({ page }) => {
  await page.goto('newhanzi/shici.html#poem-34'); // 春晓（主脚本是 IIFE，openPoem 不挂 window，用 hash 路由进详情）
  await expect(page.locator('.sc-readbar [data-rb=py]')).toBeVisible();
  await expect(page.locator('.sc-memo-tip').first()).toContainText('觉读 jiào');
  await expect(page.locator('.sc-memo-tip').first()).toContainText('处读 chù');
  await page.click('.sc-readbar [data-rb=py]');
  await expect(page.locator('.sc-lines')).toHaveClass(/py/);
  const py = await page.evaluate(() => {
    const m = {};
    document.querySelectorAll('.sc-line .hzpy').forEach((el) => {
      m[el.querySelector('.hz').textContent] = el.querySelector('i').textContent;
    });
    return m;
  });
  expect(py['觉']).toBe('jiào');
  expect(py['处']).toBe('chù');
  expect(py['春']).toBe('chūn');
  expect(py['眠']).toBe('mián');
  // 再点一次关闭注音
  await page.click('.sc-readbar [data-rb=py]');
  await expect(page.locator('.sc-line .hzpy')).toHaveCount(0);
  // @行号：将进酒「将进酒」qiāng，但「呼儿将出」仍是 jiāng
  // 注意：同页只改 hash 不会重载（应用只在加载时读一次 hash），加 ?r=2 强制重载
  await page.goto('newhanzi/shici.html?r=2#poem-10');
  await page.click('.sc-readbar [data-rb=py]');
  const jj = await page.evaluate(() => {
    const rows = [];
    document.querySelectorAll('.sc-line').forEach((el, i) => {
      el.querySelectorAll('.hzpy').forEach((w) => {
        if (w.querySelector('.hz').textContent === '将') rows.push([i, w.querySelector('i').textContent]);
      });
    });
    return rows;
  });
  expect(jj).toEqual([[12, 'qiāng'], [26, 'jiāng']]);
  await expect(page.locator('.sc-memo-tip').first()).toContainText('将读 qiāng（第13句）');
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
