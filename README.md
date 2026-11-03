# 识字星球 · 儿童汉字学习

纯静态网站（HTML + CSS + 原生 JS），无需构建，收录 3,499 个常用字，分 177 批。

## 运行
- 推荐：在项目根目录运行 `python3 -m http.server`，浏览器打开 http://localhost:8000/newhanzi/
- 也可以直接双击 `newhanzi/index.html`（file://）打开。
- 通过 http(s) 打开时可以“添加到主屏幕”离线使用（PWA：`newhanzi/manifest.webmanifest` + `newhanzi/sw.js`）。file:// 下不注册 service worker。

## 页面

主线只有 `newhanzi/`（老壳已于 2026-11-04 删除）：

| 文件 | 内容 |
|---|---|
| newhanzi/index.html | 首页（识字、语法、逻辑、部首、古诗词、古文、实验、复习入口） |
| newhanzi/zika.html | 字卡（`?zi=字`） |
| newhanzi/yuwen.html | 语法 |
| newhanzi/bushou.html | 部首 |
| newhanzi/shici.html | 古诗词 |
| newhanzi/guwen.html | 古文 |
| newhanzi/fuxi.html | 复习与错题本 |
| newhanzi/yuedu-xiezuo.html | 阅读与写作 |
| newhanzi/weekly.html | 家长周报 |
| newhanzi/share.html | 每日一卡分享 |

## 前端 UI 规范

- 仓库级：`docs/frontend-ui.md`（主线只有 `newhanzi/`，护眼套见 `newhanzi/FRONTEND_UI.md`）
- newhanzi 详细：`newhanzi/FRONTEND_UI.md`（鼠尾草绿 token、断点、逐页验收）
- Agent 规则：`.cursor/rules/frontend-ui.mdc`

## 公共文件

新 app 的样式与脚本都在 `newhanzi/` 内：`zika.css`（护眼配色 token，深色模式跟随系统 `prefers-color-scheme`），各页脚本就近存放；不再使用 `--xzq-*`。

## 学习进度

新 app 的学习记录存在浏览器 localStorage：
- `nhz_srs`：复习安排；`nhz_wrong`：错题本
- `nhz_task`：今日任务打勾；`nhz_checkin`：打卡；`nhz_stars`：星星

## 数据

- `newhanzi/data/`：3500 字单字文件，是新 app 字卡的数据源
- `newhanzi/ziku/model-3500.json`：3500 字模型
- `tools/fill_zika_four_dims.py`：按模型补齐单字文件的读音 / 笔画 / 部首 / 繁体四维

## 测试
```bash
npm ci
npx playwright install --with-deps chromium
npm run check   # 所有 HTML 内联脚本语法检查（等同 node --check）
npm test        # Playwright：打开新 app 页面查控制台报错和 4xx、站内链接、返回按钮
```
已经自己开了服务器时：`PW_NO_SERVER=1 npx playwright test`（默认端口 4173）。
GitHub Actions（`.github/workflows/ci.yml`）在每次 push 时运行以上检查。

## 部首字段说明
- 全部 3,499 字的部首（除原有的现代部首外）取自 Unicode Unihan 数据库（kRSUnicode，康熙部首；简化偏旁如讠、钅、纟按简化形，艹、辶按今形）。像氵/水、扌/手这类位置变体统一写康熙部首原形

## 待办
- 210 个字的字源可信度为「待查」，80 个未标注（2026-10 已核对 30 个，依据汉典所载《说文解字》大徐本和段注，出处记在 origin.ref）
- 约 1,300 条字形演变缺少说明，约 500 条缺少阶段名
- 结构（struct）中原本为空的 1,930 字，按 cjkvi-ids 的汉字结构描述序列（IDS）首个结构符自动填写（左右、上下、包围、独体等），未标六书类型
- 易读错（misread）为空表示没有常见误读；617 个义项没有例词，页面显示「例词待补」
- 字形图片：调研结论见下，尚未接入

## 古文字字形图片（调研，未接入）
| 来源 | 授权 | 说明 |
|---|---|---|
| Wikimedia Commons 古汉字计划（Ancient Chinese characters project） | 公有领域 | SVG，甲骨/金文/楚简/说文小篆/六书通大篆；按繁体命名；常用字抽样约一半有至少一种字形 |
| 中研院小学堂 字形演变 | CC0 1.0（查询所得字形图片） | PNG，带时代和出处，适合补缺；须按繁体查询 |
| 崇羲篆体（字体） | CC BY-ND 3.0 TW | 小篆字体，须署名、不得修改 |
| 镜原甲骨文（字体） | OFL | 映射率未测 |
不建议：hanziyuan.net（版权所有）、ctext（禁止抓取）、方正甲骨文（网页嵌入需授权）、HUST-OBC（上游权利不清）。建议一次性下载打包，不外链 Commons。
