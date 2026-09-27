export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'

export interface Word {
  id: string
  level: JLPTLevel
  kana: string
  kanji: string
  romaji: string
  pos: string
  meaning: string
  meaningEn?: string
  example: string
  exampleCn: string
}

export interface WordProgress {
  [wordId: string]: {
    /** 0..1 掌握度 */
    mastery: number
    seen: number
    correct: number
    wrong: number
    lastSeen: number
    studied: number
    known: boolean
    /** 学习流水线：所属组（按顺序分组，每组 10 词） */
    group?: number
    /** 当前关卡：1/2/3；3 表示已过完三关 */
    stage?: number
    /** 艾宾浩斯复习：下次复习时间戳（ms） */
    reviewAt?: number
    /** 艾宾浩斯复习：当前间隔档位（0..6） */
    reviewLevel?: number
  }
}

export interface AppState {
  progress: WordProgress
  streak: number
  lastStudyDay: string
  level: JLPTLevel
  updateUrl: string
  version: string
  /** 全局学习顺序（按此顺序每 10 词一组），保证分组稳定 */
  groupOrder?: string[]
}

export type StudyMode = 'recall' | 'spell'
