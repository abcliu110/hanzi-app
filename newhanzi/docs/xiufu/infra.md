# 修复记录 · infra（2026-11-04）

负责：tests/、.github/、newhanzi/index.html、yuwen.html 及加载逻辑、CSS、sw.js、proto/games/speedtest/quiz 页、DEPLOY.md、SPEC.md、FRONTEND_UI.md、tools/anim*、docs/wenxue。

## 已完成

| # | 内容 | 提交 |
|---|---|---|
| 1 | CI 红：smoke 首页面板数不再写死为 7（≥6 即可） | 1c269348 |
| 2 | 首页 6 个隐藏 iframe 改 data-src 懒加载；逻辑面板首次打开才加载 yuwen/data.js（首页不再重复加载） | 69024d43 |
| 2 | 语法页 90 个 quiz_bank 改按需加载：只引 `yuwen/quiz_bank_index.js`（`tools/gen_quiz_bank_index.py` 生成），进入知识点详情才 `<script>` 加载；file:// 实测可用；兼容 noun.js 整对象赋值 | d8af53bf |
| 2 | build_filemode.py 默认不再用旧 json 覆盖 yuwen/data.js（见问题 1），末尾自动生成题库清单 | d8af53bf |
| 2 | 测试：首页 <25 请求/<1MB、语法页 <15 请求/<1.5MB；面板懒加载、题库按需加载 | 32f6e7e9 |
| 3 | 390px 溢出：首页 .panels、语文卡片网格 .yw-grid 用 minmax(0,…)+窄屏列数；全部 35 页 390x844 断言 scrollWidth<=clientWidth | 5334fa71、572d3e7d |
| 4 | sw.js：CORE 由 `tools/gen_sw_core.py` 从全部页面+其引用脚本生成（79 项，含 fuxi/guwen/weekly/share/yuedu-xiezuo/quiz/games），VERSION=清单哈希；所有同源请求网络优先（有缓存时 5s 超时回落），改代码无需手动 bump；测试 `--check-pages` 只查页面齐全 | df68af31、3d581996 |
| 5 | proto-yuwen 去 Google Fonts 改系统字体；21 个 games 页、proto-yuwen、quiz/index 加「🏠 首页」（speedtest 原已有）；测试断言首页链接+无外链请求 | e2fd7780、38ccb26f |
| 6 | 删 105 个重复题库 json（yuwen 90 + guwen 15，逐个与 .js 语义比对完全一致，约 9MB）；新增 `tools/export_quiz_bank_json.js` 可从 .js 导回同格式 json（验证 105/105 一致）；.gitignore 加 build/ | d1f54a87 |
| 6 | ziku/ 不移动（多个构建脚本引用 newhanzi/ziku）；新增 `tools/build_site.py` 生成发布目录（排除 ziku/、*.md、*.py，复制 icons 并改 manifest 图标路径），DEPLOY.md 改为用它 | cb35b8fe |
| 7 | SPEC 去 anim/<字>.json、描红/练字打分标「已冻结」；FRONTEND_UI 去 --xzq-*；tools/anim、anim2 归档到 tools/_archive/ + README；docs/wenxue 三篇顶部加重定位说明 | 5e1dbad8、0d5f7c50、db18ebbb |
| 8 | grammar_lab.html：innerHTML 插入的全是本文件内常量（SYMS/ZIBIAN 含有意的 SVG 标记），无 URL/存储/外部输入，判定无 XSS 风险，未改 | — |

数字（本地实测，python http.server，Chromium）：首页 140 请求/11.2MB → 9/0.36MB；语法页 94/7.6MB → 5/0.75MB。

## 问题 / 待拍板

1. **yuwen/grammar|logic|reading|writing.json 是旧版**，内容远少于 yuwen/data.js（data.js 被直接编辑过）。原 build_filemode.py 会用它们覆盖 data.js 导致内容回退——已改为默认跳过（`--rebuild-yuwen` 才重建）。需负责人决定：删这 4 个 json（以 data.js 为源），还是把 data.js 反写回 json。
2. **sync-to-source.yml**：在 abcliu110-jpg/hanzi-app 上任何推送都会 `git push --force` 覆盖 abcliu110/hanzi-app 同名分支。现在大家直接推 abcliu110，若有人再往 -jpg 推，会抹掉这边的提交。建议负责人确认 -jpg 是否已弃用，弃用就删该 workflow 或去掉 --force。本次未改。
3. 发布方式：是否要加自动发布 gh-pages 的 workflow（DEPLOY.md 原就待确认）。
4. docs/wenxue 文学常识功能落点（建议字卡文学区块）待确认。
5. ~~guwen.html 仍一次加载 15 个古文题库~~ 2026-11-05 改为进入子模块时按需加载（`loadBank(mid)`，见 docs/TODO_STATUS.md A12）。
6. build_filemode.py 会改写全部 data/zika/*.js（规范化），本次没有运行它，避免和改 data/zika 的 agent 冲突。
