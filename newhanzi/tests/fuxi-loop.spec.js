// 阶段三「学习回路闭环」（2026-11-07 fuxi-loop）：每日复习接入、填空/简答自评、周报复习数据
const { test, expect } = require('@playwright/test');

function seed() {
  const DAY = 86400000, now = Date.now();
  const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return 'q' + (h < 0 ? -h : h); };
  const idOf = (it) => hash(it.q + '\n' + (it.options || []).join('\n') + '\n' + it.answer);
  const a = { q: '“春眠不觉晓”的下一句是？', options: ['处处闻啼鸟', '夜来风雨声'], answer: '处处闻啼鸟', 解析: '', src: '古诗', point: '春晓' };
  const b = { q: '填空：举头望明月，____。', options: [], answer: '低头思故乡', 解析: '', src: '易错读音', point: '静夜思' };
  const orphan = 'q999';
  a.id = idOf(a); b.id = idOf(b);
  a.addedAt = now - 3 * DAY; b.addedAt = now - DAY;
  const srs = {};
  srs[a.id] = { iv: 1, next: now - DAY };          // 到期（有题面）
  srs[b.id] = { iv: 0, next: now + DAY };          // 回炉（iv=0 未到期）
  srs[orphan] = { iv: 2, next: now - DAY };        // 孤儿：无题面，不计数
  return { wrong: [a, b], srs, ids: [a.id, b.id] };
}

test.describe('fuxi loop', () => {
  test('home count = fuxi queue; answering writes back and leaves today queue', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    const s = seed();
    await page.goto('newhanzi/index.html');
    await page.evaluate((s) => {
      localStorage.clear();
      localStorage.setItem('nhz_wrong', JSON.stringify(s.wrong));
      localStorage.setItem('nhz_srs', JSON.stringify(s.srs));
      localStorage.setItem('nhz_queue_cfg', JSON.stringify({ newPerDay: 0, maxPerSession: 25 }));
    }, s);
    await page.reload();
    await expect(page.locator('#stReview')).toHaveText('2');
    await expect(page.locator('#ttRows')).toContainText('有 2 道待复习（到期 1 · 错题回炉 1）');
    await expect(page.locator('#ttRows a[href="fuxi.html"]')).toContainText('去复习');

    await page.goto('newhanzi/fuxi.html');
    const cards = page.locator('.fx-qcard');
    await expect(cards).toHaveCount(2);
    // 到期题：直接点选作答（答对 -> 推进间隔）
    const due = page.locator('.fx-qcard[data-seg="due"]');
    await due.locator('.fx-pick', { hasText: '处处闻啼鸟' }).click();
    await expect(due).toHaveClass(/fx-done/);
    await expect(due.locator('.fx-res')).toContainText('记得');
    // 回炉题：无选项 -> 显示答案 -> 忘了
    const retry = page.locator('.fx-qcard[data-seg="retry"]');
    await retry.locator('[data-act="show"]').click();
    await expect(retry.locator('.fx-ans')).toBeVisible();
    await retry.locator('[data-act="forget"]').click();
    await expect(page.locator('#fxHead')).toContainText('本节做完了');

    const st = await page.evaluate((ids) => {
      const srs = JSON.parse(localStorage.getItem('nhz_srs'));
      const log = JSON.parse(localStorage.getItem('nhz_review_log'));
      const d = Object.keys(log.days)[0];
      return { a: srs[ids[0]], b: srs[ids[1]], n: log.days[d].n, ok: log.days[d].ok,
        star: JSON.parse(localStorage.getItem('nhz_stars') || '{}').total || 0 };
    }, s.ids);
    expect(st.a.iv).toBe(2);
    expect(st.b.iv).toBe(0);
    expect(st.n).toBe(2);
    expect(st.ok).toBe(1);
    expect(st.star).toBe(1);

    // 刷新：今天做过的题不再回到队列（忘了的那道明天再来）
    await page.reload();
    await expect(page.locator('.fx-qcard')).toHaveCount(0);
    await expect(page.locator('#fxHead')).toContainText('今天已复习 2 道');

    await page.goto('newhanzi/index.html');
    await expect(page.locator('#stReview')).toHaveText('0');
    await expect(page.locator('#ttRows')).toContainText('今天已复习 2 道');
    await expect(page.locator('#ttRows input[data-task="review"]')).toBeChecked();
    expect(errors).toEqual([]);
  });

  test('wrong book groups by source', async ({ page }) => {
    const s = seed();
    await page.goto('newhanzi/fuxi.html');
    await page.evaluate((s) => {
      localStorage.clear();
      localStorage.setItem('nhz_wrong', JSON.stringify(s.wrong));
      localStorage.setItem('nhz_srs', JSON.stringify(s.srs));
      localStorage.setItem('nhz_queue_cfg', JSON.stringify({ newPerDay: 0, maxPerSession: 25 }));
    }, s);
    await page.reload();
    await page.locator('.fx-wb summary').click();
    await page.locator('.fx-chip', { hasText: '易错读音' }).click();
    await expect(page.locator('[data-wrong]')).toHaveCount(1);
    await expect(page.locator('[data-wrong]')).toContainText('举头望明月');
  });
});

