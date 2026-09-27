import json
import os
import re
import zipfile

ROOT = r"C:\Users\86137\Desktop\不背日语"
CJ3 = ROOT + r"\小学館中日辞典 第3版\小学館中日辞典 第3版[2025-05-03][pinyin].zip"
WORD = ROOT + r"\src\data\wordbank-full.json"
OUT = ROOT + r"\src\data\wordbank-full.json"
CACHE = ROOT + r"\.worddata\ja-zh.json"


def collect_b(node, out):
    """收集 data 中含 'b' 字段的节点文本（即日文释义）"""
    if isinstance(node, list):
        for x in node:
            collect_b(x, out)
    elif isinstance(node, dict):
        data = node.get("data")
        if isinstance(data, dict) and "b" in data:
            out.append(text_of(node.get("content")))
        collect_b(node.get("content"), out)


def text_of(node):
    if isinstance(node, str):
        return node
    if isinstance(node, list):
        return "".join(text_of(x) for x in node)
    if isinstance(node, dict):
        c = node.get("content")
        return text_of(c) if c is not None else ""
    return ""


def split_jp(s):
    return [x.strip() for x in re.split(r"[・、，,/；;]", s) if x.strip()]


def main():
    cache = {}
    if os.path.exists(CACHE):
        cache = json.load(open(CACHE, encoding="utf-8"))

    z = zipfile.ZipFile(CJ3)
    bank_files = sorted(
        [n for n in z.namelist() if n.startswith("term_bank_") and n.endswith(".json")],
        key=lambda n: int(re.search(r"term_bank_(\d+)\.json", n).group(1)),
    )

    for fn in bank_files:
        data = json.loads(z.read(fn).decode("utf-8"))
        for e in data:
            if not isinstance(e, list) or len(e) < 6:
                continue
            head = e[0]
            if not head:
                continue
            glosses = []
            collect_b(e[5], glosses)
            for g in glosses:
                for seg in split_jp(g):
                    if len(seg) <= 1:
                        continue
                    if seg not in cache:
                        cache[seg] = head

    json.dump(cache, open(CACHE, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"ja->zh entries: {len(cache)}")

    words = json.load(open(WORD, encoding="utf-8"))
    hit = 0
    for w in words:
        key = (w.get("kanji") or "").strip()
        kana = (w.get("kana") or "").strip()
        zh = cache.get(key) or cache.get(kana)
        if zh:
            w["meaning"] = zh
            hit += 1
    json.dump(words, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(f"filled {hit}/{len(words)}")


if __name__ == "__main__":
    main()
