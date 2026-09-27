import { useEffect, useMemo, useState } from 'react'
import type { JLPTLevel, Word } from '../types'
import { LEVELS } from '../data/levels'

interface Props {
  words: Word[]
  onStartLevel: (level: JLPTLevel) => void
  onRefresh: () => void
}

export default function LibraryView({ words, onStartLevel, onRefresh }: Props) {
  const [level, setLevel] = useState<JLPTLevel | 'all'>('all')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [limit, setLimit] = useState(50)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return words.filter(w => {
      const inLevel = level === 'all' || w.level === level
      if (!inLevel) return false
      if (!q) return true
      return (
        w.kanji.includes(query) ||
        w.kana.includes(query) ||
        w.romaji.toLowerCase().includes(q) ||
        w.meaning.includes(query)
      )
    })
  }, [words, level, query])

  const visible = filtered.slice(0, limit)

  useEffect(() => {
    setLimit(50)
  }, [level, query])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: words.length }
    for (const l of LEVELS) c[l] = words.filter(w => w.level === l).length
    return c
  }, [words])

  return (
    <div className="library">
      <header className="view-head">
        <h2>词库</h2>
        <p className="view-sub">共 {words.length} 词 · 点击级别开始学习</p>
      </header>

      <input
        className="search-input"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="搜索汉字、假名、罗马音或释义"
      />

      <div className="level-tabs">
        <button className={level === 'all' ? 'active' : ''} onClick={() => setLevel('all')}>全部 {counts.all}</button>
        {LEVELS.map(l => (
          <button key={l} className={level === l ? 'active' : ''} onClick={() => setLevel(l)}>
            {l} {counts[l]}
          </button>
        ))}
      </div>

      <ul className="word-list">
        {visible.map(w => (
          <li key={w.id} className="word-row">
            <button className="word-row-head" onClick={() => setOpenId(openId === w.id ? null : w.id)}>
              <span className="row-kanji">{w.kanji}</span>
              <span className="row-kana">{w.kana}</span>
              <span className="row-level">{w.level}</span>
              <span className="row-chevron">{openId === w.id ? '▴' : '▾'}</span>
            </button>
            {openId === w.id && (
              <div className="word-row-detail">
                <div className="row-roma">{w.romaji}</div>
                <div className="row-pos">{w.pos}</div>
                <div className="row-meaning">{w.meaning}</div>
                <div className="row-example">{w.example}{w.exampleCn && `　${w.exampleCn}`}</div>
                <button className="ghost-btn" onClick={() => onStartLevel(w.level)}>学习此级别</button>
              </div>
            )}
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="empty-hint">没有匹配的词条。可前往「设置」导入更多词库。</li>
        )}
      </ul>

      {filtered.length > limit && (
        <button className="ghost-btn refresh-btn" onClick={() => setLimit(l => l + 100)}>
          显示更多（已显示 {limit} / {filtered.length}）
        </button>
      )}
      <button className="ghost-btn refresh-btn" onClick={onRefresh}>刷新词库</button>
    </div>
  )
}
