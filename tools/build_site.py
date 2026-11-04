#!/usr/bin/env python3
"""把 newhanzi/ 打包成可发布的静态站点目录（应用文件在站点根）。

  python3 tools/build_site.py [输出目录，默认 build/site]

- 排除构建源与文档：ziku/（26MB 字库构建源）、*.md、*.py、.gitignore、__pycache__
- 复制仓库根 icons/ 到站点根，并把 manifest 图标路径 ../icons/ 改成 icons/
- 输出目录在 .gitignore 的 build/ 下，不进仓库
GitHub Pages / Netlify 等都发布这个目录（见 DEPLOY.md）。
"""
import os, shutil, sys

REPO = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(REPO, 'newhanzi')
OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(REPO, 'build', 'site'))
EXCLUDE_DIRS = {'ziku', '__pycache__', 'node_modules'}
EXCLUDE_EXT = ('.md', '.py')
EXCLUDE_FILES = {'.gitignore', '.DS_Store'}

def main():
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    n = size = 0
    for d, dirs, files in os.walk(SRC):
        dirs[:] = [x for x in dirs if x not in EXCLUDE_DIRS]
        rel = os.path.relpath(d, SRC)
        for f in files:
            if f in EXCLUDE_FILES or f.endswith(EXCLUDE_EXT):
                continue
            dst = os.path.join(OUT, rel, f)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(os.path.join(d, f), dst)
            n += 1; size += os.path.getsize(dst)
    shutil.copytree(os.path.join(REPO, 'icons'), os.path.join(OUT, 'icons'))
    mf = os.path.join(OUT, 'manifest.webmanifest')
    txt = open(mf, encoding='utf-8').read().replace('"../icons/', '"icons/')
    open(mf, 'w', encoding='utf-8').write(txt)
    print('站点已生成：%s（%d 个文件，%.1f MB，已排除 ziku/ 等构建源）' % (OUT, n, size / 1048576))

if __name__ == '__main__':
    main()
