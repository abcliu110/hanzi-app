// 古诗 P2（A22-17，2026-11-07 SC2）：唐朝朋友圈 / 格律小作坊 / 朝代长河 / 背诵评测 / 竖排
const { test, expect } = require('@playwright/test');

test.describe('shici P2 (A22-17)', () => {
  test('P2-1 朋友圈：每条边依据可核、无 ⚠️、点线有图', async ({ page }) => {
    const warns = [];
    page.on('console', (m) => { if (m.type() === 'warning' && m.text().indexOf('朋友圈') >= 0) warns.push(m.text()); });
    await page.goto('newhanzi/games/shici/pengyouquan.html');
    const items = page.locator('#edgeList li');
    const n = await items.count();
    expect(n).toBeGreaterThanOrEqual(25);
    await expect(page.locator('#edgeList')).not.toContainText('⚠️');
    expect(warns).toEqual([]);
    // 每条都有依据行
    await expect(page.locator('#edgeList li .ev')).toHaveCount(n);
    // 无出处的柳永—孙何已撤下
    await expect(page.locator('#edgeList')).not.toContainText('孙何');
    await expect(page.locator('#edgeList')).not.toContainText('通行说法');
    // 年份只来自年谱：黄鹤楼送孟浩然之广陵 728，带年表出处
    const li = items.filter({ hasText: '黄鹤楼送孟浩然之广陵' });
    await expect(li).toContainText('728');
    await expect(li.locator('.ev')).toContainText('年表');
    // 图里线数 = 边数
    await expect(page.locator('#graph .g-edge')).toHaveCount(n);
    // 唐朝筛选
    await page.locator('#filters [data-f=tang]').click();
    const nt = await page.locator('#edgeList li').count();
    await expect(page.locator('#filters [data-f=tang]')).toHaveText('唐朝 ' + nt + ' 条');
  });

  test('P2-2 格律小作坊：只开放 pz 与平水韵无冲突的诗，两读字标◐', async ({ page }) => {
    await page.goto('newhanzi/games/shici/gelu.html');
    const st = await page.evaluate(() => window.__gelu);
    expect(st.open).toBeGreaterThanOrEqual(91);
    // 原平水韵单读字冲突 5 首（颗/场/究/场/俱）2026-11-08 已按字表改 pz（fix_shici_pz5.py），现全部开放
    expect(st.blocked).toEqual([]);
    await expect(page.locator('#poemSel option')).toHaveCount(st.open);
    for (const o of [19, 37, 138, 158, 169]) await expect(page.locator('#poemSel option[value="' + o + '"]')).toHaveCount(1);
    await expect(page.locator('#todoText')).toContainText('全部开放');
    // 登鹳雀楼默认局：韵部取自字表
    await expect(page.locator('#poemTip')).toContainText('尤韵');
    // 望庐山瀑布「遥看」的看是两读
    await page.locator('#poemSel').selectOption('2');
    await expect(page.locator('.cell').nth(8).locator('.pu')).toHaveText('◐两读');
    // 填满正确字 → 全对
    const blanks = await page.locator('.cell:not(.fixed)').count();
    expect(blanks).toBe(8);
  });

  test('P2-3 朝代长河：6 段与诗库朝代一致，代表诗滚到才出现，取自诗库', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('newhanzi/games/shici/chaodai.html');
    await expect(page.locator('.seg')).toHaveCount(6);
    await expect(page.locator('.seg').first()).toHaveClass(/\bin\b/);
    await expect(page.locator('.seg').nth(3)).not.toHaveClass(/\bin\b/);
    await page.locator('#dots [data-i="3"]').click();
    await expect(page.locator('.seg').nth(3)).toHaveClass(/\bin\b/);
    await expect(page.locator('.seg').nth(3)).toContainText('静夜思');
    await expect(page.locator('.seg').nth(3).locator('a')).toHaveAttribute('href', /#poem-1$/);
  });
});
