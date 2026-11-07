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

test('拼音页简介芯片可听（&brief=1 只看 data.js 简介）：单韵母四声、声调芯片、声母待录音、无音频芯片不可点、署名', async ({ page }) => {
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.addInitScript(() => { window.speechSynthesis && (window.speechSynthesis.speak = () => { window.__usedTTS = true; }); });
  await page.goto('newhanzi/pinyin.html?t=danyunmu&brief=1');
  await expect(page.locator('#pyCredit')).toContainText('CC BY-SA 3.0');
  await expect(page.locator('.py-chip.is-play')).toHaveCount(6);
  await page.click('.py-chip[data-show="ü"]');
  await expect(page.locator('.py-tones .py-tone')).toHaveCount(4);
  await expect(page.locator('.py-tones .py-tone').nth(2)).toHaveText('ǚ');
  const req = page.waitForRequest((r) => r.url().endsWith('/pinyin/audio/cmn-yu3.mp3'));
  await page.click('.py-tone[data-tone="3"]');
  await req;
  await page.click('.py-chip[data-show="ü"]'); // 再点收起
  await expect(page.locator('.py-tones')).toHaveCount(0);
  // 声调芯片直接播
  await page.goto('newhanzi/pinyin.html?t=shengdiao&brief=1');
  const r2 = page.waitForRequest((r) => r.url().endsWith('/pinyin/audio/cmn-a4.mp3'));
  await page.click('.py-chip[data-kind="tone"][data-tone="4"]');
  await r2;
  // 声母：呼读音未录 → 待录音，不可点
  await page.goto('newhanzi/pinyin.html?t=shengmu&brief=1');
  await expect(page.locator('.py-chip.is-wait')).toHaveCount(21);
  await expect(page.locator('.py-chip.is-wait').first()).toContainText('待录音');
  await expect(page.locator('.py-chip.is-play')).toHaveCount(0);
  // 鼻韵母：ong 单念没有音频 → 不可点
  await page.goto('newhanzi/pinyin.html?t=biyunmu&brief=1');
  await expect(page.locator('.py-chip.is-mute')).toHaveText(['ong']);
  await page.click('.py-chip[data-show="un"]');
  await expect(page.locator('.py-tones')).toContainText('wen');
  // 整体认读 16 个都能听
  await page.goto('newhanzi/pinyin.html?t=zhengti&brief=1');
  await expect(page.locator('.py-chip.is-play')).toHaveCount(16);
  expect(await page.evaluate(() => !!window.__usedTTS)).toBe(false);
  expect(errs).toEqual([]);
});

