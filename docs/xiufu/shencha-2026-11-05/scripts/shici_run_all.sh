#!/bin/sh
# 古诗词内容审查：全部复查脚本（只读快照 snap/，结果写 tmp/）
cd "$(dirname "$0")/.." && mkdir -p tmp
node scripts/shici_dump.js
for s in shangxi quality poems quiz sync age ys_template; do echo "== $s"; python3 scripts/shici_scan_$s.py; done
