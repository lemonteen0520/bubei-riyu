import { useEffect, useMemo, useState } from 'react'
import type { AppState, JLPTLevel, Word } from './types'
import { loadState, loadWords, saveState, wordsOfLevel } from './utils/store'
import HomeView from './views/HomeView'
import StudyView from './views/StudyView'
import LibraryView from './views/LibraryView'
import SettingsView from './views/SettingsView'
import ReviewView from './views/ReviewView'

export type View = 'home' | 'study' | 'review' | 'library' | 'settings'

export default function App() {
  const [view, setView] = useState<View>('home')
  const [words, setWords] = useState<Word[]>(() => loadWords())
  const [state, setState] = useState<AppState>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  const levelWords = useMemo(() => wordsOfLevel(words, state.level), [words, state.level])

  const startStudy = (level?: JLPTLevel) => {
    if (level) setState(s => ({ ...s, level }))
    setView('study')
  }

  const refreshWords = () => setWords(loadWords())

  const patchState = (patch: Partial<AppState>) => setState(s => ({ ...s, ...patch }))

  return (
    <div className="app">
      <main className="view">
        {view === 'home' && (
          <HomeView
            state={state}
            words={words}
            onStart={startStudy}
            onGoLibrary={() => setView('library')}
            onGoReview={() => setView('review')}
            onGoSettings={() => setView('settings')}
          />
        )}
        {view === 'study' && (
          <StudyView
            words={levelWords}
            level={state.level}
            progress={state.progress}
            onExit={() => setView('home')}
            onRecord={(progress) => patchState({ progress })}
            onWordsStudied={(wordIds) => {
              setState(s => {
                const progress = { ...s.progress }
                for (const id of wordIds) {
                  const p = progress[id]
                  if (p) {
                    progress[id] = {
                      ...p,
                      studied: p.studied || Date.now(),
                      reviewAt: p.reviewAt || Date.now() + 86400000,
                      reviewLevel: p.reviewLevel || 0,
                    }
                  }
                }
                return { ...s, progress }
              })
            }}
            onFinish={() => {
              const today = new Date().toDateString()
              setState(s => {
                const yesterday = new Date(Date.now() - 86400000).toDateString()
                const streak = s.lastStudyDay === today ? s.streak : s.lastStudyDay === yesterday ? s.streak + 1 : 1
                return { ...s, streak, lastStudyDay: today }
              })
            }}
          />
        )}
        {view === 'review' && (
          <ReviewView
            words={words}
            progress={state.progress}
            onExit={() => setView('home')}
            onRecord={(progress) => patchState({ progress })}
          />
        )}
        {view === 'library' && (
          <LibraryView
            words={words}
            onStartLevel={startStudy}
            onRefresh={refreshWords}
          />
        )}
        {view === 'settings' && (
          <SettingsView
            state={state}
            onPatch={patchState}
            words={words}
            onRefresh={refreshWords}
          />
        )}
      </main>
      <nav className="tabbar" aria-label="主导航">
        <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>
          <span className="tab-icon">印</span>首页
        </button>
        <button className={view === 'study' ? 'active' : ''} onClick={() => startStudy()}>
          <span className="tab-icon">背</span>学习
        </button>
        <button className={view === 'review' ? 'active' : ''} onClick={() => setView('review')}>
          <span className="tab-icon">复</span>复习
        </button>
        <button className={view === 'library' ? 'active' : ''} onClick={() => setView('library')}>
          <span className="tab-icon">書</span>词库
        </button>
        <button className={view === 'settings' ? 'active' : ''} onClick={() => setView('settings')}>
          <span className="tab-icon">設</span>设置
        </button>
      </nav>
    </div>
  )
}