// A23 提取练习升级（FUXI）：填空·自己写 / 简答·自评，题目由已有数据自动生成，记入 NHZReview
test.describe('fuxi recall practice (A23 提取练习)', () => {
  test('recall mode: typed exact answer auto-correct; self-grade wrong goes to nhz_wrong', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/quiz/index.html?tab=zika');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const card = page.locator('.qz-mode[data-mode="recall"]');
    await expect(card).toContainText('填空·自己写');
    await expect(card).toContainText('50 题');
    await card.click();
    // 第 1 题：照题面在 blank 题库里找答案，写对 -> 直接算对
    const s1 = await page.locator('#qbox .qz-sent').innerText();
    const ans = await page.evaluate((txt) => {
      const b = window.NHZ_QUIZ.modes.blank.find((q) => q.s.replace(/___/g, '____') === txt.trim());
      return b ? b.opts[b.a] : null;
    }, s1);
    expect(ans).not.toBeNull();
    await page.fill('#qzShortIn', ans);
    await page.click('[data-act="scheck"]');
    await expect(page.locator('#qfb')).toContainText('答对了');
    await page.click('#btnNext');
    // 第 2 题：不写，对答案 -> 亮出参考答案 -> 没答对
    await page.click('[data-act="scheck"]');
    await expect(page.locator('#qzSelf')).toBeVisible();
    await expect(page.locator('#qzSelf')).toContainText('参考答案');
    await page.click('[data-act="sself"][data-ok="0"]');
    await expect(page.locator('#qfb')).toContainText('答错了');
    const st = await page.evaluate(() => ({
      wrong: JSON.parse(localStorage.getItem('nhz_wrong') || '[]'),
      srs: JSON.parse(localStorage.getItem('nhz_srs') || '{}'),
      qw: JSON.parse(localStorage.getItem('nhz_quiz_wrong') || '{}')
    }));
    expect(st.wrong.length).toBe(1);
    expect(st.wrong[0].q.startsWith('填空：')).toBe(true);
    expect(st.wrong[0].options).toEqual([]);
    expect(st.srs[st.wrong[0].id].iv).toBe(0);
    expect(st.qw.zika.recall.length).toBe(1);
    expect(errors).toEqual([]);
  });

  test('self-grade correct counts; guwen generates 重点词 recall and 句.今 short', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/quiz/index.html?tab=guwen');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const rc = page.locator('.qz-mode[data-mode="recall"]');
    await expect(rc).toBeVisible({ timeout: 15000 });
    const n = (s) => parseInt(s.match(/(\d+) 题/)[1], 10);
    expect(n(await rc.innerText())).toBeGreaterThanOrEqual(700);
    expect(n(await page.locator('.qz-mode[data-mode="short"]').innerText())).toBeGreaterThanOrEqual(61);
    await page.locator('.qz-mode[data-mode="short"]').click();
    await page.fill('#qzShortIn', '随便写写');
    await page.click('[data-act="scheck"]');
    await page.click('[data-act="sself"][data-ok="1"]');
    await expect(page.locator('#qfb')).toContainText('答对了');
    await expect(page.locator('#qzShortIn')).toHaveJSProperty('readOnly', true);
    expect(await page.evaluate(() => (JSON.parse(localStorage.getItem('nhz_wrong') || '[]')).length)).toBe(0);
    // ?text= 篇名：只出这一篇的产出题
    await page.goto('newhanzi/quiz/index.html?tab=guwen&text=' + encodeURIComponent('学弈'));
    await expect(page.locator('.qz-mode[data-mode="recall"]')).toBeVisible({ timeout: 15000 });
    await page.locator('.qz-mode[data-mode="recall"]').click();
    await expect(page.locator('#qbox .qz-q')).toContainText('《学弈》');
    expect(errors).toEqual([]);
  });
});

