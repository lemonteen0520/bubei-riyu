import json
import os
import sys
import time
import urllib.parse
import urllib.request

ROOT = r"C:\Users\86137\Desktop\不背日语"
IN = ROOT + r"\src\data\wordbank-full.json"
OUT = ROOT + r"\src\data\wordbank-full.json"
CACHE = ROOT + r"\.worddata\zh-cache.json"
DELIM = "\n"


def load_cache():
    if os.path.exists(CACHE):
        with open(CACHE, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache):
    with open(CACHE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False)


def translate_batch(texts):
    q = urllib.parse.quote(DELIM.join(texts)[:490])
    url = f"https://api.mymemory.translated.net/get?q={q}&langpair=en|zh-CN"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=40) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    translated = data.get("responseData", {}).get("translatedText", "")
    parts = [p.strip() for p in translated.split(DELIM)]
    if len(parts) != len(texts):
        parts = [""] * len(texts)
        parts[0] = translated.strip()
    return parts


def translate_batch_retry(texts, retries=4):
    for attempt in range(retries):
        try:
            return translate_batch(texts)
        except Exception as e:
            if "429" in str(e) and attempt < retries - 1:
                time.sleep(3 + attempt * 4)
                continue
            raise
    return [""] * len(texts)


def main():
    words = json.load(open(IN, encoding="utf-8"))
    cache = load_cache()
    todo = []
    for w in words:
        en = w.get("meaningEn", "").strip()
        if en and en not in cache:
            todo.append(en)
    todo = list(dict.fromkeys(todo))
    print(f"to translate: {len(todo)}", file=sys.stderr)

    BATCH = 12
    done = 0
    errors = 0
    for i in range(0, len(todo), BATCH):
        chunk = todo[i:i + BATCH]
        pending = [t for t in chunk if t not in cache]
        if not pending:
            continue
        try:
            parts = translate_batch_retry(pending)
            for t, zh in zip(pending, parts):
                cache[t] = zh
                done += 1
        except Exception as e:
            errors += 1
            for t in pending:
                cache[t] = ""
            if errors <= 3:
                print(f"err: {e}", file=sys.stderr)
        if done % 120 == 0:
            save_cache(cache)
            print(f"progress {done}/{len(todo)}", file=sys.stderr)
        time.sleep(1.0)

    save_cache(cache)
    for w in words:
        en = w.get("meaningEn", "").strip()
        zh = cache.get(en, "")
        w["meaning"] = zh if zh else (w.get("meaning") or en or w.get("kana", ""))
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False, separators=(",", ":"))
    print(f"done={done} errors={errors} written={OUT}", file=sys.stderr)


if __name__ == "__main__":
    main()
