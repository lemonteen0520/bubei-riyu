import { FULL_WORDS } from '../data/wordbank-full'
import type { AppState, JLPTLevel, Word, WordProgress } from '../types'
import { kanaToRomaji } from './romaji'
import { normalizeKana } from './normalize'

const WORDS_KEY = 'bbrj.words'
const STATE_KEY = 'bbrj.state'
const IMPORTED_KEY = 'bbrj.imported'

export const DEFAULT_STATE: AppState = {
  progress: {},
  streak: 0,
  lastStudyDay: '',
  level: 'N5',
  updateUrl: 'https://raw.githubusercontent.com/lemonteen0520/bubei-riyu/main/release-update.json',
  version: '0.1.0',
  groupOrder: undefined,
}

export function loadWords(): Word[] {
  try {
    const raw = localStorage.getItem(WORDS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Word[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // 忽略损坏数据，回退到内置词表
  }
  return FULL_WORDS
}

export function saveWords(words: Word[]): void {
  localStorage.setItem(WORDS_KEY, JSON.stringify(words))
  localStorage.setItem(IMPORTED_KEY, 'true')
}

export function isImported(): boolean {
  return localStorage.getItem(IMPORTED_KEY) === 'true'
}

export function resetToStarter(): void {
  localStorage.removeItem(WORDS_KEY)
  localStorage.removeItem(IMPORTED_KEY)
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (raw) {
      return { ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<AppState>) }
    }
  } catch {
    // 忽略
  }
  return { ...DEFAULT_STATE }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STATE_KEY, JSON.stringify(state))
}

export function wordsOfLevel(words: Word[], level: JLPTLevel): Word[] {
  return words.filter(w => w.level === level)
}

// ---------- 导入解析 ----------

const COLUMN_ALIASES: Record<string, keyof Word> = {
  level: 'level', jlpt: 'level', 级别: 'level', 等级: 'level',
  kana: 'kana', reading: 'kana', hiragana: 'kana', 假名: 'kana', 读音: 'kana',
  kanji: 'kanji', word: 'kanji', term: 'kanji', 漢字: 'kanji', 汉字: 'kanji', 单词: 'kanji', 词: 'kanji',
  romaji: 'romaji', roma: 'romaji', 罗马音: 'romaji', 罗马字: 'romaji',
  pos: 'pos', pos_ja: 'pos', speech: 'pos', 词性: 'pos', 品词: 'pos',
  meaning: 'meaning', gloss: 'meaning', definition: 'meaning', 释义: 'meaning', 意思: 'meaning', 中文: 'meaning',
  meaningEn: 'meaningEn', meaning_en: 'meaningEn', english: 'meaningEn', 英文: 'meaningEn',
  example: 'example', sentence: 'example', 例句: 'example', 例文: 'example',
  exampleCn: 'exampleCn', example_cn: 'exampleCn', translation: 'exampleCn', 例句翻译: 'exampleCn', 翻译: 'exampleCn',
  id: 'id',
}

function mapRowToWord(row: Record<string, string>, index: number): Word | null {
  const mapped: Partial<Word> = {}
  for (const [key, value] of Object.entries(row)) {
    const target = COLUMN_ALIASES[key.trim().toLowerCase()] ?? COLUMN_ALIASES[key.trim()]
    if (target) {
      ;(mapped as Record<string, string>)[target] = value.trim()
    }
  }
  const level = (mapped.level || 'N5').toUpperCase() as JLPTLevel
  const kana = mapped.kana || ''
  const kanji = mapped.kanji || kana
  const meaning = mapped.meaning || ''
  if (!kana && !meaning) return null
  const w: Word = {
    id: mapped.id || `import-${index}`,
    level: ['N5', 'N4', 'N3', 'N2', 'N1'].includes(level) ? level : 'N5',
    kana,
    kanji,
    romaji: mapped.romaji || kanaToRomaji(normalizeKana(kana)),
    pos: mapped.pos || '',
    meaning,
    meaningEn: mapped.meaningEn || '',
    example: mapped.example || '',
    exampleCn: mapped.exampleCn || '',
  }
  return w
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length < 2) return []
  const splitLine = (line: string): string[] => {
    const cells: string[] = []
    let cur = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (inQuote) {
        if (c === '"' && line[i + 1] === '"') {
          cur += '"'
          i++
        } else if (c === '"') {
          inQuote = false
        } else {
          cur += c
        }
      } else if (c === '"') {
        inQuote = true
      } else if (c === ',') {
        cells.push(cur)
        cur = ''
      } else {
        cur += c
      }
    }
    cells.push(cur)
    return cells
  }
  const header = splitLine(lines[0]).map(h => h.trim())
  return lines.slice(1).map(line => {
    const cells = splitLine(line)
    const row: Record<string, string> = {}
    header.forEach((h, idx) => {
      row[h] = cells[idx] ?? ''
    })
    return row
  })
}

