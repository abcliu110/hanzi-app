// D2 2026-11-08：quiz 引擎一轮题数上限 20（负责人拍板「题量大的题库每轮上限 20 题」；quiz/engine.js pickRound）
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const vm = require('vm');
// engine.js 顶层会写 window.NHZReview 等，node 下给一个空 window 跑，取 module.exports（无 document，不会 init）
function loadEngine() {
  const ctx = { window: {}, module: { exports: {} }, console };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'quiz', 'engine.js'), 'utf8'), ctx);
  return ctx.module.exports;
}
const E = loadEngine();

test.describe('quiz round cap 20', () => {
  test('pickRound: >20 抽 20 不重复；≤20 原样全量；错题优先', () => {
    expect(E.ROUND_MAX).toBe(20);
    const big = Array.from({ length: 100 }, (_, i) => ({ q: 'q' + i }));
    const r = E.pickRound(big, 20);
    expect(r.length).toBe(20);
    expect(new Set(r.map((x) => x.q)).size).toBe(20);
    r.forEach((x) => expect(big).toContain(x));
    const small = big.slice(0, 20);
    const s = E.pickRound(small, 20);
    expect(s.length).toBe(20);
    expect(s.map((x) => x.q).sort()).toEqual(small.map((x) => x.q).sort());
    expect(E.pickRound(big.slice(0, 7), 20).length).toBe(7);
    // 错题优先：5 道错题必在本轮
    const wk = {};
    [3, 41, 57, 88, 99].forEach((i) => { wk[JSON.stringify(big[i])] = 1; });
    for (let k = 0; k < 5; k++) {
      const w = E.pickRound(big, 20, wk).map((x) => x.q);
      expect(w.length).toBe(20);
      ['q3', 'q41', 'q57', 'q88', 'q99'].forEach((q) => expect(w).toContain(q));
    }
    // 错题多于 20 道时也只出 20
    const wkAll = {};
    big.slice(0, 30).forEach((x) => { wkAll[JSON.stringify(x)] = 1; });
    const w2 = E.pickRound(big, 20, wkAll);
    expect(w2.length).toBe(20);
    w2.forEach((x) => expect(wkAll[JSON.stringify(x)]).toBe(1));
    // 不改原数组
    expect(big[0].q).toBe('q0');
    expect(big.length).toBe(100);
  });

  test('古文选择 1993 题：一轮 20 题，卡片标「每轮 20」', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/quiz/index.html?tab=guwen');
    const card = page.locator('.qz-mode[data-mode="choice"]').first();
    await expect(card.locator('.qz-mode-n')).toContainText('每轮 20', { timeout: 15000 });
    await card.click();
    await expect(page.locator('#qzProg')).toHaveText('1/20');
    expect(errors).toEqual([]);
  });

  test('题库 ≤20 的模式不变（实验室 order 20 题 → 1/20，无「每轮」标）', async ({ page }) => {
    await page.goto('newhanzi/quiz/index.html?tab=lab');
    const card = page.locator('.qz-mode[data-mode="order"]').first();
    await expect(card.locator('.qz-mode-n')).toHaveText('20 题', { timeout: 15000 });
    await card.click();
    await expect(page.locator('#qzProg')).toHaveText('1/20');
  });

  test('错题本里的题优先进本轮（字卡选择）', async ({ page }) => {
    await page.goto('newhanzi/quiz/index.html?tab=zika');
    await expect(page.locator('.qz-mode[data-mode="choice"]').first()).toBeVisible({ timeout: 15000 });
    const picked = await page.evaluate(() => {
      const qs = window.NHZ_QUIZ.modes.choice.slice(-3);
      localStorage.setItem('nhz_quiz_wrong', JSON.stringify({ zika: { choice: qs } }));
      return qs.map((q) => q.q);
    });
    await page.reload();
    await page.locator('.qz-mode[data-mode="choice"]').first().click({ timeout: 15000 });
    await expect(page.locator('#qzProg')).toHaveText('1/20');
    const seen = [];
    for (let k = 0; k < 20; k++) {
      seen.push(await page.locator('#qbox .qz-q').innerText());
      await page.locator('#qbox button[data-act="pick"]').first().click();
      await page.locator('#btnNext').click();
    }
    picked.forEach((q) => expect(seen).toContain(q));
  });
});
