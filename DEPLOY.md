# 公开部署说明（GitHub Pages）

## 现状核查（2026-11-04，实测）

- **目前没有已上线的公开链接**，切勿把下文推导地址当作已发布链接对外张贴。
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

1. 本地建分支并铺内容（在仓库根执行）：
   ```sh
   git checkout --orphan gh-pages
   git rm -rf .
   cp -r newhanzi/. .        # 上一步先切回 master 复制，或用 git show 导出
   cp -r icons .             # manifest 引用的图标必须同步到分支根
   ```
   注意：`manifest.webmanifest` 里的图标路径是 `../icons/...`（相对
   `newhanzi/` 的写法）。部署到分支根后，`../` 会越出站点根而 404，
   所以在 `gh-pages` 分支里要把 manifest 的图标路径改为 `icons/...`
   （只改 `gh-pages` 分支，不改 `master`）。
2. GitHub 网页操作（需仓库管理员）：
   仓库 Settings → Pages → Build and deployment → Source 选
   “Deploy from a branch” → Branch 选 `gh-pages`、目录选 `/ (root)` → Save。
3. 等 1–2 分钟，访问 `https://abcliu110.github.io/hanzi-app/`。
   这是按仓库名推导的**预期地址**，部署完成前会 404；
   只有完成上面两步后它才是真实可用的公开链接。
4. 之后每次更新：把 `newhanzi/` 的改动同步到 `gh-pages` 分支并推送
   （后续可加一个 workflow 自动同步，本次未做——需用户确认是否要自动发布）。

## 方案 B（免配置）：拖拽部署

把 `newhanzi/` 文件夹拖到 Netlify Drop / Cloudflare Pages / Vercel，
得到一个临时域名。同样注意：保持应用文件在站点根，并把 `icons/`
同步到根、把 manifest 图标路径改为 `icons/...`，否则图标 404。

## PWA 相关

- `start_url` 是相对路径 `./index.html`，根部署下正常。
- `sw.js` 注册仅在 `http(s)` 下进行，`file://` 打开不注册，属正常。
- 安装入口逻辑在 `newhanzi/install.js`：桌面/安卓走浏览器安装提示，
  iOS 走手动“分享 → 添加到主屏幕”说明；已安装时不显示。
