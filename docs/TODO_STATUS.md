# 未完成任务总表（TODO_STATUS）

> 盘点日期：2026-11-05（基于 master 8e1383d5）。盘点人：集成开发代理（hark）。
> 依据：AGENTS.md、newhanzi/MASTER_PLAN.md、SPEC.md、CONTENT_AUDIT.md、docs/anim/*（含 jiaojie/*）、docs/wenxue、docs/xiufu、docs/gaijin、docs/yufa-neirong/README.md、git log -40。
> 前提：2026-11-04 旧壳已删除，主线只有 `newhanzi/`；目标设备只有平板和桌面（不做手机适配）。
> 规则：每完成一项立即提交推送，并在本表「状态」列写提交号；需负责人拍板的不做，列在「待确认」。
> 优先级：P1 = 最新提交的识字讲解质量；P2 = 交接文档明确写了待做、不需拍板；P3 = 修复类（docs/xiufu）；P4 = 改进设计（docs/gaijin）；— = 作废/仅记录。

## 一、可执行（不需拍板）

| ID | 优先级 | 来源 | 条目 | 状态 |
|---|---|---|---|---|
| A1 | P1 | 8e1383d5 提交说明 | 12 个「占位符」识字讲解重写（俏 俐 俩 倒 倘 债 偎 傻 僧 育 胶 脚：现为「是一个常用汉字…」）。按汉典/本地《说文》有出处才讲字源，查不到就不讲字源 | ✅ 见执行日志 |
| A2 | P1 | 8e1383d5 提交说明 | 100 个「说文模板生成」讲解质量核对：截断（如「由'攴( pū'组成」）、混入英文（intestine / wattle）、说文形声与「会意」自相矛盾（兑）、只有半句（「本义是击。」）；同提交给 36 字新增的 `六书.value` 与《说文》核对 | ✅ 112 字完成；扩展 A2b：此前三线 150 字同类问题 |
| A2b | P1 | 69e90d0e / 876c7b21 / 8ff8f14f（三线讲解） | 同类问题扫描命中：占位符 9、截断 8、英文义项 2，另需逐字过半句类；完成后把机械扫描接入 CI | ✅ 158 字重写+CI 检查，见执行日志 |
| A3 | P2 | docs/anim/jiaojie/yufa-l3-buqi.md 断点 | 语法白板缺 L3 回炉 批 4：修辞格 8 项（草稿齐；嵌入脚本 embed.py 未入库，需重写） | 待做 |
| A4 | P2 | 同上 | 批 5：常见病句 20 项（草稿齐） | 待做 |
| A5 | P2 | yufa-neirong-08-l3-huilian.md / yufa-l3-buqi.md | 批次 9：虚词精讲 16 项先写 L3+回练草稿进 l3-huilian.json（src 必须可核），再嵌入场景（批 6） | 待做 |
| A6 | P2 | yufa-l3-buqi.md「已知」 | 「介词」场景旧幕第 4 幕标签为空 | 待做 |
| A7 | P2 | gaijin/README.md 进度 | 逻辑区：按 `point` 过滤直达（quiz engine.js） | 待做 |
| A8 | P2 | xiufu/content.md「问题」 | index.html 年级下拉仍写「（待录入）」，1上–4上、5上已有数据，改文案 | 待做 |
| A9 | P2 | xiufu/content.md | share.js 注释/逻辑写 seed%120，诗库现 192 首，改用 POEMS.length | 待做 |
| A10 | P2 | xiufu/content.md | shici.html 朝代筛选 chips 只有 唐/宋/五代/晋，补齐库里已有朝代（汉/南北朝/元/明/清/先秦） | 待做 |
| A11 | P3 | xiufu/anim.md「遗留」 | 部首区 120 个图示中 90 个内容空位（「口（）」空括号、「含口的字多与相关」缺关键词、31 处「部首含义」占位文字）——只删空位/占位，不编造含义 | 待做 |
| A12 | P3 | xiufu/infra.md 第 5 条 | guwen.html 一次加载 15 个古文题库（~1.5MB），改按需加载（同语法页做法） | 待做 |
| A13 | P3 | xiufu/content.md | 拓展 84 首与通行本逐字核对（如蜀道难「噫吁戏/噫吁嚱」、离思「𥮾」） | 待做（量大，排后） |
| A14 | P3 | xiufu/content.md | guwen.js 缺 9 篇小学课内文言（原文已在 tools/content/xiaoxue_wenyan.json，需写导读/译意，逐句有出处） | 待做（量大，排后） |
| A15 | P2 | MASTER_PLAN 阶段一 | 渲染验证：yuwen.html 各节显示正常（Playwright 逐节打开无报错） | 待做 |
| A16 | P4 | gaijin/luoji P0-1 | 逻辑「套圈判官」euler 模板 + 三段论场景 | 待做（L） |
| A17 | P4 | gaijin/luoji P0-2 | 「十五贯」chain + flip | 待做（L） |
| A18 | P4 | gaijin/luoji P0-3 | 谬误卡牌册（重组现有「常见谬误」内容） | 待做（M） |
| A19 | P4 | gaijin/shici P0-2 / P0-3 | `scroll` 水墨长卷模板；节奏打拍器 + 平仄格 | 待做（L/M） |
| A20 | P4 | gaijin/guwen P0-C | 篇目页「本篇文言知识卡」+ 知识点双向链接（数据已有 xiaoxue 字段） | 待做（M） |
| A21 | P4 | gaijin/guwen P0-A / P0-B | 逐字对译点读（需逐句标注 对/停/式）；morph 句式拆装（与语法区共用 morph） | 待做（L） |
| A22 | P4 | gaijin 三份 P1/P2 | 逻辑 P1-1…P2-5、古诗 P1-1…P2-5、古文 P1-A…P2-E | 待做（P0 之后） |
| A23 | P2 | MASTER_PLAN 阶段一/三 | 误解标注 61→577、啊哈块补 54 处、每日复习接入、提取练习升级、选项级反馈全量 | 待做（人工标注量大） |

## 二、待确认（需产品负责人拍板，本轮不做）

| ID | 来源 | 事项 |
|---|---|---|
| Q1 | docs/wenxue/wenxue-jiaojie.md | 文学常识功能落点（建议字卡文学区块），确认前不实现 |
| Q2 | 同上 §3 | 课本链接依据统编 2016 还是 2024 修订版 |
| Q3 | 同上 §3 | 争议古音：斜（山行）、衰（回乡偶书）、景（鹿柴） |
| Q4 | 同上 §3 | 作者不确定的俗语是否统一标「俗语」 |
| Q5 | docs/anim/donghua-jiaojie.md §6-10 / §7-6 | 商用 TTS 供应商（Azure/讯飞/火山/真人）；选定后重跑配音 |
| Q6 | docs/xiufu/anim.md | 22 个两读常用字的主读音排序；182 字「罕用读音」清单中古文常见音（雨 yù、食 sì…）是否降级 |
| Q7 | docs/xiufu/infra.md 1 | yuwen/grammar|logic|reading|writing.json 旧版：删除还是由 data.js 反写 |
| Q8 | docs/xiufu/infra.md 2 | sync-to-source.yml 会 force push 覆盖本仓库，-jpg 仓库是否弃用、是否删该 workflow |
| Q9 | docs/xiufu/infra.md 3 | 是否加自动发布 gh-pages 的 workflow |
| Q10 | docs/xiufu/content.md | shici.html 是否按 ke 隐藏拓展诗、是否加年级筛选；guwen.html 是否按 level 隐藏初高中内容 |
| Q11 | docs/xiufu/content.md | 毛泽东诗词、蒙学篇目、少年中国说是否入古诗库；伯牙鼓琴改《吕氏春秋》版 |
| Q12 | docs/anim/jiaojie/yufa-p2-03e-bijiao.md | Q24 比较句「没有」正文疑点签字 |
| Q13 | docs/anim/jiaojie/yufa-neirong-01…07 | 新增 54 项语法内容稿（句式/补语/词与短语/深层/修辞/文言/标点）待负责人审稿后才能上白板 |
| Q14 | docs/anim/jiaojie/yufa-neirong-02-buyu.md | 「他跑得很快」叫状态补语还是程度补语 |
| Q15 | CONTENT_AUDIT.md 施工顺序 1 | 图式/对照表/决策树/时间轴四型渲染模板需逐型拍板，之后才批量补 229+75+126+35 处 |
| Q16 | docs/anim/jiaojie/yufa-p3-01-nest.md、p1-08 | Q22 情境卡/pic 图标来源 |
| Q17 | docs/gaijin/shici（README 进度） | 《画》作者（唐/宋·佚名）；拼音开关需逐首人工校多音字，是否投入 |
| Q18 | newhanzi/MASTER_PLAN.md | 图式卡 22 张待 Lucas 验收 |

## 三、作废 / 不再适用

| 来源 | 条目 | 原因 |
|---|---|---|
| docs/anim/donghua-jiaojie.md §7-3、§7-5 | ziyi-viewer.html「看动画」接入、v1/v2 切换、xzq-anim 引擎小问题（circle 崩溃、mp3 比 timeline 长） | 旧壳（xzq-anim.js、根 anim/、tools/anim、tools/anim2）已删除或归档到 tools/_archive，主线 newhanzi 不再使用；如要恢复字义白板动画需负责人重新立项 |
| docs/wenxue/* 中按旧文件路径（ziyi-viewer.html、app-shell.html、根 sw.js）写的实现步骤 | — | 旧壳已删，需求保留，落点见 Q1 |
| docs/xiufu/infra.md 第 3 条「390px 溢出」测试 | 手机宽度断言 | 目标设备只有平板和桌面（2026-11-04），不再追加手机适配；现有用例保留不扩 |
| docs/anim/donghua-jiaojie.md 提交方式（Git Data API / apipush.py / Gitee） | — | 现直接 git push origin master（SSH deploy key） |

## 四、执行日志 / 断点

（按完成顺序追加：ID · 提交号 · 说明）
- A1+A2 · 453af4f1 · 8e1383d5 的 112 字讲解按汉典/《说文》重写，六书修正 4 字（元 兑 斑 显）；交接 docs/xiufu/zika-jiangjie.md
- A2b · 本提交 · 三线 158 字讲解按汉典重写，六书修正 7 字；check_content.js 加字卡讲解检查；smoke 加用例
