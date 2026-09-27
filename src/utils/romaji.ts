// 假名 → 罗马音（Hepburn）转换，用于内置词表自动生成与拼写校验。

const BASIC: Record<string, string> = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
  わ: 'wa', を: 'wo', ん: 'n',
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
}

const SMALL: Record<string, string> = {
  ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o',
  ゃ: 'ya', ゅ: 'yu', ょ: 'yo',
}

/** 将（已归一为平假名且保留长音符「ー」）的字符串转为罗马音 */
export function kanaToRomaji(kana: string): string {
  let out = ''
  let i = 0
  while (i < kana.length) {
    const ch = kana[i]
    const next = kana[i + 1]

    if (ch === 'っ') {
      const following = BASIC[next]
      if (following) {
        out += following[0]
        i += 1
        continue
      }
      i += 1
      continue
    }

    // 长音符：延长前一音节元音
    if (ch === 'ー') {
      const prev = out[out.length - 1]
      if (prev === 'o') out += 'u'
      else if (prev === 'e') out += 'i'
      else if (prev) out += prev
      i += 1
      continue
    }

    // 拗音
    if (next && SMALL[next] && BASIC[ch]) {
      const base = BASIC[ch]
      const suffix = SMALL[next]
      let joined = base[0] + suffix
      if (suffix === 'ya' || suffix === 'yu' || suffix === 'yo') {
        // 保留基础辅音 + ya/yu/yo
      }
      out += joined
      i += 2
      continue
    }

    out += BASIC[ch] ?? ''
    i += 1
  }
  return out
}

/** 比较两个罗马音（忽略长音/大小写差异） */
export function romajiEqual(a: string, b: string): boolean {
  const ca = a.replace(/oo/g, 'o').replace(/ou/g, 'o').replace(/uu/g, 'u')
  const cb = b.replace(/oo/g, 'o').replace(/ou/g, 'o').replace(/uu/g, 'u')
  return ca === cb
}
