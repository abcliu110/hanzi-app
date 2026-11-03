/* newhanzi service worker：离线使用
   只在 http(s) 下由各页面注册；file:// 打开时不会注册。
   - 安装时只预缓存主页面、样式、脚本和索引，不预缓存 3500 个单字数据文件
   - 页面：先走网络，失败时用缓存
   - 其他同源静态文件（含单字数据脚本）：先用缓存，同时在后台更新
   改了预缓存清单或想强制更新时，把 VERSION 加 1。 */
const VERSION = "nhz-v1";
const CORE = [
  "./", "index.html", "zika.html", "yuwen.html", "bushou.html", "grammar_lab.html", "proto-yuwen.html",
  "zika.css", "index.js", "zika.js", "yuwen.js", "bushou.js",
  "data/index.js", "yuwen/data.js", "bushou/data.js", "bushou/zi_map.js",
  "manifest.webmanifest"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("nhz-") && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function put(req, res) {
  if (res && res.status === 200 && res.type === "basic") {
    const copy = res.clone();
    caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {});
  }
  return res;
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const isPage = req.mode === "navigate" || req.destination === "document";
  if (isPage) {
    e.respondWith(fetch(req).then(res => put(new Request(url.pathname), res))
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(cached => {
    const net = fetch(req).then(res => put(req, res)).catch(() => cached);
    if (cached) { e.waitUntil(net.catch(() => {})); return cached; }
    return net;
  }));
});