function detectCsvHeader(header: string[]): boolean {
  const known = new Set<string>(Object.values(COLUMN_ALIASES))
  return header.some(h => known.has(h) || known.has(h.trim().toLowerCase()))
}

function wordToCsvHeader(): string[] {
  return ['level', 'kanji', 'kana', 'romaji', 'pos', 'meaning', 'example', 'exampleCn']
}

function wordToCsvRow(w: Word): string[] {
  return [w.level, w.kanji, w.kana, w.romaji, w.pos, w.meaning, w.example, w.exampleCn]
}

function escapeCsvCell(cell: string): string {
  if (/[",\n]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`
  return cell
}

export function wordsToCsv(words: Word[]): string {
  const lines = [wordToCsvHeader().join(',')]
  for (const w of words) lines.push(wordToCsvRow(w).map(escapeCsvCell).join(','))
  return lines.join('\n')
}

export function wordsToJson(words: Word[]): string {
  return JSON.stringify(words, null, 2)
}

export type ImportResult = { ok: true; count: number; words: Word[] } | { ok: false; error: string }

/** 解析导入的 JSON 或 CSV 文本，返回实际词条 */
export function parseImport(text: string): ImportResult {
  if (!text.trim()) return { ok: false, error: '文件为空，请检查后重试。' }
  const trimmed = text.trim()

  try {
    const data = JSON.parse(trimmed)
    const arr = Array.isArray(data) ? data : data.words
    if (!Array.isArray(arr) || arr.length === 0) {
      return { ok: false, error: 'JSON 中没有找到词条数组（需要数组或 { words: [...] }）。' }
    }
    const words: Word[] = []
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i] as Record<string, string>
      const w = mapRowToWord(item, i)
      if (w) words.push(w)
    }
    if (words.length === 0) return { ok: false, error: '未解析到有效词条，请确认包含「假名/释义」等字段。' }
    return { ok: true, count: words.length, words }
  } catch {
    // 不是合法 JSON，按 CSV 处理
    const rows = parseCSV(trimmed)
    if (rows.length === 0) return { ok: false, error: '无法识别文件格式，仅支持 JSON 或 CSV。' }
    const first = Object.keys(rows[0])
    if (!detectCsvHeader(first)) {
      return { ok: false, error: 'CSV 缺少可识别的表头（如 level, kanji, kana, meaning…）。' }
    }
    const words: Word[] = []
    for (let i = 0; i < rows.length; i++) {
      const w = mapRowToWord(rows[i], i)
      if (w) words.push(w)
    }
    if (words.length === 0) return { ok: false, error: 'CSV 未解析到有效词条。' }
    return { ok: true, count: words.length, words }
  }
}

/** 将解析后的词条写入存储 */
export function applyImport(words: Word[]): void {
  saveWords(words)
}

export function progressFor(progress: WordProgress, wordId: string) {
  return (
    progress[wordId] || { mastery: 0, seen: 0, correct: 0, wrong: 0, lastSeen: 0, studied: 0, known: false, reviewAt: 0, reviewLevel: 0 }
  )
}

/** 艾宾浩斯遗忘曲线间隔（天） */
export const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30, 60]

export function reviewDue(p: ReturnType<typeof progressFor>, now = Date.now()): boolean {
  return p.studied > 0 && (p.reviewAt || 0) <= now
}
