// 拼音区 · 易错读音（多音字 duoyin / 易读错的字 yicuo / 审音改读 shenyin / 古诗文读音 gushidu）
// 菜单在 12 个知识点之后成小分组；进页、浅中深、答题判分（答错进错题本）、听音题、返回；768 / 1280 无横向溢出。
// 截图：设 SHOTS_DIR=/某目录 时把每张卡 768 / 1280 的整页截图存进去（人工看）。
const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const path = require('path');

const CARDS = [['duoyin', '多音字'], ['yicuo', '易读错的字'], ['shenyin', '审音改读'], ['gushidu', '古诗文读音']];
const SHOTS = process.env.SHOTS_DIR || '';

test('易错读音内容校验（check_pinyin_content.js：格式 + 读音在 3500 字库里）', () => {
  execFileSync(process.execPath, [path.resolve(__dirname, '../tools/check_pinyin_content.js')], { stdio: 'pipe' });
});

test('菜单：12 个知识点之后是「易错读音」小分组，四张卡按顺序', async ({ page }) => {
  await page.goto('newhanzi/pinyin.html');
  const seq = await page.locator('#pyGrid > *').evaluateAll((els) => els.map((e) => e.classList.contains('py-grp-h') ? '#' + e.textContent : e.getAttribute('data-id')));
  expect(seq.length).toBe(17);
  expect(seq[11]).toBe('yinjiebiao');
  expect(seq.slice(12)).toEqual(['#易错读音', 'duoyin', 'yicuo', 'shenyin', 'gushidu']);
  await expect(page.locator('.py-card[data-id="shenyin"]')).toContainText('审音改读');
  await expect(page.locator('.py-card[data-id="gushidu"]')).toContainText('古诗文读音');
});

/* 当前题的答案下标（按题面在内容数据里找；data-i = 原下标） */
async function answerOf(quiz) {
  return quiz.evaluate((box) => {
    const id = box.closest('.kp').getAttribute('data-kp'), C = window.NHZ_PY_CONTENT[id];
    const plain = (s) => String(s).replace(/\{(?:py|zi):([^}]*)\}/g, '$1');
    const q = box.querySelector('.qq').textContent.replace(/\s*▶ 听$/, '').trim();
    for (const st of ['lian']) for (const b of C[st]) for (const it of (b.items || [])) if (plain(it.q).trim() === q) return it.answer;
    return -1;
  });
}

for (const [id, name] of CARDS) {
  test(`易错读音 · ${name}：进页、浅中深、答对 / 答错（进错题本）、返回`, async ({ page }) => {
    const errs = []; page.on('pageerror', (e) => errs.push(e.message));
    await page.addInitScript(() => { window.speechSynthesis && (window.speechSynthesis.speak = () => { window.__usedTTS = true; }); });
    await page.goto('newhanzi/pinyin.html');
    await page.evaluate(() => { localStorage.removeItem('nhz-py-lv'); localStorage.removeItem('nhz_wrong'); localStorage.removeItem('nhz_srs'); });
    await page.click(`.py-card[data-id="${id}"]`);
    const kp = page.locator(`.kp[data-kp="${id}"]`);
    await expect(kp).toBeVisible();
    await expect(kp.locator('.kp-head h2')).toHaveText(name);
    await expect(page.locator('.stage')).toHaveCount(4);
    await expect(kp.locator('.blk[data-type="table"]').first()).toBeVisible();
    if (id === 'shenyin') {
      await expect(kp).toContainText('1985');
      await expect(kp).toContainText('征求意见稿');
      await expect(kp).toContainText('拟改');
    }
    if (id === 'gushidu') {
      // 课本核过的读音按现状展示；争议项（鹿柴「返景」等）不收进表格
      await expect(kp).toContainText('不觉晓');
      await expect(kp.locator('.blk[data-type="table"]', { hasText: '返景入深林' })).toHaveCount(0);
    }
    // 浅中深
    await page.click('.kp-seg button[data-lv="1"]');
    await expect(kp.locator('.blk[data-lv="2"]').first()).toBeHidden();
    await page.click('.kp-seg button[data-lv="3"]');
    await expect(kp.locator('.blk[data-lv="3"]').first()).toBeVisible();
    await expect(kp.locator('.blk[data-lv="2"]').first()).toBeVisible();
    await page.click('.kp-seg button[data-lv="2"]');
    await expect(kp.locator('.blk[data-lv="3"]').first()).toBeHidden();
    // 答题：当前档位第一道选择题，答对 → 下一题答错 → 错题本多一条（point = 卡名）
    const quiz = kp.locator('#kp-lian .blk[data-type="quiz-choose"]:not(.lvhide) .quiz').first();
    await quiz.scrollIntoViewIfNeeded();
    const a1 = await answerOf(quiz);
    expect(a1).toBeGreaterThanOrEqual(0);
    await quiz.locator(`.qopt[data-i="${a1}"]`).click();
    await expect(quiz.locator('.qfb')).toContainText('对了');
    await expect(quiz.locator('.qscore')).toHaveText('答对 1 / 1');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nhz_wrong') || '[]').length)).toBe(0);
    await quiz.locator('[data-q="next"]').click();
    const a2 = await answerOf(quiz);
    await quiz.locator(`.qopt:not([data-i="${a2}"])`).first().click();
    await expect(quiz.locator('.qfb')).toContainText('再想想');
    await expect(quiz.locator('.qopt.right')).toHaveCount(1);
    await expect(quiz.locator('.qscore')).toHaveText('答对 1 / 2');
    const wrong = await page.evaluate(() => JSON.parse(localStorage.getItem('nhz_wrong') || '[]'));
    expect(wrong.length).toBe(1);
    expect(wrong[0].point).toBe(name);
    expect(wrong[0].src).toBe('拼音');
    expect(wrong[0].options).toContain(wrong[0].answer);
    expect(wrong[0].q).not.toMatch(/\{py:|\{zi:/);
    expect(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('nhz_srs') || '{}')).length)).toBe(1);
    // 听音题：▶ 听 播放真人录音（不用 TTS）
    const hear = kp.locator('#kp-lian .blk[data-type="quiz-choose"]:not(.lvhide) .quiz:has([data-q="hear"])').first();
    await hear.locator('[data-q="hear"]').click();
    expect(await page.evaluate(() => window.NHZPinyinAudio.last)).toMatch(/pinyin\/audio\/cmn-[a-z]+[1-4]\.mp3$/);
    expect(await page.evaluate(() => !!window.__usedTTS)).toBe(false);
    // 返回
    await page.evaluate(() => window.NHZNav.up());
    await expect(page.locator('#pyHome')).toBeVisible();
    await expect(page.locator('.py-card[data-id="duoyin"]')).toBeVisible();
    expect(errs).toEqual([]);
  });
}

