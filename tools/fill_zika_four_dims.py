#!/usr/bin/env python3
"""补齐单字文件 data/zika/<字>.js 缺失的四维：读音 / 笔画 / 部首 / 繁体。

背景：3500 个单字文件里仅 18 字有这四维，3482 字缺失；但 model 层
ziku/model-3500.json 数据齐全（读音/笔画 100%，部首缺 2 字，繁体缺 4 字），
且与 data/index.js（识字浏览拼音）全量交叉核对一致（拼音在列、部首与笔画数
全等）。本脚本只从 model 复制数据，不手写、不编造读音。

规则：
- 只补缺失的维；已有维若与 model 不一致则不覆盖，只报告（现 18 字与 model 全等）。
- 新维按 读音、笔画、部首、繁体 的顺序插到 dim 与 src 的最前面（与已有 18 字的
  顺序一致），其余键顺序与内容原样不动；写回格式与原文件一致
  （window.NHZ_ZIKA = <compact JSON>;，无尾换行），重跑幂等。
- model 缺失的维不填、不猜：部首缺 有/背，繁体缺 凉/乾/藉/瞭。

用法：
    python3 tools/fill_zika_four_dims.py --check   # 只报告，不写盘
    python3 tools/fill_zika_four_dims.py --apply   # 写盘
"""
import argparse
import copy
import glob
import json
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(REPO, "newhanzi", "ziku", "model-3500.json")
ZIKA_DIR = os.path.join(REPO, "newhanzi", "data", "zika")
PREFIX = "window.NHZ_ZIKA = "
DIMS = ["读音", "笔画", "部首", "繁体"]


def load_zika(path):
    with open(path, encoding="utf-8") as f:
        raw = f.read()
    assert raw.startswith(PREFIX) and raw.endswith(";") and not raw.endswith("\n"), path
    return raw, json.loads(raw[len(PREFIX):-1])


def dump_zika(data):
    return PREFIX + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()
    if args.check == args.apply:
        ap.error("请二选一：--check 或 --apply")

    with open(MODEL_PATH, encoding="utf-8") as f:
        model = json.load(f)
    bymodel = {e["zi"]: e for e in model}

    changed, unchanged, warnings, unfilled = [], [], [], {}
    for path in sorted(glob.glob(os.path.join(ZIKA_DIR, "*.js"))):
        raw, data = load_zika(path)
        zi = data["zi"]
        me = bymodel.get(zi)
        if me is None:
            warnings.append(f"{zi}：model 无此字")
            continue
        mdim, msrc = me["dim"], me.get("src") or {}
        new_dim, new_src = {}, {}
        missing_model = []
        for k in DIMS:
            if k in data["dim"]:
                if data["dim"][k] != mdim.get(k):
                    warnings.append(f"{zi}：已有{k}与 model 不一致，未覆盖")
                continue
            if k not in mdim:
                missing_model.append(k)
                continue
            new_dim[k] = copy.deepcopy(mdim[k])
            if k in msrc:
                new_src[k] = msrc[k]
        if missing_model:
            unfilled[zi] = missing_model
        if not new_dim:
            unchanged.append(zi)
            continue
        # 新维插前面（读音、笔画、部首、繁体顺序），其余键原顺序不动
        data["dim"] = {**new_dim, **data["dim"]}
        data["src"] = {**new_src, **data["src"]}
        new_raw = dump_zika(data)
        # 断言：除新增四维与 src 外，其余内容原样
        old_again = json.loads(raw[len(PREFIX):-1])
        for k in old_again["dim"]:
            assert data["dim"][k] == old_again["dim"][k], (zi, k)
        for k in old_again["src"]:
            assert data["src"][k] == old_again["src"][k], (zi, k)
        assert set(data.keys()) == set(old_again.keys())
        if args.apply:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_raw)
        changed.append(zi)

    print(f"changed={len(changed)} unchanged={len(unchanged)} warnings={len(warnings)}")
    print("unfilled（model 缺失，不填不猜）:", unfilled)
    for w in warnings:
        print("WARN:", w)
    if args.check:
        print("check only，示例待改：", changed[:10])
    return 0


if __name__ == "__main__":
    sys.exit(main())
