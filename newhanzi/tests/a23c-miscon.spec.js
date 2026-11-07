// A23C 选项级误解反馈：各区 choice / judge 题答错时显示该选项的「误解标注」（engine.js buildExp）
// 运行：PW_NO_SERVER=1 PORT=4208 npx playwright test tests/a23c-miscon.spec.js
const { test, expect } = require('@playwright/test');

const TABS = ['yuwen', 'logic', 'shici', 'zika', 'bushou', 'lab'];

async function findQ(page, mode) {
  const qt = await page.locator('#qbox .qz-q').innerText();
  const shown = (await page.locator('#qbox button[data-act="pick"]').allInnerTexts()).map((t) => t.trim()).sort().join('|');
  return page.evaluate(([qt, mode, shown]) => {
    const arr = window.NHZ_QUIZ.modes[mode] || [];
    const norm = (s) => String(s).replace(/\s+/g, '');
    // 同题干的题不止一道（如识字「下面词语中字形正确的是？」），choice 再按显示的选项对上
    const hits = arr.filter((x) => norm(qt).includes(norm(x.q)));
    const it = hits.find((x) => !shown || (x.opts || []).map((o) => String(o).trim()).sort().join('|') === shown) || hits[0];
    return it ? JSON.parse(JSON.stringify(it)) : null;
  }, [qt, mode, shown]);
}

for (const tab of TABS) {
  test(`A23C ${tab} choice wrong pick shows misconception`, async ({ page }) => {
    await page.goto('newhanzi/quiz/index.html?tab=' + tab);
    await page.locator('[data-mode="choice"]').first().click({ timeout: 15000 });
    const q = await findQ(page, 'choice');
    expect(q, 'question found in bank').toBeTruthy();
    const btns = page.locator('#qbox button[data-act="pick"]');
    const texts = await btns.allInnerTexts();
    const wrongText = q.opts.find((o, k) => k !== q.a);
    const pos = texts.findIndex((t) => t.trim() === wrongText.trim());
    expect(pos).toBeGreaterThanOrEqual(0);
    await btns.nth(pos).click();
    const mz = q['误解标注'].find((z) => z['选项文本'] === wrongText);
    expect(mz).toBeTruthy();
    await expect(page.locator('.qz-miscon')).toContainText(mz['误解'].slice(0, 8));
  });

  test(`A23C ${tab} judge wrong answer shows misconception`, async ({ page }) => {
    await page.goto('newhanzi/quiz/index.html?tab=' + tab);
    await page.locator('[data-mode="judge"]').first().click({ timeout: 15000 });
    const q = await findQ(page, 'judge');
    expect(q, 'question found in bank').toBeTruthy();
    // data-i=1 是「对」，data-i=0 是「错」；故意答错
    await page.locator(`#qbox button[data-act="judge"][data-i="${q.a ? 0 : 1}"]`).click();
    await expect(page.locator('.qz-miscon')).toContainText(q['误解标注'][0]['误解'].slice(0, 8));
  });
}

test('A23C zika blank wrong pick shows misconception (批2)', async ({ page }) => {
  await page.goto('newhanzi/quiz/index.html?tab=zika');
  await page.locator('[data-mode="blank"]').first().click({ timeout: 15000 });
  const qt = await page.locator('#qbox').innerText();
  const q = await page.evaluate((qt) => {
    const norm = (s) => String(s).replace(/\s+/g, '').replace(/（[^）]*）/g, '').replace(/_+/g, '');
    const it = window.NHZ_QUIZ.modes.blank.find((x) => norm(qt).includes(norm(x.s)));
    return it ? JSON.parse(JSON.stringify(it)) : null;
  }, qt);
  expect(q, 'question found in bank').toBeTruthy();
  const mz = q['误解标注'][0];
  const btns = page.locator('#qbox button[data-act="pick"]');
  const texts = (await btns.allInnerTexts()).map((t) => t.trim());
  await btns.nth(texts.indexOf(mz['选项文本'])).click();
  await expect(page.locator('.qz-miscon')).toContainText(mz['误解'].slice(0, 8));
});

// 批3：语法/实验/逻辑 spot 与逻辑 blank——只有部分题有标注，进页前把该模式题池滤成带标注的题，保证抽到可测的题
for (const [tab, mode] of [['lab', 'spot']]) {
  test(`A23C ${tab} ${mode} wrong pick shows misconception (批3)`, async ({ page }) => {
    await page.addInitScript((mode) => {
      let v;
      Object.defineProperty(window, 'NHZ_QUIZ', {
        configurable: true,
        get: () => v,
        set: (o) => {
          if (o && o.modes && Array.isArray(o.modes[mode])) o.modes[mode] = o.modes[mode].filter((q) => q['误解标注'] && q['误解标注'].length);
          v = o;
        },
      });
    }, mode);
    await page.goto('newhanzi/quiz/index.html?tab=' + tab);
    await page.locator(`[data-mode="${mode}"]`).first().click({ timeout: 15000 });
    const qt = await page.locator('#qbox').innerText();
    const q = await page.evaluate(([qt, mode]) => {
      const norm = (s) => String(s).replace(/\s+/g, '').replace(/_+/g, '');
      const it = window.NHZ_QUIZ.modes[mode].find((x) => norm(qt).includes(norm(x.s)));
      return it ? JSON.parse(JSON.stringify(it)) : null;
    }, [qt, mode]);
    expect(q, 'question found in bank').toBeTruthy();
    const mz = q['误解标注'][0];
    const btns = page.locator('#qbox button[data-act="pick"]');
    const texts = (await btns.allInnerTexts()).map((t) => t.trim());
    const pos = texts.indexOf(mz['选项文本']);
    expect(pos).toBeGreaterThanOrEqual(0);
    await btns.nth(pos).click();
    await expect(page.locator('.qz-miscon')).toContainText(mz['误解'].slice(0, 8));
    await expect(page.locator('.qz-pair')).toContainText(mz['正反例'][0].slice(0, 4));
  });
}
