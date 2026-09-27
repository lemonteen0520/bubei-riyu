import json
import re
import zipfile

ROOT = r"C:\Users\86137\Desktop\不背日语"
RIKU = ROOT + r"\SGKK3.zip"
MINGJING = ROOT + r"\明镜日汉双解词典_Yomitan 1.4.4.zip"
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


def riku_mapping():
    """小学館日中：data.previous_b 为中文释义"""
    z = zipfile.ZipFile(RIKU)
    mapping = {}
    for fn in sorted(
        [n for n in z.namelist() if n.startswith("term_bank_") and n.endswith(".json")],
        key=lambda n: int(re.search(r"term_bank_(\d+)\.json", n).group(1)),
    ):
        for e in json.loads(z.read(fn).decode("utf-8")):
            if not isinstance(e, list) or len(e) < 6 or not e[0]:
                continue
            parts = []
            collect_riku(e[5], parts)
            cleaned = []
            for p in parts:
                p = re.sub(r"[.．。]$", "", p)
                if re.fullmatch(r"\d+", p):
                    continue
                if p:
                    cleaned.append(p)
            zh = "，".join(cleaned[:2])
            if zh:
                for key in (e[0], e[1] if len(e) > 1 else ""):
                    if key and key not in mapping:
                        mapping[key] = zh
    return mapping


def collect_riku(node, out):
    if isinstance(node, list):
        for x in node:
            collect_riku(x, out)
    elif isinstance(node, dict):
        data = node.get("data")
        if isinstance(data, dict):
            if data.get("orgtag") == "example":
                return
            if "previous_b" in data:
                t = text_of(node.get("content")).strip()
                if t:
                    out.append(t)
        collect_riku(node.get("content"), out)


def mingjing_mapping():
    """明镜日汉双解：lang=zh 且 class=dfcn 为中文释义"""
    z = zipfile.ZipFile(MINGJING)
    mapping = {}
    for fn in sorted(
        [n for n in z.namelist() if n.startswith("term_bank_") and n.endswith(".json")],
        key=lambda n: int(re.search(r"term_bank_(\d+)\.json", n).group(1)),
    ):
        for e in json.loads(z.read(fn).decode("utf-8")):
            if not isinstance(e, list) or len(e) < 6 or not e[0]:
                continue
            parts = []
            collect_mj(e[5], parts)
            cleaned = [re.sub(r"^/\s*", "", p).strip() for p in parts if p.strip()]
            zh = "，".join(cleaned[:2])
            if zh:
                for key in (e[0], e[1] if len(e) > 1 else ""):
                    if key and key not in mapping:
                        mapping[key] = zh
    return mapping


def collect_mj(node, out):
    if isinstance(node, list):
        for x in node:
            collect_mj(x, out)
    elif isinstance(node, dict):
        data = node.get("data")
        lang = node.get("lang")
        if isinstance(data, dict) and data.get("class") == "dfcn" and lang == "zh":
            out.append(text_of(node.get("content")))
        collect_mj(node.get("content"), out)


def main():
    print("building riku mapping...")
    riku = riku_mapping()
    print("riku entries:", len(riku))
    print("building mingjing mapping...")
    mj = mingjing_mapping()
    print("mingjing entries:", len(mj))

    words = json.load(open(WORD, encoding="utf-8"))
    filled = 0
    for w in words:
        cur = w.get("meaning", "")
        has_cn = cur and any("\u4e00" <= c <= "\u9fff" for c in cur)
        if has_cn:
            continue
        key = (w.get("kanji") or "").strip().lstrip("～")
        kana = (w.get("kana") or "").strip().lstrip("～")
        zh = riku.get(key) or riku.get(kana) or mj.get(key) or mj.get(kana)
        if not zh:
            # 再尝试去掉「～」前缀后的 kana
            zh = riku.get(kana.replace("～", "")) or mj.get(kana.replace("～", ""))
        if zh:
            w["meaning"] = zh
            filled += 1
    json.dump(words, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(f"newly filled {filled}")


if __name__ == "__main__":
    main()
