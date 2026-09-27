import type { JLPTLevel } from '../types'

export const LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

export const LEVEL_LABEL: Record<JLPTLevel, string> = {
  N5: '入门 · 基础语法',
  N4: '初级 · 日常会话',
  N3: '中级 · 衔接进阶',
  N2: '中高级 · 阅读能力',
  N1: '高级 · 综合运用',
}
