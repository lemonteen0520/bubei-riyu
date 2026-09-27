import json

ROOT = r"C:\Users\86137\Desktop\不背日语"
IN = ROOT + r"\src\data\wordbank-full.json"
OUT = ROOT + r"\src\data\wordbank-full.ts"

data = json.load(open(IN, encoding="utf-8"))

with open(OUT, "w", encoding="utf-8") as f:
    f.write("import type { Word } from '../types'\n\n")
    f.write("const raw = ")
    f.write(json.dumps(data, ensure_ascii=False))
    f.write(" as unknown as Word[]\n")
    f.write("export const FULL_WORDS: Word[] = raw\n")

print("written", OUT)
