// newhanzi 冒烟测试：新版页面能打开、没有控制台错误、站内链接不坏
// 根目录测试（tests/smoke.spec.js）只扫描根目录和 maps/，newhanzi 不在其中，
// 所以这里单独覆盖 newhanzi/，新增页面时把地址加进 PAGES 即可。
const { test, expect } = require("@playwright/test");
const fs = require("fs"), path = require("path");

const ROOT = path.resolve(__dirname, "..");
const NHZ = path.join(ROOT, "newhanzi");

function watch(page) {
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push("console: " + m.text()); });
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("response", r => {
    const u = new URL(r.url());
    if (u.hostname === "127.0.0.1" && r.status() >= 400) errors.push(`HTTP ${r.status()}: ${u.pathname}`);
  });
  return errors;
}

const PAGES = [
  "newhanzi/index.html",
  "newhanzi/zika.html?zi=%E5%A4%B4",
  "newhanzi/yuwen.html",
  "newhanzi/bushou.html",
  "newhanzi/grammar_lab.html",
  "newhanzi/proto-yuwen.html",
];

for (const p of PAGES) {
  test(`newhanzi 打开 ${p} 无报错`, async ({ page }) => {
    const errors = watch(page);
    const res = await page.goto(p, { waitUntil: "load" });
    expect(res.status()).toBeLessThan(400);
    await page.waitForLoadState("networkidle").catch(() => {});
    await expect(page.locator("body")).not.toBeEmpty();
    expect(errors, errors.join("\n")).toEqual([]);
  });
}

test("newhanzi 首页：识字表渲染、语法 Tab 指向正式版", async ({ page }) => {
  await page.goto("newhanzi/index.html", { waitUntil: "load" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await expect(page.locator("#learnedCount")).toContainText("/ 3500");
  await expect(page.locator("#list").locator("> *").first()).toBeVisible();
  // 语法主入口统一：iframe 必须是正式版 yuwen.html，不是原型
  await expect(page.locator("#panel-yuwen iframe")).toHaveAttribute("src", "yuwen.html");
});

test("newhanzi 字卡：指定字能渲染出来", async ({ page }) => {
  await page.goto("newhanzi/zika.html?zi=%E5%A4%B4", { waitUntil: "load" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await expect(page.locator("#app")).toContainText("头");
  await expect(page.locator("#app")).not.toContainText("字卡加载中");
});

test("newhanzi 语文：知识库渲染、原型只作为实验链接", async ({ page }) => {
  await page.goto("newhanzi/yuwen.html", { waitUntil: "load" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await expect(page.locator("#ywlist").locator("> *").first()).toBeVisible();
  await expect(page.locator("#ywtabs").locator("> *").first()).toBeVisible();
  await expect(page.locator('a[href="proto-yuwen.html"]')).toBeVisible();
});

test("newhanzi 部首：部首表渲染", async ({ page }) => {
  await page.goto("newhanzi/bushou.html", { waitUntil: "load" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await expect(page.locator("#bslist").locator("> *").first()).toBeVisible();
});

// 站内链接：静态扫描 newhanzi/ 顶层 HTML 里的 href/src，确认目标文件存在
test("newhanzi 站内链接都指向存在的文件", () => {
  const broken = [];
  for (const p of fs.readdirSync(NHZ).filter(f => f.endsWith(".html")).sort()) {
    const html = fs.readFileSync(path.join(NHZ, p), "utf8").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, m => /\bsrc=/.test(m) ? m.replace(/>[\s\S]*$/, ">") : "");
    const re = /\b(?:href|src)=["']([^"'#?]*)(?:[?#][^"']*)?["']/g; let m;
    while ((m = re.exec(html))) {
      const u = m[1];
      if (!u || /^(https?:|mailto:|tel:|data:|javascript:|blob:|\/\/)/i.test(u) || u.includes("${")) continue;
      const target = path.resolve(path.join(NHZ, path.dirname(p)), decodeURI(u));
      if (!fs.existsSync(target)) broken.push(`${p} → ${u}`);
    }
  }
  expect(broken, broken.join("\n")).toEqual([]);
});
