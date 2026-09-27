import gzip
import json
import re
import sys
import xml.etree.ElementTree as ET

import openpyxl

ROOT = r"C:\Users\86137\Desktop\不背日语"
XLSX = ROOT + r"\《红宝书》去重版.xlsx"
JMDICT = ROOT + r"\.worddata\JMdict_e.gz"
OUT = ROOT + r"\src\data\wordbank-full.json"


def norm_kana(s: str) -> str:
    if not s:
        return ""
    # 全角转半角、去长音符，便于匹配
    return s.strip().replace("ー", "").replace("～", "")


# 假名 -> 罗马音（Hepburn），与前端 romaji.ts 保持一致
BASIC = {
    "あ": "a", "い": "i", "う": "u", "え": "e", "お": "o",
    "か": "ka", "き": "ki", "く": "ku", "け": "ke", "こ": "ko",
    "さ": "sa", "し": "shi", "す": "su", "せ": "se", "そ": "so",
    "た": "ta", "ち": "chi", "つ": "tsu", "て": "te", "と": "to",
    "な": "na", "に": "ni", "ぬ": "nu", "ね": "ne", "の": "no",
    "は": "ha", "ひ": "hi", "ふ": "fu", "へ": "he", "ほ": "ho",
    "ま": "ma", "み": "mi", "む": "mu", "め": "me", "も": "mo",
    "や": "ya", "ゆ": "yu", "よ": "yo",
    "ら": "ra", "り": "ri", "る": "ru", "れ": "re", "ろ": "ro",
    "わ": "wa", "を": "wo", "ん": "n",
    "が": "ga", "ぎ": "gi", "ぐ": "gu", "げ": "ge", "ご": "go",
    "ざ": "za", "じ": "ji", "ず": "zu", "ぜ": "ze", "ぞ": "zo",
    "だ": "da", "ぢ": "ji", "づ": "zu", "で": "de", "ど": "do",
    "ば": "ba", "び": "bi", "ぶ": "bu", "べ": "be", "ぼ": "bo",
    "ぱ": "pa", "ぴ": "pi", "ぷ": "pu", "ぺ": "pe", "ぽ": "po",
}
SMALL = {"ぁ": "a", "ぃ": "i", "ぅ": "u", "ぇ": "e", "ぉ": "o", "ゃ": "ya", "ゅ": "yu", "ょ": "yo"}


def kana_to_romaji(kana: str) -> str:
    if not kana:
        return ""
    out = ""
    i = 0
    while i < len(kana):
        ch = kana[i]
        nxt = kana[i + 1] if i + 1 < len(kana) else ""
        if ch == "っ":
            following = BASIC.get(nxt, "")
            if following:
                out += following[0]
                i += 1
                continue
            i += 1
            continue
        if ch == "ー":
            prev = out[-1] if out else ""
            if prev == "o":
                out += "u"
            elif prev == "e":
                out += "i"
            elif prev:
                out += prev
            i += 1
            continue
        if nxt in SMALL and ch in BASIC:
            out += BASIC[ch][0] + SMALL[nxt]
            i += 2
            continue
        out += BASIC.get(ch, "")
        i += 1
    return out


def load_words():
    wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
    ws = wb["红宝书去重版"]
    words = []
    for r in ws.iter_rows(min_row=3, values_only=True):
        kana = r[2]
        kanji = r[3]
        level = r[23]
        if kana is None and kanji is None:
            continue
        if level not in ("N5", "N4", "N3", "N2", "N1"):
            continue
        words.append(
            {
                "kana": str(kana).strip() if kana else "",
                "kanji": str(kanji).strip() if kanji else "",
                "level": level,
            }
        )
    return words


def parse_jmdict():
    index = {}
    with gzip.open(JMDICT, "rt", encoding="utf-8", errors="replace") as f:
        context = ET.iterparse(f, events=("end",))
        for _event, elem in context:
            if elem.tag != "entry":
                continue
            kebs = [k.text for k in elem.findall(".//k_ele/keb") if k.text]
            rebs = [k.text for k in elem.findall(".//r_ele/reb") if k.text]
            senses = []
            for sense in elem.findall("sense"):
                pos = [p.text for p in sense.findall("pos") if p.text]
                gloss = [g.text for g in sense.findall("gloss") if g.text]
                if gloss:
                    senses.append({"pos": pos, "gloss": gloss})
            entry = {"kebs": kebs, "rebs": rebs, "senses": senses}
            for k in kebs:
                index.setdefault(("k", norm_kana(k)), []).append(entry)
            for r in rebs:
                index.setdefault(("r", norm_kana(r)), []).append(entry)
            elem.clear()
    return index


def best_hit(index, kanji, kana):
    k = norm_kana(kanji)
    r = norm_kana(kana)
    candidates = []
    if k:
        candidates += [("kanji", e) for e in index.get(("k", k), [])]
    if r:
        candidates += [("kana", e) for e in index.get(("r", r), [])]
    if not candidates and k:
        candidates += [("kana", e) for e in index.get(("r", k), [])]
    if not candidates and r:
        candidates += [("kanji", e) for e in index.get(("k", r), [])]
    if not candidates:
        return None, None
    # 精确汉字匹配优先，其次精确假名匹配
    def score(item):
        kind, entry = item
        s = 2 if kind == "kanji" else 1
        if k and norm_kana(k) in [norm_kana(x) for x in entry["kebs"]]:
            s += 4
        if r and norm_kana(r) in [norm_kana(x) for x in entry["rebs"]]:
            s += 2
        return s
    kind, entry = max(candidates, key=score)
    return entry, kind


def main():
    words = load_words()
    print(f"xlsx words: {len(words)}", file=sys.stderr)
    index = parse_jmdict()
    print(f"jmdict index keys: {len(index)}", file=sys.stderr)

    out = []
    matched = 0
    for i, w in enumerate(words):
        kana = norm_kana(w["kana"])
        kanji = norm_kana(w["kanji"])
        entry, _kind = best_hit(index, w["kanji"], w["kana"])
        pos = ""
        gloss = ""
        if entry and entry["senses"]:
            matched += 1
            first = entry["senses"][0]
            pos = first["pos"][0] if first["pos"] else ""
            gloss = "；".join(first["gloss"][:3])
        out.append(
            {
                "id": f"{w['level'].lower()}-{i}",
                "level": w["level"],
                "kana": w["kana"],
                "kanji": w["kanji"],
                "romaji": kana_to_romaji(w["kana"]),
                "pos": pos,
                "meaning": gloss or w["kana"],   # 兜底：无释义时用假名，避免空选项
                "meaningEn": gloss,               # 英文释义（JMdict）
                "example": "",
                "exampleCn": "",
            }
        )

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"matched {matched}/{len(words)}", file=sys.stderr)
    print("written", OUT, file=sys.stderr)


if __name__ == "__main__":
    main()
