import { useMemo } from 'react'
import type { AppState, JLPTLevel, Word } from '../types'
import { LEVELS, LEVEL_LABEL } from '../data/levels'
import { wordsOfLevel, progressFor } from '../utils/store'
import Seal from '../components/Seal'

interface Props {
  state: AppState
  words: Word[]
  onStart: (level?: JLPTLevel) => void
  onGoReview: () => void
  onGoLibrary: () => void
  onGoSettings: () => void
}

export default function HomeView({ state, words, onStart, onGoReview, onGoLibrary, onGoSettings }: Props) {
  const overall = useMemo(() => {
    if (words.length === 0) return 0
    const sum = words.reduce((acc, w) => acc + progressFor(state.progress, w.id).mastery, 0)
    return sum / words.length
  }, [words, state.progress])

  const totalSeen = useMemo(
    () => words.filter(w => progressFor(state.progress, w.id).seen > 0).length,
    [words, state.progress],
  )

  const reviewCount = useMemo(
    () => words.filter(w => {
      const p = progressFor(state.progress, w.id)
      return p.studied > 0 && !p.known
    }).length,
    [words, state.progress],
  )

  return (
    <div className="home">
      <header className="home-hero">
        <div className="hero-stamp">
          <Seal value={overall} size={116} label={`整体掌握度 ${Math.round(overall * 100)}%`} />
        </div>
        <div className="hero-copy">
          <h1 className="app-title">不背日语</h1>
          <p className="hero-sub">和纸 · 墨 · 朱印</p>
          <p className="hero-meta">
            {totalSeen} / {words.length} 词已学 · 连续 {state.streak} 天
          </p>
        </div>
      </header>

      <section className="level-grid" aria-label="选择级别">
        {LEVELS.map(level => {
          const list = wordsOfLevel(words, level)
          const sum = list.reduce((acc, w) => acc + progressFor(state.progress, w.id).mastery, 0)
          const lvl = list.length > 0 ? sum / list.length : 0
          return (
            <button
              key={level}
              className="level-card"
              onClick={() => onStart(level)}
            >
              <span className="level-name">{level}</span>
              <span className="level-desc">{LEVEL_LABEL[level]}</span>
              <span className="level-count">{list.length} 词</span>
              <Seal value={lvl} size={46} />
            </button>
          )
        })}
      </section>

      <div className="home-actions">
        <button className="primary-btn review-cta" onClick={onGoReview}>
          复习 · {reviewCount} 词待复习
        </button>
        <button className="primary-btn" onClick={() => onStart()}>
          继续学习 · {state.level}
        </button>
        <div className="secondary-row">
          <button className="ghost-btn" onClick={onGoLibrary}>浏览词库</button>
          <button className="ghost-btn" onClick={onGoSettings}>词库与更新</button>
        </div>
      </div>
    </div>
  )
}
