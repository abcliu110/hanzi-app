# 交接 · 语法白板第 1 期 · 04 新色板 + 清理 29 处手填色 + 重拍基线

依据：设计 §3.3、§7.1 E0、§7.3 第 3 条。本提交单独可回退（Q17）。

## 改了什么
- `wb-engine.js` `PAL`：对 `#3f8e6b→#0f8c8c`、错 `#b85a52→#8f1d3f`、强调 `#c46a2b→#a8642f`、对照 `#4a7a8c→#8c6d3a`；词类色、墨、灰不变；成分墨 `#4f5d7a`。
- `ring()` 缺省色由「错」改为叙事强调（错误圈必须显式传错色并打 ✗）；`rel`「支配」箭头去掉硬编码 `#c22f2f`，改用墨色。
- 清理场景手填色 29 处（13 个文件），全部改为语义键：

| 文件 | 原色 → 语义键 |
|---|---|
| zhuyu / weiyu / buyu | 主语 `#274b8f→acc`；谓语、无主句 `#c22f2f→cmp`；weiyu 宾语 `#3f8e6b→acc` |
| binyu | 动词 `#c22f2f→verb`；宾语、买什么、宾语提前 `#3f8e6b→acc` |
| dingyu | 定语 `#274b8f→acc` |
| gj_huati | 话题 `→acc`；评论 `→cmp`；做事的人 `#c22f2f→cmp` |
| gj_jianyu | 谁吃 `#c22f2f→cmp` |
| xc_biyu / xc_niren | 本体、物 `→cmp`；喻体、人的动作 `→acc` |
| jieci / fuci / daici / xingrongci | 词类指向箭头 `→prep / adv / pron / adj`（同色，改为键） |

成分 7 项此处只是过渡写法，07 回炉时改成 `role` 成分线；话题句、兼语句、比喻、拟人的角色改 `tag` 留到第 2 期 / 推广期。
- 规范 `baiban-yufa-guifan.md` §11.3 配色更新为新色板。
- 重拍 `tools/wb/baseline.json`。

## 验收（本提交实测）
- 换色前后 1536 帧 dump，**去掉 fill/stroke 后 0 帧不同**（`baseline.py --cmp-nocolor`）：只有颜色变了。
- 新 SVG 里旧色 `#3f8e6b / #b85a52 / #c46a2b / #4a7a8c` 出现 0 帧。
- `check_wb.py --lint`：0 错误（R5 色板自检通过），99 条警告全是 R4「建议有 L3」。
- `check_wb.py --all`（700 / 1100 两档）99 项全过；`selftest.py` 通过；`check_scripts.js` 通过。
- 总览截图人工过目（话题句、名词）：✓ 青绿、✗ 深玫红、强调棕橙，可读。

## 怎么验证
```bash
python3 tools/wb/baseline.py
python3 tools/wb/check_wb.py --lint
git show <本提交> --stat
```

## 已知问题
- 语法页面外框 CSS（`yuwen.css` 等）里的绿 / 红未动，只改白板画布。
- 成分 7 项此时主语、宾语都用强调色，区分度暂时下降，07 回炉解决。

## 下一步
- 05：lv 过滤、浅 / 中 / 深三档、`terms.js`。
