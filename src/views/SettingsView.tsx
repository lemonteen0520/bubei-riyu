import { useRef, useState } from 'react'
import type { AppState, Word } from '../types'
import {
  applyImport,
  parseImport,
  resetToStarter,
  wordsToCsv,
  wordsToJson,
} from '../utils/store'
import { CURRENT_VERSION, checkUpdate, downloadApk, installApk, verifyApk } from '../services/updater'
import type { UpdateProgress } from '../services/updater'

interface Props {
  state: AppState
  onPatch: (patch: Partial<AppState>) => void
  words: Word[]
  onRefresh: () => void
}

export default function SettingsView({ state, onPatch, words, onRefresh }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importMsg, setImportMsg] = useState('')
  const [importOk, setImportOk] = useState<boolean | null>(null)
  const [upd, setUpd] = useState<UpdateProgress>({ phase: 'idle', percent: 0, message: '' })
  const [apkReady, setApkReady] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const downloadBlob = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (file: File) => {
    const text = await file.text()
    const result = parseImport(text)
    if (!result.ok) {
      setImportOk(false)
      setImportMsg(result.error)
      return
    }
    // 重新解析得到词条数组（parseImport 仅返回数量，这里需实际词条）
    applyImport(result.words)
    onRefresh()
    setImportOk(true)
    setImportMsg(`已导入 ${result.count} 个词条，覆盖原有词库。`)
  }

  const runUpdate = async () => {
    if (!state.updateUrl.trim()) {
      setUpd({ phase: 'error', percent: 0, message: '请先填写更新源地址。' })
      return
    }
    setBusy(true)
    setApkReady(null)
    const check = await checkUpdate(state.updateUrl, p => setUpd(p))
    if (!check.hasUpdate || !check.manifest) {
      if (check.error) setUpd({ phase: 'error', percent: 0, message: check.error })
      setBusy(false)
      return
    }
    const m = check.manifest
    try {
      setUpd({ phase: 'downloading', percent: 0, message: m.notes ? `更新说明：${m.notes}` : '发现新版本，准备下载' })
      const downloaded = await downloadApk(m.apkUrl, p => setUpd(p))
      setUpd({ phase: 'verifying', percent: 100, message: '正在校验更新包…' })
      const ok = m.sha256 ? await verifyApk(downloaded.blobUrl, m.sha256) : true
      if (!ok) {
        setUpd({ phase: 'error', percent: 0, message: '更新包校验失败（sha256 不匹配），已中止。' })
        setBusy(false)
        return
      }
      setApkReady(m.apkUrl)
      setUpd({ phase: 'ready', percent: 100, message: `更新包就绪（${(downloaded.bytes / 1024 / 1024).toFixed(1)} MB）` })
    } catch (e) {
      setUpd({ phase: 'error', percent: 0, message: e instanceof Error ? e.message : '更新失败' })
    } finally {
      setBusy(false)
    }
  }

  const runInstall = async () => {
    if (!apkReady) return
    const r = await installApk(apkReady)
    setUpd(p => ({ ...p, phase: r.native ? 'installed' : p.phase, message: r.message }))
  }

  return (
    <div className="settings">
      <header className="view-head">
        <h2>设置</h2>
        <p className="view-sub">词库 · 更新 · 版本</p>
      </header>

      <section className="settings-section">
        <h3>词库</h3>
        <p className="section-hint">内置开源分级词表；可导入红宝书 JSON / CSV 覆盖。</p>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.csv,.txt"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) handleImport(f)
            e.target.value = ''
          }}
        />
        <div className="settings-actions">
          <button className="primary-btn" onClick={() => fileRef.current?.click()}>导入词库</button>
          <button className="ghost-btn" onClick={() => downloadBlob(wordsToCsv(words), '不背日语词库.csv', 'text/csv;charset=utf-8')}>导出 CSV</button>
          <button className="ghost-btn" onClick={() => downloadBlob(wordsToJson(words), '不背日语词库.json', 'application/json')}>导出 JSON</button>
          <button className="ghost-btn danger" onClick={() => { resetToStarter(); onRefresh(); setImportMsg('已恢复内置词表。') }}>恢复内置词表</button>
        </div>
        {importMsg && <p className={importOk === false ? 'msg error' : 'msg ok'}>{importMsg}</p>}
      </section>

      <section className="settings-section">
        <h3>应用更新</h3>
        <p className="section-hint">检测到新版本后下载 APK，调起系统安装覆盖旧版。</p>
        <label className="field">
          <span>更新源地址（指向 update.json 或所在目录）</span>
          <input
            className="text-input"
            value={state.updateUrl}
            onChange={e => onPatch({ updateUrl: e.target.value })}
            placeholder="https://example.com/releases"
          />
        </label>
        <div className="settings-actions">
          <button className="primary-btn" onClick={runUpdate} disabled={busy}>
            {busy ? '处理中…' : '检查更新'}
          </button>
          {apkReady && (
            <button className="correct-btn" onClick={runInstall}>立即安装</button>
          )}
        </div>
        {upd.phase !== 'idle' && (
          <div className="update-status">
            {(upd.phase === 'downloading' || upd.phase === 'verifying') && (
              <div className="update-track"><div style={{ width: `${upd.percent}%` }} /></div>
            )}
            <p className={upd.phase === 'error' ? 'msg error' : 'msg'}>{upd.message}</p>
          </div>
        )}
      </section>

      <section className="settings-section">
        <h3>关于</h3>
        <p className="about-line">不背日语 · 版本 {CURRENT_VERSION}（build {state.version}）</p>
        <p className="section-hint">自更新默认走 GitHub Releases，可在上方更改更新源地址。</p>
      </section>
    </div>
  )
}
