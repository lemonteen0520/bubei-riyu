import type { Word } from '../types'
import { canonicalRomaji, normalizeKana } from './normalize'

export interface CheckResult {
  correct: boolean
  matched: string
}

/**
 * 拼写判对：汉字、假名、罗马音任选其一，去除特殊符号后比较。
 * 提示面（看词选义）已展示的写法不参与判定。
 */
export function checkSpelling(word: Word, input: string, excludeKanji: boolean): CheckResult {
  const raw = input.trim()
  if (!raw) return { correct: false, matched: '' }

  const nk = normalizeKana(raw)
  const nr = canonicalRomaji(raw)

  const targets: { value: string; kana: string }[] = []
  if (!excludeKanji && word.kanji) {
    targets.push({ value: word.kanji, kana: normalizeKana(word.kanji) })
  }
  targets.push({ value: word.kana, kana: normalizeKana(word.kana) })

  const expectedRomaji = canonicalRomaji(word.romaji || word.kana)
  const romajiVariants = [canonicalRomaji(word.kana), expectedRomaji]

  // 假名/汉字匹配
  for (const t of targets) {
    if (nk.length > 0 && nk === t.kana) return { correct: true, matched: t.value }
  }

  // 罗马音匹配（用户输入里只含字母）
  if (/^[a-z]+$/.test(nr)) {
    for (const v of romajiVariants) {
      if (nr === v) return { correct: true, matched: word.romaji || word.kana }
    }
  }

  // 宽松：直接比较去除特殊符号后的假名/汉字整体
  const targetCombined = normalizeKana(word.kanji + word.kana)
  if (nk.length > 0 && nk === targetCombined) return { correct: true, matched: word.kanji || word.kana }

  return { correct: false, matched: '' }
}