// A23 选项级反馈（FUXI）：quiz 引擎误解显示各区生效（古文、错题重练）+ 复习页点错选项也显示误解
test.describe('fuxi option-level feedback (A23 选项级反馈)', () => {
  const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return 'q' + (h < 0 ? -h : h); };

  test('fuxi review: wrong pick on choice / judge shows misconception', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('newhanzi/fuxi.html');
    // 按 quiz 引擎 finishQuestion 的记录口径造两道到期错题：逻辑 choice 一道、语法 judge 一道
    const items = await page.evaluate(() => {
      const pools = window.NHZ_POOLS;
      const lg = pools.find((p) => p.tab === 'logic'), yw = pools.find((p) => p.tab === 'yuwen');
      const c = lg.modes.choice.find((q) => q['误解标注'] && q['误解标注'].length);
      const j = yw.modes.judge.find((q) => q['误解标注'] && q['误解标注'].length);
      const mzC = c['误解标注'][0], mzJ = j['误解标注'][0];
      return [
        { it: { q: c.q, options: c.opts, answer: c.opts[c.a], 解析: c.exp || '', src: '练习', point: '逻辑 · 选择题' },
          pick: mzC['选项文本'], mz: mzC['误解'] },
        { it: { q: j.q, options: ['正确', '错误'], answer: j.a ? '正确' : '错误', 解析: j.exp || '', src: '练习', point: '语法 · 判断题' },
          pick: mzJ['选项'] === 'A' ? '错误' : '正确', mz: mzJ['误解'] }
      ];
    });
    const now = Date.now(), wrong = [], srs = {};
    items.forEach((x, i) => {
      const id = hash(x.it.q + '\n' + x.it.options.join('\n') + '\n' + x.it.answer);
      x.id = id;
      wrong.push(Object.assign({ id, addedAt: now - 86400000 * (2 + i) }, x.it));
      srs[id] = { iv: 1, next: now - 86400000 };
    });
    await page.evaluate(([wrong, srs]) => {
      localStorage.clear();
      localStorage.setItem('nhz_wrong', JSON.stringify(wrong));
      localStorage.setItem('nhz_srs', JSON.stringify(srs));
      localStorage.setItem('nhz_queue_cfg', JSON.stringify({ newPerDay: 0, maxPerSession: 25 }));
    }, [wrong, srs]);
    await page.reload();
    for (const x of items) {
      const card = page.locator(`.fx-qcard[data-qid="${x.id}"]`);
      await card.locator('.fx-pick', { hasText: x.pick }).first().click();
      await expect(card.locator('.fx-miscon')).toContainText(x.mz.slice(0, 8));
      await expect(card.locator('.fx-ans')).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test('quiz: guwen choice and 错题重练 show misconception', async ({ page }) => {
    await page.goto('newhanzi/quiz/index.html?tab=guwen');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.locator('[data-mode="choice"]').click({ timeout: 15000 });
    const pickWrong = async (modeKey) => {
      const qt = (await page.locator('#qbox .qz-q').innerText()).trim();
      const btns = page.locator('#qbox button[data-act="pick"]');
      const texts = (await btns.allInnerTexts()).map((t) => t.trim());
      // 同题干可能有多道（义项题），按题干 + 选项集合对上
      const q = await page.evaluate(([qt, m, texts]) => window.NHZ_QUIZ.modes[m].find((x) => x.q === qt &&
        x.opts.length === texts.length && x.opts.every((o) => texts.indexOf(String(o).trim()) >= 0)), [qt, modeKey, texts]);
      const mz = q['误解标注'][0];
      await btns.nth(texts.indexOf(mz['选项文本'])).click();
      await expect(page.locator('.qz-miscon')).toContainText(mz['误解'].slice(0, 8));
    };
    await pickWrong('choice');
    // 刚答错的进了 quiz 错题本：回首页 -> 错题重练，再答错同一道仍有误解提示
    await page.click('#btnBack');
    await page.locator('[data-mode="wrong"]').click();
    await pickWrong('choice');
  });
});
