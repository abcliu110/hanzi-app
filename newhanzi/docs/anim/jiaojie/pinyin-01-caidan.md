# 拼音区 · 01 首页菜单与页面骨架（交接）

日期：2026-11-06（负责人要求：首页加「拼音」菜单，放在「识字」后面；先读设计规范再加）

## 改了什么
- 首页 `index.html`：新增面板 `data-m="pinyin"`，位置在「识字」之后、「语法」之前；新增 `#panel-pinyin`（iframe 懒加载 `pinyin.html`），`panels` / `titles` 加 `pinyin`。图标沿用其他面板的线性 SVG 风格（stroke `#4a7a59`，2.5px）。
- 新页 `pinyin.html` + `pinyin.js`：菜单 12 个知识点卡片 → 点进详情。只用 `zika.css` 护眼 token；平板 2 列、桌面 ≥1200 3 列；触控 ≥44px；焦点环 3px `--accent`。
- 导航按 FRONTEND_UI.md §7：`NHZNavPage.set(['拼音'])` / `(['拼音', 知识点], [showHome, null])`，不用浏览器历史；支持 `pinyin.html?t=<id>` 直达。
- 数据 `pinyin/data.js`（`window.NHZ_PINYIN_MENU`）：声调、单韵母、声母、y 和 w、拼读、复韵母、鼻韵母、整体认读、拼写规则、易混音、变调轻声儿化、音节总表。顺序和分组按统编 2024 一上第 1–14 课；规则依《汉语拼音方案》和 GB/T 16159-2012，出处写在各节 note。讲解自编。
- `sw.js` 用 `tools/gen_sw_core.py` 重新生成（CORE 106 项）。
- `tests/smoke.spec.js`：PAGES 加 `pinyin.html`；新用例「拼音面板在识字后面 → 进声母 → 面包屑 → 返回两级回首页」。

## 验证
- `node tools/check_scripts.js`：477 段全过，内容校验全过。
- Playwright（`PW_NO_SERVER=1`）：pinyin 页无报错、768/1280 无横向溢出、sw.js 清单最新、首页面板、新导航用例，6/6 通过。

## 已知问题 / 未做
- 只有静态讲解和字母芯片，**没有声音、白板、练习**。音节总表、拼读、易混音三处显示「待做」说明。
- 首页拼音面板进度条是固定 2%，文案「12 个知识点」，后续接学习记录。
- 没有接入字卡点拼音、题库「拼音」分类。

## 下一步（按调研报告 P0–P4）
1. P0：音节解析器 + 合法音节表（进 CI，跑 3500 字）；音频方案（audio-cmn CC BY-SA + 自录声母呼读音 + edge-tts 词句，待负责人拍板）；声调色统一；字卡拼音可点拆读。
2. P1：白板 `tone` / `bump` / `mirror` 模板，声调、单韵母、声母、两拼的 L1–L3 幕。
3. P2–P4：见 `/workspace/work/pinyin-research-2026-11-06.md`（仓库外调研报告）。
