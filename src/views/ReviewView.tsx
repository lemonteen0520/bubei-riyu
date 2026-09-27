import { useEffect, useMemo, useRef, useState } from 'react'
import type { Word, WordProgress } from '../types'
import { progressFor, REVIEW_INTERVALS, reviewDue } from '../utils/store'
import { checkSpelling } from '../utils/answer'

interface Props {
  words: Word[]
  progress: WordProgress
  onExit: () => void
  onRecord: (progress: WordProgress) => void
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function isForeign(w: Word): boolean {
  if (/[A-Za-z]/.test(w.kanji)) return true
  const kana = w.kana || ''
  const kata = (kana.match(/[\u30a0-\u30ff]/g) || []).length
  const hira = (kana.match(/[\u3040-\u309f]/g) || []).length
  return kata > hira && kata > 0
}

function displayHead(w: Word): { main: string; kana: string } {
  if (isForeign(w)) return { main: w.kana || w.kanji, kana: w.romaji || '' }
  return { main: w.kanji || w.kana, kana: w.kana }
}

export default function ReviewView({ words, progress, onExit, onRecord }: Props) {
  const due = useMemo(
    () => words.filter(w => reviewDue(progressFor(progress, w.id))),
    [words, progress],
  )

  const [batch, setBatch] = useState<Word[]>(() => shuffle(due).slice(0, 10))
  const [knownWords, setKnownWords] = useState<Word[]>([])
  const [finished, setFinished] = useState(false)
  const [revealWord, setRevealWord] = useState<Word | null>(null)
  const [revealKnown, setRevealKnown] = useState(false)
  const [spelling, setSpelling] = useState(false)
  const [spellQueue, setSpellQueue] = useState<Word[]>([])
  const [spellIndex, setSpellIndex] = useState(0)
  const [spellInput, setSpellInput] = useState('')
  const [spellResult, setSpellResult] = useState<boolean | null>(null)
  const [spellMissed, setSpellMissed] = useState<Set<string>>(new Set())
  const [spellWrong, setSpellWrong] = useState(false)
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const spellInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current)
      if (revealTimer.current) clearTimeout(revealTimer.current)
    }
  }, [])

  useEffect(() => {
    if (revealWord) {
      revealTimer.current = setTimeout(() => confirmReveal(), 1000)
      return () => {
        if (revealTimer.current) clearTimeout(revealTimer.current)
      }
    }
  }, [revealWord])

  useEffect(() => {
    if (spelling) spellInputRef.current?.focus()
  }, [spelling, spellIndex, spellResult])

  const current = batch[0]

  const record = (wordId: string, known: boolean) => {
    const prev = progressFor(progress, wordId)
    const lvl = known ? Math.min(prev.reviewLevel || 0, REVIEW_INTERVALS.length - 1) : 0
    const next: WordProgress = {
      ...progress,
      [wordId]: {
        ...prev,
        mastery: Math.max(0, Math.min(1, prev.mastery + (known ? 0.15 : -0.15))),
        seen: prev.seen + 1,
        correct: prev.correct + (known ? 1 : 0),
        wrong: prev.wrong + (known ? 0 : 1),
        lastSeen: Date.now(),
        known,
        reviewAt: Date.now() + REVIEW_INTERVALS[lvl] * 86400000,
        reviewLevel: known ? (prev.reviewLevel || 0) + 1 : 0,
      },
    }
    onRecord(next)
  }

  const judge = (known: boolean) => {
    if (!current) return
    record(current.id, known)
    if (known) {
      setKnownWords(k => [...k, current])
      setBatch(b => b.slice(1))
    } else {
      // 不认识：放到队尾重新复习
      setBatch(b => [...b.slice(1), current])
    }
  }

  const revealThenJudge = (known: boolean) => {
    if (!current) return
    setRevealWord(current)
    setRevealKnown(known)
  }

  const confirmReveal = () => {
    const w = revealWord
    setRevealWord(null)
    if (w) judge(revealKnown)
  }

  // 一组复习完（10 词都点过认识，或队列清空）
  useEffect(() => {
    if (batch.length === 0 && !finished && !spelling) {
      setFinished(true)
    }
  }, [batch, finished, spelling])

  const submitSpell = () => {
    const sw = spellQueue[spellIndex]
    if (!sw) return
    const r = checkSpelling(sw, spellInput, false)
    setSpellResult(r.correct)
    if (r.correct) {
      const rest = spellQueue.filter((_, i) => i !== spellIndex)
      if (spellMissed.has(sw.id)) {
        const nm = new Set(spellMissed)
        nm.delete(sw.id)
        setSpellMissed(nm)
        setSpellQueue([...rest, sw])
        setSpellIndex(0)
        setSpellInput('')
        setSpellResult(null)
      } else if (rest.length > 0) {
        setSpellQueue(rest)
        setSpellIndex(0)
        setSpellInput('')
        setSpellResult(null)
      } else {
        setSpelling(false)
        setSpellQueue([])
        setSpellIndex(0)
        setSpellInput('')
        setSpellResult(null)
      }
    } else {
      setSpellMissed(m => new Set(m).add(sw.id))
      setSpellWrong(true)
    }
  }

  const nextAfterWrong = () => {
    const sw = spellQueue[spellIndex]
    if (!sw) return
    const rest = spellQueue.filter((_, i) => i !== spellIndex)
    setSpellQueue([...rest, sw])
    setSpellIndex(0)
    setSpellInput('')
    setSpellResult(null)
    setSpellWrong(false)
  }

  if (finished && !spelling) {
    return (
      <div className="study study-summary">
        <div className="summary-card">
          <h2>本组复习完成</h2>
          <p className="summary-rate">{knownWords.length}</p>
          <p className="summary-detail">本组认识 {knownWords.length} 词</p>
          <div className="summary-actions">
            {knownWords.length > 0 && (
              <button className="primary-btn" onClick={() => { setSpellQueue([...knownWords]); setSpelling(true); setSpellIndex(0); setSpellInput(''); setSpellResult(null) }}>去拼写本组单词</button>
            )}
            <button className="primary-btn" onClick={() => {
              const next = shuffle(due).slice(0, 10)
              setBatch(next)
              setKnownWords([])
              setFinished(false)
            }}>继续下一组</button>
            <button className="ghost-btn" onClick={onExit}>返回首页</button>
          </div>
        </div>
      </div>
    )
  }

  if (spelling && spellQueue.length > 0) {
    const sw = spellQueue[spellIndex]
    return (
      <div className="study">
        <header className="study-head">
          <button className="back-btn" onClick={() => setSpelling(false)}>‹ 返回小结</button>
          <div className="module-chip">拼写本组单词</div>
          <span className="study-progress">{spellIndex + 1} / {spellQueue.length}</span>
        </header>
        <div className="word-card">
          <div className="spell-prompt">
            <div className="word-meaning">{sw.meaning}</div>
            {sw.meaningEn && sw.meaningEn !== sw.meaning && <div className="word-roma">{sw.meaningEn}</div>}
            <p className="spell-hint">输入汉字、假名或罗马音</p>
          </div>
          <div className="spell-input-row">
            <input
              ref={spellInputRef}
              className="spell-input"
              value={spellInput}
              onChange={e => { setSpellInput(e.target.value); if (spellResult === false) setSpellResult(null) }}
              onKeyDown={e => { if (e.key === 'Enter' && spellResult !== true) submitSpell() }}
              placeholder="かんじ / kanji / 漢字"
              autoFocus
              disabled={spellResult === true}
            />
            {spellResult !== true && (
              <button className="primary-btn" onClick={submitSpell} disabled={!spellInput.trim()}>判定</button>
            )}
          </div>
          {spellResult === true && (
            <div className="spell-result ok"><div className="result-verdict">答对了</div></div>
          )}
          {spellResult === false && (
            <div className="spell-result ng">
              <div className="result-verdict">答错了</div>
              <div className="word-face small">
                <div className="word-kanji">{displayHead(sw).main}</div>
                <div className="word-kana">{displayHead(sw).kana}</div>
              </div>
              {spellWrong && <button className="ghost-btn" onClick={nextAfterWrong}>下一个</button>}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="study study-summary">
        <div className="summary-card">
          <h2>暂无待复习单词</h2>
          <p className="summary-detail">今天没有到期的复习内容。</p>
          <button className="primary-btn" onClick={onExit}>返回首页</button>
        </div>
      </div>
    )
  }

  if (revealWord) {
    const dw = revealWord
    const head = displayHead(dw)
    return (
      <div className="study">
        <header className="study-head">
          <div className="module-chip">词条详情</div>
        </header>
        <div className="word-card detail-card">
          <div className="card-level">{dw.level}</div>
          <div className="word-face">
            <div className="word-kanji">{head.main}</div>
            {head.kana && <div className="word-kana">{head.kana}</div>}
            {dw.romaji && <div className="word-roma">{dw.romaji}</div>}
          </div>
          <div className="word-back">
            {dw.pos && <div className="word-pos">{dw.pos}</div>}
            <div className="word-meaning">{dw.meaning}</div>
            {dw.meaningEn && dw.meaningEn !== dw.meaning && <div className="word-roma">{dw.meaningEn}</div>}
            {dw.example && <div className="word-example">{dw.example}{dw.exampleCn && `　${dw.exampleCn}`}</div>}
          </div>
          <button className="primary-btn" onClick={confirmReveal}>下一步</button>
        </div>
      </div>
    )
  }

  return (
    <div className="study">
      <header className="study-head">
        <button className="back-btn" onClick={onExit}>‹ 暂时退出</button>
        <div className="module-chip">复习 · 直接回忆</div>
        <span className="study-progress">剩余 {batch.length} 词</span>
      </header>
      <div className="word-card">
        <div className="card-level">{current.level}</div>
        <div className="word-face">
          <div className="word-kanji">{displayHead(current).main}</div>
          <div className="word-kana">{displayHead(current).kana}</div>
        </div>
        <div className="answer-actions">
          <button className="wrong-btn" onClick={() => revealThenJudge(false)}>不认识</button>
          <button className="correct-btn" onClick={() => revealThenJudge(true)}>认识</button>
        </div>
      </div>
    </div>
  )
}
