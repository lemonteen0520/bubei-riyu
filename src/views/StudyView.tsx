import { useEffect, useMemo, useRef, useState } from 'react'
import type { JLPTLevel, Word, WordProgress } from '../types'
import { progressFor } from '../utils/store'
import { checkSpelling } from '../utils/answer'

interface Props {
  words: Word[]
  level: JLPTLevel
  progress: WordProgress
  onExit: () => void
  onRecord: (progress: WordProgress) => void
  onWordsStudied: (wordIds: string[]) => void
  onFinish: () => void
}

type Stage = 1 | 2 | 3

const STAGE_LABEL: Record<Stage, string> = {
  1: '第一关 · 选择中文意思',
  2: '第二关 · 看词回忆（有提示）',
  3: '第三关 · 无提示回忆',
}

interface Pipeline {
  unprocessed: Word[]
  stage1: Word[]
  stage2: Word[]
  stage3: Word[]
  /** 已正式通过第三关的词数 */
  completed: number
  /** 本轮（每满 10 个完成词为一段） */
  roundDone: number
  /** 本轮通过第三关的词（供拼写） */
  done: Word[]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function stageOf(progress: WordProgress, id: string): number {
  return progressFor(progress, id).stage || 0
}

/** 外来语：汉字写法是英文/片假名为主，界面应把日文（假名）加粗展示 */
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

function normalize(p: Pipeline): Pipeline {
  const un = [...p.unprocessed]
  const s1 = [...p.stage1]
  const s2 = [...p.stage2]
  const s3 = [...p.stage3]
  // 三关各维持 10 个：第三关缺由第二关补，第二关缺由第一关补，第一关缺由未学词补
  while (s3.length < 10 && s2.length > 0) s3.push(s2.shift()!)
  while (s2.length < 10 && s1.length > 0) s2.push(s1.shift()!)
  while (s1.length < 10 && un.length > 0) s1.push(un.shift()!)
  return { unprocessed: un, stage1: s1, stage2: s2, stage3: s3, completed: p.completed, roundDone: p.roundDone, done: p.done }
}

function initPipeline(words: Word[], progress: WordProgress): Pipeline {
  // 依据已持久化的 stage 重建三关队列，未学词进入 unprocessed
  const unprocessed: Word[] = []
  const stage1: Word[] = []
  const stage2: Word[] = []
  const stage3: Word[] = []
  for (const w of shuffle(words)) {
    const s = stageOf(progress, w.id)
    if (s >= 4) continue // 已完成（stage=4）
    if (s === 3) stage3.push(w)
    else if (s === 2) stage2.push(w)
    else if (s === 1) stage1.push(w)
    else unprocessed.push(w)
  }
  return normalize({ unprocessed, stage1, stage2, stage3, completed: 0, roundDone: 0, done: [] })
}

export default function StudyView({ words, level, progress, onExit, onRecord, onWordsStudied, onFinish }: Props) {
  const [pipe, setPipe] = useState<Pipeline>(() => initPipeline(words, progress))
  const [selected, setSelected] = useState<number | null>(null)
  const [finished, setFinished] = useState(false)
  const [turn, setTurn] = useState(0)
  const [detailWord, setDetailWord] = useState<Word | null>(null)
  const [spelling, setSpelling] = useState(false)
  const [spellIndex, setSpellIndex] = useState(0)
  const [spellInput, setSpellInput] = useState('')
  const [spellResult, setSpellResult] = useState<boolean | null>(null)
  const [spellWrong, setSpellWrong] = useState(false)
  const [spellQueue, setSpellQueue] = useState<Word[]>([])
  const [spellMissed, setSpellMissed] = useState<Set<string>>(new Set())
  const [revealWord, setRevealWord] = useState<Word | null>(null)
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const spellInputRef = useRef<HTMLInputElement | null>(null)
  const progressRef = useRef(progress)

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  // 拼写输入框出现时自动聚焦
  useEffect(() => {
    if (spelling) {
      spellInputRef.current?.focus()
    }
  }, [spelling, spellIndex, spellResult])

  // 认识后展示释义约 1 秒自动前进
  useEffect(() => {
    if (revealWord) {
      revealTimer.current = setTimeout(() => confirmReveal(), 1000)
      return () => {
        if (revealTimer.current) clearTimeout(revealTimer.current)
      }
    }
  }, [revealWord])

  // 轮流穿插：第三关 → 第二关 → 第一关
  const activeStage: Stage | null =
    turn % 3 === 0
      ? pipe.stage3.length > 0 ? 3 : pipe.stage2.length > 0 ? 2 : pipe.stage1.length > 0 ? 1 : null
      : turn % 3 === 1
        ? pipe.stage2.length > 0 ? 2 : pipe.stage1.length > 0 ? 1 : pipe.stage3.length > 0 ? 3 : null
        : pipe.stage1.length > 0 ? 1 : pipe.stage2.length > 0 ? 2 : pipe.stage3.length > 0 ? 3 : null
  const currentWord = activeStage === 3 ? pipe.stage3[0] : activeStage === 2 ? pipe.stage2[0] : activeStage === 1 ? pipe.stage1[0] : undefined

  useEffect(() => {
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current)
    }
  }, [])

  const options = useMemo(() => {
    if (!currentWord || activeStage !== 1) return []
    const correct = currentWord.meaning
    const distractors = shuffle(
      words.filter(w => w.id !== currentWord.id && w.meaning && w.meaning !== correct),
    )
      .slice(0, 3)
      .map(w => w.meaning)
    return shuffle([correct, ...distractors])
  }, [currentWord, words, activeStage])

  const record = (wordId: string, correct: boolean, stage: number) => {
    const prev = progressFor(progressRef.current, wordId)
    const next: WordProgress = {
      ...progressRef.current,
      [wordId]: {
        ...prev,
        mastery: Math.max(0, Math.min(1, prev.mastery + (correct ? 0.12 : -0.15))),
        seen: prev.seen + 1,
        correct: prev.correct + (correct ? 1 : 0),
        wrong: prev.wrong + (correct ? 0 : 1),
        lastSeen: Date.now(),
        studied: prev.studied || Date.now(),
        stage,
      },
    }
    progressRef.current = next
    onRecord(next)
  }

  const exitTemporarily = () => {
    // 暂时退出：保存进度并返回，不结束本轮
    onExit()
  }

  const finishSession = () => {
    onFinish()
    setFinished(true)
  }

  // 前进一个词：答对晋级（第三关答对=完成），答错留原关重来
  const advance = (word: Word, correct: boolean) => {
    if (autoTimer.current) {
      clearTimeout(autoTimer.current)
      autoTimer.current = null
    }
    setSelected(null)
    setTurn(t => t + 1)
    setPipe(p => {
      let { unprocessed, stage1, stage2, stage3, completed, roundDone, done } = p
      if (stage3.length > 0 && stage3[0].id === word.id) {
        stage3 = stage3.slice(1)
        if (correct) {
          completed += 1
          done = [...done, word]
          if (completed % 10 === 0) roundDone += 1
        } else {
          stage3 = [...stage3, word] // 不认识：留第三关末尾重来
        }
      } else if (stage2.length > 0 && stage2[0].id === word.id) {
        stage2 = stage2.slice(1)
        if (correct) {
          stage3 = [...stage3, word]
        } else {
          stage2 = [...stage2, word]
        }
      } else if (stage1.length > 0 && stage1[0].id === word.id) {
        stage1 = stage1.slice(1)
        stage2 = [...stage2, word]
        // 第一关补满 10 个
        while (stage1.length < 10 && unprocessed.length > 0) {
          stage1 = [...stage1, unprocessed[0]]
          unprocessed = unprocessed.slice(1)
        }
      }
      return normalize({ unprocessed, stage1, stage2, stage3, completed, roundDone, done })
    })
  }

  const choose = (optIndex: number) => {
    if (!currentWord || selected !== null) return
    setSelected(optIndex)
    const correct = options[optIndex] === currentWord.meaning
    record(currentWord.id, correct, 2) // 第一关选对/错都进第二关
    autoTimer.current = setTimeout(() => advance(currentWord, correct), 700)
  }

  const judge = (correct: boolean) => {
    if (!currentWord) return
    const stage = activeStage || 1
    const nextStage = stage === 3 ? (correct ? 4 : 3) : stage === 2 ? (correct ? 3 : 2) : 2
    record(currentWord.id, correct, nextStage)
    if (stage === 3 && correct) {
      onWordsStudied([currentWord.id])
    }
    autoTimer.current = setTimeout(() => advance(currentWord, correct), 500)
  }

  // 第三关满 10 个 → 本轮结束
  useEffect(() => {
    if (pipe.completed > 0 && pipe.completed % 10 === 0 && !finished) {
      finishSession()
    }
  }, [pipe.completed, finished])

  if (finished && !spelling) {
    return (
      <div className="study study-summary">
        <div className="summary-card">
          <h2>本轮学习完成</h2>
          <p className="summary-rate">{pipe.completed}</p>
          <p className="summary-detail">本轮已通过第三关的词 · {level}</p>
          {pipe.done.length > 0 && (
            <div className="summary-wordlist">
              {pipe.done.map(w => (
                <span key={w.id} className="summary-word-chip">
                  {displayHead(w).main}
                </span>
              ))}
            </div>
          )}
          <div className="summary-actions">
            <button className="primary-btn" onClick={() => { setSpellQueue([...pipe.done]); setSpelling(true); setSpellIndex(0); setSpellInput(''); setSpellResult(null) }}>去拼写本组单词</button>
            <button className="primary-btn" onClick={() => { setFinished(false); setPipe(initPipeline(words, progress)) }}>继续下一轮</button>
            <button className="ghost-btn" onClick={onExit}>返回首页</button>
          </div>
        </div>
      </div>
    )
  }

  const submitSpell = () => {
    if (spelling) {
      const sw = spellQueue[spellIndex]
      if (!sw) return
      const r = checkSpelling(sw, spellInput, false)
      setSpellResult(r.correct)
      record(sw.id, r.correct, 4)
      if (r.correct) {
        const rest = spellQueue.filter((_, i) => i !== spellIndex)
        if (spellMissed.has(sw.id)) {
          // 之前拼错过：这次拼对也只移到队尾，需再干净拼对一次
          const nextMissed = new Set(spellMissed)
          nextMissed.delete(sw.id)
          setSpellMissed(nextMissed)
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
        // 第一次拼错：标记为错过，并移到队尾重新拼
        setSpellMissed(m => new Set(m).add(sw.id))
        setSpellWrong(true)
      }
    }
  }

  const nextAfterWrong = () => {
    const sw = spellQueue[spellIndex]
    if (!sw) return
    const rest = spellQueue.filter((_, i) => i !== spellIndex)
    setSpellQueue([...rest, sw]) // 移到队尾重拼
    setSpellIndex(0)
    setSpellInput('')
    setSpellResult(null)
    setSpellWrong(false)
  }

  const revealThenAdvance = (correct: boolean) => {
    if (!currentWord) return
    if (correct) {
      // 认识：先展示释义，点「下一步」再前进
      if (autoTimer.current) clearTimeout(autoTimer.current)
      setRevealWord(currentWord)
    } else {
      showDetail(currentWord)
    }
  }

  const confirmReveal = () => {
    const w = revealWord
    setRevealWord(null)
    if (w) {
      judge(true)
    }
  }

  const cancelReveal = () => {
    if (revealTimer.current) clearTimeout(revealTimer.current)
    setRevealWord(null)
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
            <div className="spell-result ok">
              <div className="result-verdict">答对了</div>
            </div>
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

  if (!currentWord) {
    return (
      <div className="study study-summary">
        <div className="summary-card">
          <h2>暂无待学单词</h2>
          <p className="summary-detail">该级别没有更多可学习的词。</p>
          <button className="primary-btn" onClick={onExit}>返回首页</button>
        </div>
      </div>
    )
  }

  const mastery = progressFor(progress, currentWord.id).mastery

  const showDetail = (w: Word) => {
    if (autoTimer.current) clearTimeout(autoTimer.current)
    setDetailWord(w)
  }

  const closeDetailAndAdvance = () => {
    const w = detailWord
    setDetailWord(null)
    if (w) {
      record(w.id, false, activeStage === 3 ? 3 : 2)
      advance(w, false)
    }
  }

  if (detailWord) {
    const dw = detailWord
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
          <button className="primary-btn" onClick={closeDetailAndAdvance}>下一步</button>
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
          <button className="ghost-btn" onClick={cancelReveal}>返回上一个</button>
        </div>
      </div>
    )
  }

  return (
    <div className="study">
      <header className="study-head">
        <button className="back-btn" onClick={exitTemporarily}>‹ 暂时退出</button>
        <div className="module-chip">{STAGE_LABEL[activeStage || 1]}</div>
        <span className="study-progress">已完成 {pipe.completed} 词</span>
      </header>

      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${Math.min(100, (pipe.completed % 10) * 10)}%` }} />
      </div>

      <div className="word-card">
        <div className="card-level">{currentWord.level}</div>

        {activeStage === 1 && (
          <div className="choice-block">
            <div className="word-face small">
              <div className="word-kanji">{displayHead(currentWord).main}</div>
              <div className="word-kana">{displayHead(currentWord).kana}</div>
            </div>
            <p className="spell-hint">选择正确的中文意思</p>
            <div className="choice-options">
              {options.map((opt, i) => {
                const isCorrect = opt === currentWord.meaning
                const isChosen = selected === i
                const cls = selected === null ? '' : isCorrect ? 'correct' : isChosen ? 'wrong' : 'muted'
                return (
                  <button
                    key={i}
                    className={`choice-option ${cls}`}
                    onClick={() => choose(i)}
                    disabled={selected !== null}
                  >
                    <span className="opt-index">{['一', '二', '三', '四'][i]}</span>
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {activeStage === 2 && (
          <div className="word-back">
            <div className="word-face">
              <div className="word-kanji">{displayHead(currentWord).main}</div>
              <div className="word-kana">{displayHead(currentWord).kana}</div>
              <div className="word-roma">{currentWord.romaji}</div>
            </div>
            <p className="spell-hint">提示 · 回忆它的意思</p>
            <div className="hint-meaning">
              <div className="word-pos">{currentWord.pos}</div>
              {currentWord.example && <div className="word-example">{currentWord.example}{currentWord.exampleCn && `　${currentWord.exampleCn}`}</div>}
            </div>
            <div className="answer-actions">
              <button className="wrong-btn" onClick={() => showDetail(currentWord)}>不认识</button>
              <button className="correct-btn" onClick={() => revealThenAdvance(true)}>认识</button>
            </div>
          </div>
        )}

        {activeStage === 3 && (
          <div className="word-back">
            <div className="word-face">
              <div className="word-kanji">{displayHead(currentWord).main}</div>
              <div className="word-kana">{displayHead(currentWord).kana}</div>
            </div>
            <p className="spell-hint">无提示 · 直接回忆意思</p>
            <div className="answer-actions">
              <button className="wrong-btn" onClick={() => showDetail(currentWord)}>不认识</button>
              <button className="correct-btn" onClick={() => revealThenAdvance(true)}>认识</button>
            </div>
          </div>
        )}
      </div>

      <footer className="study-foot">
        <span>掌握度</span>
        <div className="mini-track">
          <div className="mini-fill" style={{ width: `${mastery * 100}%` }} />
        </div>
        <span>{Math.round(mastery * 100)}%</span>
      </footer>
    </div>
  )
}
