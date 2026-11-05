# 公开部署说明（GitHub Pages）

## 现状核查（2026-11-04，实测）

- **目前没有已上线的公开链接**，切勿把下文推导地址当作已发布链接对外张贴。
- 更新（2026-11-05）：`sync-to-source.yml` 已在 d35afd64 删除（-jpg 镜像已弃用，不恢复）；新增 `.github/workflows/gh-pages.yml`，master 推送后自动发布到 `gh-pages` 分支（见方案 A 步骤 4）。
- 无 `gh-pages` 分支（远端仅 `master`）；仓库根与 `newhanzi/` 下均无 `CNAME`；
  无 Pages 部署 workflow：`.github/workflows/ci.yml` 仅做数据校验与 npm，
  `sync-to-source.yml` 仅把推送镜像到 `abcliu110/hanzi-app`，都不是部署。
- `docs/` 目录只有文档（`anim/`、`frontend-ui.md`、`wenxue/`），不是应用，
  不能直接用 Pages 的 `/docs` 选项发布。
- PWA 壳子已就绪：`newhanzi/manifest.webmanifest`（`display: standalone`、
  `start_url: ./index.html`）+ `newhanzi/sw.js`，各页仅在 `http(s)` 下注册；
  首页已有安装入口（`install.js`：浏览器安装提示 + iOS 手动说明）。

## 方案 A（推荐）：GitHub Pages

Pages 只能发布分支根或 `/docs`，不能直接发布 `newhanzi/` 子目录，
所以要单独建一个内容在根的 `gh-pages` 分支：

1. 生成站点目录（在仓库根执行）：
   ```sh
   python3 tools/build_site.py          # 输出到 build/site/（已在 .gitignore）
   ```
   该脚本会：只复制运行时文件，**排除 `newhanzi/ziku/`（26MB 字库构建源）**、
   `*.md`、`*.py` 等；把仓库根 `icons/` 复制到站点根，并把 manifest 图标路径
   `../icons/...` 改成 `icons/...`（`master` 里保持 `../icons/` 不变）。
   然后把 `build/site/` 的内容提交到 `gh-pages` 分支根：
   ```sh
   git worktree add ../hanzi-gh-pages gh-pages   # 首次：git worktree add --orphan -b gh-pages ../hanzi-gh-pages
   rsync -a --delete --exclude .git build/site/ ../hanzi-gh-pages/
   cd ../hanzi-gh-pages && git add -A && git commit -m "发布" && git push origin gh-pages
   ```
   不要再用 `cp -r newhanzi/. .` 整目录复制——那样会把 ziku/ 构建源和文档一起发布。
2. GitHub 网页操作（需仓库管理员）：
   仓库 Settings → Pages → Build and deployment → Source 选
   “Deploy from a branch” → Branch 选 `gh-pages`、目录选 `/ (root)` → Save。
3. 等 1–2 分钟，访问 `https://abcliu110.github.io/hanzi-app/`。
   这是按仓库名推导的**预期地址**，部署完成前会 404；
   只有完成上面两步后它才是真实可用的公开链接。
4. 之后每次更新：重跑 `python3 tools/build_site.py`，再同步到 `gh-pages` 分支并推送
   （2026-11-05 已加 `.github/workflows/gh-pages.yml` 自动同步：master 推送 newhanzi/
   改动后自动执行上述打包并发布到 `gh-pages` 分支；手动发布仍按本节步骤走）。

## 方案 B（免配置）：拖拽部署

先运行 `python3 tools/build_site.py`，把生成的 `build/site/` 文件夹拖到
Netlify Drop / Cloudflare Pages / Vercel，得到一个临时域名
（不要直接拖 `newhanzi/`：会带上 26MB 的 `ziku/` 构建源，图标路径也不对）。

## PWA 相关

- `start_url` 是相对路径 `./index.html`，根部署下正常。
- `sw.js` 注册仅在 `http(s)` 下进行，`file://` 打开不注册，属正常。
- `sw.js` 预缓存清单由 `python3 tools/gen_sw_core.py` 从全部页面生成，VERSION 随清单自动变；
  请求一律网络优先（断网/超时才用缓存），发布新版后孩子下次打开即是新版，无需手动改 VERSION。
  新增或删除页面后重跑该脚本（smoke 测试会检查页面是否齐）。
- 安装入口逻辑在 `newhanzi/install.js`：桌面/安卓走浏览器安装提示，
  iOS 走手动“分享 → 添加到主屏幕”说明；已安装时不显示。
