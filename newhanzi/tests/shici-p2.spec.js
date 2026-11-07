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
});
