# 交接 · 语法白板第 3 期 · 01 nest 套盒子模板（E6 台阶线 + box / stair / 一句两图 + pic）

依据：设计 §5.3、§7.1（E6、E13）、§7.4（台阶线每行 46px、最多 4 行）、Q4（L1/L2 盒子，L3 台阶线）、Q22（情境卡先只用文字，图标待定）。

## 改了什么
- `newhanzi/wb/wb-engine.js` 新增 `TPL.nest`（复用已有原语 `stair`（E6）、`pic`（E13）、`R('rectangle')`），约 100 行：
```js
{ k:'nest', lv:1, style:'box', s:['妈妈','买','的','新','书包'], tree:['pz',['de',['zw',0,1],2],['pz',3,4]], ask:'先装哪两个？', say:[…可省] }
{ k:'nest', lv:3, style:'stair', src:'…', s:[…], tree:[…] }
{ k:'nest', lv:3, style:'stair'|'box', src:'…', s:[…], reads:[{tree, pic:{t:'情境卡文字'}, say}, {…}], ask, both }
```
  - 树：`[结构键, 子, 子, …]`，子是子树或词下标（从 0 起、从左到右连续），可多叉（并列三项）。结构键查 `terms.js`：pz / db / zw / bl / bc，新增 `de`（“的”字短语）、`jb`（介宾）。标签：L1 儿童简称（修饰、动作+对象、谁+怎样…），L2/L3 术语简称。
  - box：矮的盒子先装（按子树高度排序），每个盒子一拍；内边距随高度加大（横 8+12h、纵 6+26h），结构名写在框内底边；词间距在构建时按两侧最高盒子算好。
  - stair：句下第 r 行（y+50+46r）画该层所有节点的台阶线（横线 + 切分竖线），结构名写在切分处下方；从上往下逐层切。
  - 一句两图：左右两栏各一份句子（字号 36），栏上方情境卡（文字）；画第 k 种装法时点亮第 k 张、另一张降到 0.35；收尾两张全亮。卡片带 `data-pic` 属性（只在新模板里）。
- `newhanzi/wb/terms.js`：加 `de`、`jb` 两个结构键。
- `tools/wb/selftest.py`：加 3 幕 nest（box / stair / 一句两图），检查 box 结构名由内向外下移、stair 一层一行往下、两图点亮切换。

## 怎么验证
```bash
export LD_LIBRARY_PATH=/workspace/work/pwlibs/root/usr/lib/aarch64-linux-gnu
env -u HTTPS_PROXY -u HTTP_PROXY python3 tools/wb/selftest.py      # ✓
env -u HTTPS_PROXY -u HTTP_PROXY python3 tools/wb/baseline.py      # 586 幕一致（旧场景不受影响）
```

## 断点 / 未完成
- `--lint` R14（nest 树合法、深度 ≤ 4、叶子连续）尚未加 → 下一提交。
- 回炉短语结构 5 项（L1 box、L3 stair）、定语多层定语 nest、歧义句一句两图 → 03 起逐项。

## 已知问题
- 情境卡只有文字（Q22 图标来源待定，按默认方案先不用图标）。
- 树深 > 4 时台阶线会超出 4 行区，靠 lint 拦。
