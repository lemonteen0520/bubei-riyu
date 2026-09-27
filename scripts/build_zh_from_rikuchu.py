import json
import re
import zipfile

ROOT = r"C:\Users\86137\Desktop\不背日语"
RIKU = ROOT + r"\SGKK3.zip"
WORD = ROOT + r"\src\data\wordbank-full.json"
OUT = ROOT + r"\src\data\wordbank-full.json"


def text_of(node):
    if isinstance(node, str):
        return node
    if isinstance(node, list):
        return "".join(text_of(x) for x in node)
    if isinstance(node, dict):
        c = node.get("content")
        return text_of(c) if c is not None else ""
    return ""


def collect_zh(node, out, in_meaning=False):
    """只收集 data 中含 previous_b 的节点文本（即中文释义），忽略例句/补足"""
    if isinstance(node, list):
        for x in node:
            collect_zh(x, out, in_meaning)
    elif isinstance(node, dict):
        data = node.get("data")
        is_meaning = in_meaning
        if isinstance(data, dict):
            org = data.get("orgtag")
            if org == "example":
                return  # 跳过例句子树
            if org == "meaning":
                is_meaning = True
            if "previous_b" in data:
                txt = text_of(node.get("content")).strip()
                if txt:
                    out.append(txt)
        collect_zh(node.get("content"), out, is_meaning)


def chinese_gloss(struct):
    parts = []
    collect_zh(struct, parts)
    # 去掉纯数字义项号、词性括号、句尾标点
    cleaned = []
    for p in parts:
        p = re.sub(r"[.．。]$", "", p)
        if re.fullmatch(r"[\d]+", p):
            continue
        if p:
            cleaned.append(p)
    return "，".join(cleaned[:2])


def main():
    z = zipfile.ZipFile(RIKU)
    bank_files = sorted(
        [n for n in z.namelist() if n.startswith("term_bank_") and n.endswith(".json")],
        key=lambda n: int(re.search(r"term_bank_(\d+)\.json", n).group(1)),
    )
    mapping = {}
    for fn in bank_files:
        data = json.loads(z.read(fn).decode("utf-8"))
        for e in data:
            if not isinstance(e, list) or len(e) < 6:
                continue
            head = e[0]
            reading = e[1] if len(e) > 1 else ""
            if not head:
                continue
            zh = chinese_gloss(e[5])
            if not zh:
                continue
            # 映射：词头（汉字/假名）与读音都指向中文释义
            for key in (head, reading):
                if key and key not in mapping:
                    mapping[key] = zh

    print(f"ja->zh entries: {len(mapping)}")
    words = json.load(open(WORD, encoding="utf-8"))
    hit = 0
    for w in words:
        key = (w.get("kanji") or "").strip()
        kana = (w.get("kana") or "").strip()
        zh = mapping.get(key) or mapping.get(kana)
        if zh:
            w["meaning"] = zh
            hit += 1
    json.dump(words, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(f"filled {hit}/{len(words)}")


if __name__ == "__main__":
    main()