for (const w of [768, 1280]) {
  test(`易错读音 · ${w}px 无横向溢出（深档全开）${SHOTS ? '，存截图' : ''}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto('newhanzi/pinyin.html');
    await page.evaluate(() => localStorage.setItem('nhz-py-lv', '3'));
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `menu-${w}.png`), fullPage: true });
    for (const [id] of CARDS) {
      await page.goto('newhanzi/pinyin.html?t=' + id);
      await expect(page.locator(`.kp[data-kp="${id}"]`)).toBeVisible();
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(ov, id + ' 横向溢出').toBeLessThanOrEqual(0);
      if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${id}-${w}.png`), fullPage: true });
    }
  });
}

test('古诗文读音：数据与诗库 pron 一致（生成脚本 --check），争议项不收，题目都进「古诗文读音」错题本', async ({ page }) => {
  execFileSync('python3', [path.resolve(__dirname, '../tools/content/gen_py_gushidu.py'), '--check'], { stdio: 'pipe' });
  await page.goto('newhanzi/pinyin.html?t=gushidu');
  await expect(page.locator('.kp[data-kp="gushidu"]')).toBeVisible();
  const r = await page.evaluate(() => {
    const C = window.NHZ_PY_CONTENT.gushidu;
    const skip = C.gushiSkip.map((x) => x.join('|'));
    return {
      n: C.gushi.length,
      skipHit: C.gushi.filter((g) => skip.indexOf(g.t + '|' + g.z) >= 0).length,
      skipN: skip.length,
      chunxiao: (C.gushi.find((g) => g.t === '春晓' && g.z === '觉') || {}).py,
      shuai: C.gushi.filter((g) => g.z === '衰').map((g) => g.py),
      xiaochi: (C.gushi.find((g) => g.t === '小池' && g.z === '头') || {}).py,
      hear: C.lian.filter((b) => b.kind === 'hear').reduce((a, b) => a + b.items.length, 0),
      rv: Array.from(new Set(C.lian.map((b) => b.rv)))
    };
  });
  expect(r.n).toBeGreaterThan(100);
  expect(r.skipN).toBe(3);
  expect(r.skipHit).toBe(0);
  expect(r.chunxiao).toBe('jué');
  expect(r.shuai).toEqual(['shuāi', 'shuāi']);
  expect(r.xiaochi).toBe('tóu');
  expect(r.hear).toBeGreaterThan(10);
  expect(r.rv).toEqual(['古诗文读音']);
});