test('Q17 拼音开关：逐字注音用 pron 覆盖 + 查表主音，@行号 只对该行生效', async ({ page }) => {
  await page.goto('newhanzi/shici.html#poem-34'); // 春晓（主脚本是 IIFE，openPoem 不挂 window，用 hash 路由进详情）
  await expect(page.locator('.sc-readbar [data-rb=py]')).toBeVisible();
  await expect(page.locator('.sc-memo-tip').first()).toContainText('觉读 jué');
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
  expect(py['觉']).toBe('jué');
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

/* ---------- 知识点正式页（pinyin/kp.js + pinyin/content/<id>.js，交接 pinyin-08） ---------- */
test('拼音内容文件校验（newhanzi/tools/check_pinyin_content.js）', () => {
  execFileSync(process.execPath, [path.resolve(__dirname, '../tools/check_pinyin_content.js')], { stdio: 'pipe' });
});

test('知识点页：菜单进声调、四段跳转、浅中深切档并记住、听音题判对错、返回', async ({ page }) => {
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.addInitScript(() => { window.speechSynthesis && (window.speechSynthesis.speak = () => { window.__usedTTS = true; }); });
  await page.goto('newhanzi/pinyin.html');
  await page.evaluate(() => localStorage.removeItem('nhz-py-lv'));
  await page.click('.py-card[data-id="shengdiao"]');
  await expect(page.locator('.kp[data-kp="shengdiao"]')).toBeVisible();
  await expect(page.locator('.kp-jump')).toHaveText(['看', '听读', '练', '用']);
  await expect(page.locator('.stage')).toHaveCount(4);
  // 默认「中」：L3 块隐藏，有「深一点还有」提示
  await expect(page.locator('.kp-seg button[aria-pressed="true"]')).toContainText('中');
  await expect(page.locator('.blk[data-lv="3"]').first()).toBeHidden();
  await expect(page.locator('.blk[data-lv="2"]').first()).toBeVisible();
  await expect(page.locator('#kp-kan .more')).toContainText('深一点还有');
  await page.click('.kp-seg button[data-lv="1"]');
  await expect(page.locator('.blk[data-lv="2"]').first()).toBeHidden();
  await page.click('.kp-seg button[data-lv="3"]');
  await expect(page.locator('.blk[data-lv="3"]').first()).toBeVisible();
  await expect(page.locator('#kp-kan .more')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('nhz-py-lv'))).toBe('3');
  // 声调路：点一段路请求 cmn-ma3
  const r3 = page.waitForRequest((r) => r.url().endsWith('/pinyin/audio/cmn-ma3.mp3'));
  await page.click('.road[data-road="3"]');
  await r3;
  // 段内跳转
  await page.click('.kp-jump[data-to="kp-lian"]');
  await expect(page.locator('#kp-lian')).toBeInViewport();
  // 听音选调：开始 → 读出题目 → 选对 / 选错都有反馈
  const quiz = page.locator('#kp-lian .blk[data-type="quiz-listen"] .quiz');
  // 题目读的是哪个文件：NHZPinyinAudio.last（同一文件第二次播放走内存缓存，不一定再发请求）
  await quiz.locator('[data-q="again"]').click();
  const url = await page.evaluate(() => window.NHZPinyinAudio.last);
  expect(url).toMatch(/pinyin\/audio\/cmn-[a-z]+[1-4]\.mp3$/);
  const tone = url.match(/([1-4])\.mp3$/)[1];
  await quiz.locator(`.qopt[data-ans="${tone}"]`).click();
  await expect(quiz.locator('.qfb')).toContainText('对了');
  await expect(quiz.locator('.qscore')).toHaveText('答对 1 / 1');
  await quiz.locator('[data-q="next"]').click();
  const t2 = +(await page.evaluate(() => window.NHZPinyinAudio.last)).match(/([1-4])\.mp3$/)[1];
  await quiz.locator(`.qopt[data-ans="${t2 === 1 ? 2 : 1}"]`).click();
  await expect(quiz.locator('.qfb')).toContainText('再听听');
  await expect(quiz.locator('.qopt.right')).toHaveCount(1);
  await expect(quiz.locator('.qscore')).toHaveText('答对 1 / 2');
  // 返回：界面层级
  await page.evaluate(() => window.NHZNav.up());
  await expect(page.locator('#pyHome')).toBeVisible();
  // 再进别的知识点，档位记住了「深」
  await page.click('.py-card[data-id="shengmu"]');
  await expect(page.locator('.kp-seg button[aria-pressed="true"]')).toContainText('深');
  expect(await page.evaluate(() => !!window.__usedTTS)).toBe(false);
  expect(errs).toEqual([]);
});

test('知识点页：声母 21 个（6 组）、呼读音待录音、碰撞拼读、标调与找一找', async ({ page }) => {
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('newhanzi/pinyin.html?t=shengmu');
  await expect(page.locator('.kp[data-kp="shengmu"]')).toBeVisible();
  await expect(page.locator('.scene')).toHaveCount(21);
  await expect(page.locator('.blk[data-type="scene"]')).toHaveCount(6);
  await expect(page.locator('#kp-ting .py-chip.is-wait')).toHaveCount(21);
  await expect(page.locator('#kp-ting .py-chip.is-wait').first()).toContainText('待录音');
  // 碰撞拼读：b + a + 三声 → bǎ
  const bld = page.locator('.blk[data-type="quiz-build"]').first();
  await bld.locator('[data-i="b"]').click();
  await bld.locator('[data-f="a"]').click();
  await bld.locator('[data-t="3"]').click();
  await expect(bld.locator('.bk.ini')).toHaveText('b');
  const rq = page.waitForRequest((r) => r.url().endsWith('/pinyin/audio/cmn-ba3.mp3'));
  await bld.locator('[data-go]').click();
  await rq;
  await expect(bld.locator('.bk.merged')).toHaveText('bǎ');
  // 不合法组合禁用：f + i
  await bld.locator('[data-i="f"]').click();
  await bld.locator('[data-f="i"]').click();
  await expect(bld.locator('[data-go]')).toBeDisabled();
  await expect(bld.locator('.bump')).toContainText('没有 fi');
  // j + ü → 写成 ju
  const jqx = page.locator('.blk[data-type="quiz-build"]').nth(1);
  await jqx.locator('[data-i="j"]').click();
  await jqx.locator('[data-f="ü"]').click();
  await jqx.locator('[data-t="2"]').click();
  await jqx.locator('[data-go]').click();
  await expect(jqx.locator('.bk.merged')).toHaveText('jú');
  // 找一找：点完所有目标
  const fd = page.locator('.blk[data-type="quiz-find"]').first();
  const n = await fd.locator('.tile[data-c="b"]').count();
  for (let i = 0; i < n; i++) await fd.locator('.tile[data-c="b"]').nth(i).click();
  await expect(fd.locator('.qfb')).toHaveText('全找到了！');
  // 镜子：左右翻 → d
  await page.click('.mirror [data-m="lr"]');
  await expect(page.locator('.mirror .mname')).toHaveText('d');
  expect(errs).toEqual([]);
});

test('知识点页：全部块类型可渲染（含 glide/nasal 静态说明、{py:}{zi:} 内联、标调题、选择题）', async ({ page }) => {
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('newhanzi/pinyin.html');
  await page.evaluate(() => {
    const c = { id: 'demo', name: '演示', lead: '读 {py:māma}，看 {zi:妈} 字卡', src: ['自编'],
      kan: [{ type: 'text', h: 'T', p: ['{py:Xī\'ān}'] }, { type: 'anim', kind: 'glide', fallback: '滑动说明' }, { type: 'anim', kind: 'nasal', fallback: '鼻音说明', lv: 2 },
        { type: 'anim', kind: 'bump', params: { items: ['guā', 'bā'], three: true } }, { type: 'mirror', base: 'p' }, { type: 'scene', items: [{ letter: 'a', thing: '圆', word: '阿', py: 'ā', svg: '<svg viewBox="0 0 10 10"></svg>' }] },
        { type: 'table', head: ['a', 'b'], rows: [['{py:mā}', 'x']], lv: 3 }],
      ting: [{ type: 'chips', items: [{ t: 'ā', play: 'a1' }, { t: 'i', tones: 'yi' }, { t: 'b', hudu: 'b' }] }, { type: 'groups', groups: [{ label: 'g', items: [{ t: 'bā', play: 'ba1' }] }] }, { type: 'pairs', pairs: [[{ t: 'bā', play: 'ba1' }, { t: 'pā', play: 'pa1' }]], tip: '提示' }],
      lian: [{ type: 'quiz-listen', ask: 'initial', pool: ['ba1', 'pa1', 'ma1', 'fa1'] }, { type: 'quiz-choose', items: [{ q: '哪个是一声？', options: ['{py:mā}', '{py:má}'], answer: 0, why: '平的' }] },
        { type: 'quiz-mark', items: ['hao'] }, { type: 'quiz-find', target: 'b', distract: ['d'], n: 6 }, { type: 'quiz-build', initials: ['b'], finals: ['a'], tones: [1] }],
      yong: [{ type: 'words', items: [{ w: '妈妈', py: 'mā ma' }, { w: '花儿', py: 'huār' }] }, { type: 'verse', h: '歌', lines: [{ w: '不怕。', py: 'bù pà.' }, { w: '不怕！', py: 'bù pà!' }], real: { '不': 'bú' } }, { type: 'outline', p: ['待做'] }] };
    window.NHZPinyinKP.setLevel(3);
    window.NHZPinyinKP.render(document.getElementById('pyDetail'), c, { name: '演示', ex: 'x' });
    document.getElementById('pyHome').style.display = 'none';
    document.getElementById('pyDetail').style.display = '';
  });
  const d = page.locator('#pyDetail');
  await expect(d.locator('.fallback')).toHaveText(['滑动说明', '鼻音说明']);
  await expect(d.locator('.kp-lead .pyi')).toHaveCount(1); // mā 可点；轻声 ma 没有录音
  await expect(d.locator('.kp-lead a.zi-l')).toHaveAttribute('href', /zika\.html\?zi=/);
  await expect(d.locator('.blk[data-type="anim"] .bk.med')).toHaveText('u'); // 三拼 g-u-ā
  await expect(d.locator('.mirror .mname')).toHaveText('p');
  await expect(d.locator('.py-chip.is-wait')).toHaveCount(1);
  await d.locator('.py-chip[data-kind="tones"]').click();
  await expect(d.locator('.py-tones .py-tone')).toHaveText(['ī', 'í', 'ǐ', 'ì']);
  // 标调题：hao 的调号在 a 上
  await d.locator('.letter[data-li="1"]').click();
  await expect(d.locator('.blk[data-type="quiz-mark"] .qfb')).toContainText('有 a');
  // 选择题判对错
  await d.locator('.blk[data-type="quiz-choose"] .qopt[data-i="1"]').click();
  await expect(d.locator('.blk[data-type="quiz-choose"] .qfb')).toContainText('再想想');
  // 儿化：花儿 两个字一个音节；verse real 在 L3 显示
  await expect(d.locator('.blk[data-type="words"] .word').nth(1).locator('.zi')).toHaveCount(2);
  await expect(d.locator('.blk[data-type="verse"] .sd').first()).toHaveText('读 bú');
  await expect(d.locator('.kp-outline')).toContainText('待做');
  expect(errs).toEqual([]);
});

test('没有内容文件的知识点：显示简介 + 「还在写」提示', async ({ page }) => {
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.route('**/pinyin/content/yinbian.js', (r) => r.fulfill({ status: 404, body: '' }));
  await page.goto('newhanzi/pinyin.html?t=yinbian');
  await expect(page.locator('#pyDetail .py-wip')).toContainText('还在写');
  await expect(page.locator('#pyDetail .py-sec').first()).toBeVisible();
  expect(errs).toEqual([]);
});

test('字卡拼音可点：播真人录音，拆拼链接去拼音区', async ({ page }) => {
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('newhanzi/zika.html?zi=' + encodeURIComponent('佛'));
  await expect(page.locator('.bigzi')).toHaveText('佛', { timeout: 20000 });
  await expect(page.locator('.hero .pinyin .py-play')).toHaveText(['fó', 'fú']);
  const rq = page.waitForRequest((r) => r.url().endsWith('/pinyin/audio/cmn-fo2.mp3'));
  await page.locator('.hero .pinyin .py-play').first().click();
  await rq;
  await expect(page.locator('.hero .pinyin .py-split .py-how')).toHaveAttribute('href', 'pinyin.html?t=pindu');
  await expect(page.locator('.hero .pinyin .py-split')).toContainText('f + ó');
  expect(errs).toEqual([]);
});

/* ---- pinyin-11：剩余项 ---- */
test('复韵母动程 glide：静态步进示意图（口形 + 舌位），下一步/上一步、听', async ({ page }) => {
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('newhanzi/pinyin.html?t=fuyunmu');
  const g = page.locator('.blk[data-type="anim"]').first();
  await expect(g.locator('svg.gsvg')).toHaveCount(1);
  await expect(g.locator('.gnote')).toContainText('第 1 / 3 步');
  await expect(g.locator('[data-gs="-1"]')).toBeDisabled();
  await g.locator('[data-gs="1"]').click();
  await expect(g.locator('.gnote')).toContainText('第 2 / 3 步');
  await expect(g.locator('svg .garrow')).toHaveCount(1);
  await g.locator('[data-gi="4"]').click(); // ui：中间藏着 e
  await g.locator('[data-gs="1"]').click();
  await expect(g.locator('svg .ghid')).toHaveText('（e）');
  await expect(g.locator('.gnote')).toContainText('借 wei');
  const rq = page.waitForRequest((r) => r.url().endsWith('/pinyin/audio/cmn-wei1.mp3'));
  await g.locator('[data-gplay]').click(); await rq;
  await expect(g.locator('details.gfb .fallback')).toHaveCount(1); // 文字说明保留
  expect(errs).toEqual([]);
});

test('前后鼻 nasal：口腔侧面两图并排步进，舌尖/舌根接触点，前鼻后鼻各自可听；数组写法也能画', async ({ page }) => {
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('newhanzi/pinyin.html?t=biyunmu');
  const n = page.locator('.blk[data-type="anim"]').first();
  await expect(n.locator('svg.nsvg')).toHaveCount(2);
  await expect(n.locator('.nhit')).toHaveCount(0);
  await n.locator('[data-ns="1"]').click();
  await expect(n.locator('.nhit')).toHaveCount(2);
  await expect(n.locator('.ncol').nth(0)).toContainText('舌尖抬起');
  await expect(n.locator('.ncol').nth(1)).toContainText('舌根抬起');
  await n.locator('[data-ns="1"]').click();
  await expect(n.locator('.nair')).toHaveCount(2); // 气流走鼻腔
  await n.locator('[data-ni="2"]').click();
  const rq = page.waitForRequest((r) => r.url().endsWith('/pinyin/audio/cmn-ying1.mp3'));
  await n.locator('[data-np="back"]').click(); await rq;
  // 易混音页用数组写法 pairs:[['an','ang'],…]（L2 块）
  await page.evaluate(() => window.NHZPinyinKP.setLevel(2));
  await page.goto('newhanzi/pinyin.html?t=yibian');
  await expect(page.locator('.blk[data-type="anim"] svg.nsvg')).toHaveCount(2);
  expect(errs).toEqual([]);
});

test('听音选韵母：j q x 后的 u 还原成 ü，零声母 yu/yue/yun 取韵母本身；jūn 答 ün、jué 答 üe', async ({ page }) => {
  await page.goto('newhanzi/pinyin.html');
  const r = await page.evaluate(() => {
    const out = {};
    const pools = { jun1: 0, xue2: 0, lun2: 0, yu3: 0, wei1: 0 };
    Object.keys(pools).forEach((k) => {
      const box = document.createElement('div'); document.body.appendChild(box);
      window.NHZPinyinKP.render(box, { id: 'q', name: 'q', lead: '', kan: [], ting: [], yong: [], lian: [{ type: 'quiz-listen', ask: 'final', pool: [k], options: ['un', 'ün', 'üe', 'ue', 'ü', 'u', 'ui', 'uei'] }] }, { name: 'q' });
      box.querySelector('[data-q="again"]').click();
      const opts = Array.from(box.querySelectorAll('.qopt')); const want = { jun1: 'ün', xue2: 'üe', lun2: 'un', yu3: 'ü', wei1: 'ui' }[k];
      const btn = opts.find((b) => b.getAttribute('data-ans') === want); if (btn) btn.click();
      out[k] = btn && btn.classList.contains('right') ? 'ok' : 'bad';
      box.remove();
    });
    return out;
  });
  expect(r).toEqual({ jun1: 'ok', xue2: 'ok', lun2: 'ok', yu3: 'ok', wei1: 'ok' });
});

test('字卡「读一读」播真人单音节，不用 Web Speech；没有录音的读音按钮不可点', async ({ page }) => {
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.addInitScript(() => { window.__tts = 0; if (window.speechSynthesis) window.speechSynthesis.speak = () => { window.__tts++; }; });
  await page.goto('newhanzi/zika.html?zi=' + encodeURIComponent('绿'));
  await expect(page.locator('.bigzi')).toHaveText('绿', { timeout: 20000 });
  const rq = page.waitForRequest((r) => r.url().endsWith('/pinyin/audio/cmn-lv4.mp3'));
  await page.locator('#speakBtn').click(); await rq;
  expect(await page.evaluate(() => window.__tts)).toBe(0);
  await page.goto('newhanzi/zika.html?zi=' + encodeURIComponent('们'));
  await expect(page.locator('.bigzi')).toHaveText('们', { timeout: 20000 });
  await expect(page.locator('#speakBtn')).toBeDisabled();
  expect(errs).toEqual([]);
});

test('字卡拆拼直达知识点：声母去声母页并定位芯片，j q x 后的 u 按 ü 去单韵母页', async ({ page }) => {
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('newhanzi/zika.html?zi=' + encodeURIComponent('菊'));
  await expect(page.locator('.bigzi')).toHaveText('菊', { timeout: 20000 });
  const kp = page.locator('.hero .pinyin .py-split .py-kp');
  await expect(kp).toHaveCount(2);
  await expect(kp.nth(0)).toHaveAttribute('href', 'pinyin.html?t=shengmu&k=j');
  await expect(kp.nth(1)).toHaveAttribute('href', 'pinyin.html?t=danyunmu&k=' + encodeURIComponent('ü'));
  await page.goto('newhanzi/zika.html?zi=' + encodeURIComponent('日'));
  await expect(page.locator('.hero .pinyin .py-split .py-kp')).toHaveAttribute('href', 'pinyin.html?t=zhengti&k=ri');
  // 拼音页 &k= 直达：芯片描边；四声芯片顺手展开
  await page.goto('newhanzi/pinyin.html?t=danyunmu&k=' + encodeURIComponent('ü'));
  await expect(page.locator('.py-chip.kp-focus')).toHaveCount(1);
  await expect(page.locator('.py-tones')).toHaveCount(1);
  await page.goto('newhanzi/pinyin.html?t=shengmu&k=zh');
  await expect(page.locator('.py-chip.kp-focus')).toHaveCount(1);
  await expect(page.locator('.py-chip.kp-focus')).toContainText('zh');
  expect(errs).toEqual([]);
});

test('拼读机：拼出音节后显示 3500 字里的同音字并链字卡', async ({ page }) => {
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('newhanzi/pinyin.html?t=pindu');
  const qb = page.locator('.blk[data-type="quiz-build"]').first();
  await qb.locator('[data-go]').click();
  await expect(qb.locator('.hz-l .zi-l').first()).toBeVisible();
  const syl = await qb.locator('.bk.merged').innerText();
  const ok = await page.evaluate((s) => Array.from(document.querySelectorAll('.blk[data-type="quiz-build"] .hz-l .zi-l')).every((a) => String(window.NHZ_PINYIN[a.textContent]).split(',')[0] === s), syl.trim());
  expect(ok).toBe(true);
  await expect(qb.locator('.hz-l .zi-l').first()).toHaveAttribute('href', /zika\.html\?zi=/);
  expect(errs).toEqual([]);
});

test('儿化不播（不拿基本音节顶替）；verse.real 可按出现顺序给数组；L3 变调小路不画右侧小调形', async ({ page }) => {
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('newhanzi/pinyin.html');
  await page.evaluate(() => {
    const c = { id: 'demo', name: '演示', lead: '{py:huār}', src: ['自编'],
      kan: [{ type: 'scene', items: [{ letter: 'r', thing: '花', word: '花儿', py: 'huār', svg: '<svg viewBox="0 0 10 10"></svg>' }] },
        { type: 'anim', kind: 'tone-road', params: { from: [3, 3], to: [2, 3], syl: ['ni', 'hao'] } }],
      ting: [], lian: [],
      yong: [{ type: 'verse', lines: [{ w: '一年一起。', py: 'yī nián yī qǐ.' }, { w: '第一。', py: 'dì yī.' }], real: { '一': ['yì', 'yì', ''] } }] };
    window.NHZPinyinKP.setLevel(3);
    window.NHZPinyinKP.render(document.getElementById('pyDetail'), c, { name: '演示' });
    document.getElementById('pyHome').style.display = 'none';
    document.getElementById('pyDetail').style.display = '';
  });
  const d = page.locator('#pyDetail');
  await expect(d.locator('.kp-lead .erh')).toHaveCount(1);
  await expect(d.locator('.kp-lead button')).toHaveCount(0);
  let asked = false; page.on('request', (r) => { if (/cmn-hua1\.mp3$/.test(r.url())) asked = true; });
  await d.locator('.scene').click(); await page.waitForTimeout(300);
  expect(asked).toBe(false);
  await expect(d.locator('.blk[data-type="verse"] .sd')).toHaveText(['读 yì', '', '读 yì', '', '', '', '', '']);
  await expect(d.locator('.road.mini canvas')).toHaveCount(4);
  expect(errs).toEqual([]);
});

test('拼读机同音字：次读音也列出并标「多音」，按识字册次排序（pinyin-11 已知/以后 1）', async ({ page }) => {
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('newhanzi/pinyin.html?t=pindu');
  const qb = page.locator('.blk[data-type="quiz-build"]').first();
  // b + a + 四声 → bà：主读音 bà 的「爸」，次读音 bà 的「把」（bǎ,bà）
  await qb.locator('[data-row="t"] [data-t="4"]').click();
  await qb.locator('[data-go]').click();
  await expect(qb.locator('.hz-l .zi-l').first()).toBeVisible();
  await expect(qb.locator('.hz-l .zi-l', { hasText: '爸' })).toHaveCount(1);
  const dy = qb.locator('.hz-multi .hz-m .zi-l.dy');
  await expect(dy.filter({ hasText: '把' })).toHaveCount(1);
  await expect(dy.first()).toContainText('多音');
  await expect(dy.first()).toHaveAttribute('href', /zika\.html\?zi=/);
  const r = await page.evaluate(() => {
    const P = window.NHZ_PINYIN, G = window.NHZ_GRADE_MAP, O = ['1上', '1下', '2上', '2下', '3上', '3下', '4上', '4下', '5上', '5下', '6上', '6下'];
    const zs = Array.from(document.querySelectorAll('.blk[data-type="quiz-build"] .hz-m .zi-l')).map((a) => a.firstChild.textContent);
    const isMulti = zs.every((z) => { const rs = String(P[z]).split(','); return rs[0] !== 'bà' && rs.indexOf('bà') > 0; });
    const g = zs.map((z) => (O.indexOf(G[z]) < 0 ? 99 : O.indexOf(G[z])));
    const sorted = g.every((v, i) => i === 0 || g[i - 1] <= v);
    const mainOk = Array.from(document.querySelectorAll('.blk[data-type="quiz-build"] .hz-l .zi-l')).every((a) => String(P[a.textContent]).split(',')[0] === 'bà');
    return { isMulti, sorted, mainOk, n: zs.length };
  });
  expect(r.n).toBeGreaterThan(0);
  expect(r).toEqual({ isMulti: true, sorted: true, mainOk: true, n: r.n });
  expect(errs).toEqual([]);
});

test('拆拼直达三拼韵母：拼读页预选拼读机里的韵母并描边，没有的找同介母的三拼机（pinyin-11 已知/以后 2）', async ({ page }) => {
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  // 字卡「光」：韵母 uang 链到拼读页
  await page.goto('newhanzi/zika.html?zi=' + encodeURIComponent('光'));
  await expect(page.locator('.bigzi')).toHaveText('光', { timeout: 20000 });
  await expect(page.locator('.hero .pinyin .py-split .py-kp').nth(1)).toHaveAttribute('href', 'pinyin.html?t=pindu&k=uang');
  // uang：u 介母三拼机预选 uang，整台机描边，拼得出来（「碰！」可点）
  await page.goto('newhanzi/pinyin.html?t=pindu&k=uang');
  const fb = page.locator('.blk.kp-focus');
  await expect(fb).toHaveCount(1);
  await expect(fb).toHaveAttribute('data-type', 'quiz-build');
  await expect(fb.locator('[data-row="f"] [data-f="uang"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(fb.locator('[data-row="f"] .pchip.kp-focus')).toHaveCount(1);
  await expect(fb.locator('[data-go]')).toBeEnabled();
  await expect(fb).toBeInViewport();
  // ia：i 介母那台（j q x），声母自动换成能拼的
  await page.goto('newhanzi/pinyin.html?t=pindu&k=ia');
  await expect(page.locator('.blk.kp-focus [data-row="f"] [data-f="ia"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.blk.kp-focus [data-go]')).toBeEnabled();
  // uan：拼读机里没有 → 找 u 介母三拼机，加说明，不预选
  await page.goto('newhanzi/pinyin.html?t=pindu&k=uan');
  await expect(page.locator('.blk.kp-focus')).toHaveCount(1);
  await expect(page.locator('.blk.kp-focus [data-row="f"] [data-f="ua"]')).toHaveCount(1);
  await expect(page.locator('.blk.kp-focus .kp-focus-note')).toContainText('uan');
  // üan（字卡「卷」juǎn）：找有 j q x 的那台
  await page.goto('newhanzi/pinyin.html?t=pindu&k=' + encodeURIComponent('üan'));
  await expect(page.locator('.blk.kp-focus [data-row="i"] [data-i="j"]')).toHaveCount(1);
  // 不是三拼韵母、页上也没有的 key：照旧停在页首，不描边
  await page.goto('newhanzi/pinyin.html?t=pindu&k=zz');
  await expect(page.locator('.kp')).toHaveCount(1);
  await expect(page.locator('.kp-focus')).toHaveCount(0);
  expect(errs).toEqual([]);
});
