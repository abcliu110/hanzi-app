/* newhanzi service worker：离线使用
   只在 http(s) 下由各页面注册；file:// 打开时不会注册。
   - 安装时预缓存全部页面及其引用的样式/脚本（清单由 tools/gen_sw_core.py 从页面生成，勿手改）
     不预缓存 3500 个单字数据文件与语法题库，用到时再缓存
   - 所有同源请求：网络优先（拿到就更新缓存），断网或超时才用缓存
     → 改了代码/数据孩子下次打开就是新版，不必手动改 VERSION
   - VERSION 随清单自动变化；新增/删除页面后运行 python3 tools/gen_sw_core.py（测试会检查）。 */
/* @generated-core-start */
const VERSION = "nhz-df5eecc957";
const CORE = [
  "./",
  "bushou.html",
  "bushou.js",
  "bushou/anim.js",
  "bushou/data.js",
  "bushou/pianpang.js",
  "bushou/zi_map.js",
  "checkin.js",
  "data/grade_map.js",
  "data/guwen.js",
  "data/guwen_knowledge.js",
  "data/guwen_links.js",
  "data/index.js",
  "data/pinyin_lookup.js",
  "data/pz_derive.js",
  "data/shangxi.js",
  "data/shici.js",
  "data/shiju.js",
  "data/wenxue.js",
  "eye-care.js",
  "fuxi.html",
  "fuxi.js",
  "games/luoji/blocks.html",
  "games/luoji/daily.html",
  "games/luoji/domino.html",
  "games/luoji/fanpai.html",
  "games/luoji/fenchouti.html",
  "games/luoji/index.html",
  "games/luoji/miuwu.html",
  "games/luoji/taoquan.html",
  "games/luoji/zebra.html",
  "games/shici/beisong.html",
  "games/shici/chaodai.html",
  "games/shici/data_feihua.js",
  "games/shici/feihua.html",
  "games/shici/gelu.html",
  "games/shici/huazhong.html",
  "games/shici/jichu/beisong.html",
  "games/shici/jichu/duiou.html",
  "games/shici/jichu/guti.html",
  "games/shici/jichu/jiezou.html",
  "games/shici/jichu/langdu.html",
  "games/shici/jichu/lianju.html",
  "games/shici/jichu/pingze.html",
  "games/shici/jichu/qicheng.html",
  "games/shici/jichu/shiti.html",
  "games/shici/jichu/shiyan.html",
  "games/shici/jichu/silian.html",
  "games/shici/jichu/ticaid.html",
  "games/shici/jichu/wuyan.html",
  "games/shici/jichu/yayun.html",
  "games/shici/jichu/yixiang.html",
  "games/shici/jichu/yuefu.html",
  "games/shici/pengyouquan.html",
  "games/shici/poem_link.js",
  "games/yufa/bazi-beizi.html",
  "games/yufa/data_bazi.js",
  "games/yufa/data_dede.js",
  "games/yufa/data_guanlianci.js",
  "games/yufa/data_juzi.js",
  "games/yufa/dedide-dashu.html",
  "games/yufa/guanlianci.html",
  "games/yufa/juzi-chengfen.html",
  "grammar_lab.html",
  "guwen.html",
  "guwen/songdu.js",
  "index.html",
  "index.js",
  "install.js",
  "manifest.webmanifest",
  "nav-up.js",
  "pattern-templates.js",
  "pinyin.html",
  "pinyin.js",
  "pinyin/data.js",
  "proto-yuwen.html",
  "quiz/data_bushou.js",
  "quiz/data_guwen.js",
  "quiz/data_lab.js",
  "quiz/data_logic.js",
  "quiz/data_shici.js",
  "quiz/data_yuwen.js",
  "quiz/data_zika.js",
  "quiz/engine.js",
  "quiz/hua_gen.js",
  "quiz/index.html",
  "quiz/quiz.css",
  "share.html",
  "share.js",
  "shici.html",
  "speedtest.html",
  "stroke-player.css",
  "stroke-player.js",
  "today-task.js",
  "wb/index.js",
  "weekly.html",
  "weekly.js",
  "yuedu-xiezuo.html",
  "yuedu-xiezuo.js",
  "yuwen.html",
  "yuwen.js",
  "yuwen/data.js",
  "yuwen/quiz_bank_index.js",
  "zika.css",
  "zika.html",
  "zika.js"
];
/* @generated-core-end */
const NET_TIMEOUT_MS = 5000; /* 有缓存时网络超过这么久就先用缓存 */

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => Promise.all(CORE.map(u => c.add(new Request(u, { cache: "reload" })).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("nhz-") && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function put(key, res) {
  if (res && res.status === 200 && res.type === "basic") {
    const copy = res.clone();
    caches.open(VERSION).then(c => c.put(key, copy)).catch(() => {});
  }
  return res;
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const isPage = req.mode === "navigate" || req.destination === "document";
  const key = isPage ? new Request(url.pathname) : req;
  const fallback = () => caches.match(req, { ignoreSearch: true })
    .then(r => r || (isPage ? caches.match("index.html") : undefined))
    .then(r => r || Response.error());
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(cached => {
    const net = fetch(req).then(res => put(key, res));
    if (!cached) return net.catch(fallback);
    /* 有缓存：网络优先，但网络太慢时先给缓存（网络结果仍会写入缓存，下次即新版） */
    const timer = new Promise(resolve => setTimeout(() => resolve(cached), NET_TIMEOUT_MS));
    return Promise.race([net, timer]).catch(() => cached);
  }));
});
