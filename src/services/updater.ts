import { compareVersions } from '../utils/version'
import { sha256Hex } from '../utils/sha256'

export interface UpdateManifest {
  version: string
  versionCode: number
  apkUrl: string
  sha256: string
  notes: string
}

export interface UpdateCheckResult {
  hasUpdate: boolean
  manifest?: UpdateManifest
  error?: string
}

export interface UpdateProgress {
  phase: 'idle' | 'checking' | 'downloading' | 'verifying' | 'ready' | 'error' | 'installed'
  percent: number
  message: string
}

export const CURRENT_VERSION = '0.1.0'
export const CURRENT_VERSION_CODE = 1

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
}

export async function checkUpdate(
  baseUrl: string,
  onProgress?: (p: UpdateProgress) => void,
): Promise<UpdateCheckResult> {
  const clean = baseUrl.trim().replace(/\/+$/, '')
  const manifestUrl = clean.endsWith('update.json') ? clean : `${clean}/update.json`
  onProgress?.({ phase: 'checking', percent: 0, message: '正在检查新版本…' })

  let manifest: UpdateManifest
  try {
    manifest = await fetchJson<UpdateManifest>(manifestUrl)
  } catch (e) {
    const err = e instanceof Error ? e.message : '未知错误'
    onProgress?.({ phase: 'error', percent: 0, message: `检查失败：${err}` })
    return { hasUpdate: false, error: `检查更新失败（${err}）。请检查网络或更新源地址。` }
  }

  const codeNewer = (manifest.versionCode || 0) > CURRENT_VERSION_CODE
  const semverNewer = compareVersions(manifest.version || '0', CURRENT_VERSION) > 0
  if (!codeNewer && !semverNewer) {
    onProgress?.({ phase: 'idle', percent: 100, message: '当前已是最新版本。' })
    return { hasUpdate: false }
  }

  return { hasUpdate: true, manifest }
}

export interface DownloadedApk {
  blobUrl: string
  bytes: number
}

export async function downloadApk(
  url: string,
  onProgress?: (p: UpdateProgress) => void,
): Promise<DownloadedApk> {
  onProgress?.({ phase: 'downloading', percent: 0, message: '正在下载更新包…' })
  const res = await fetch(url)
  if (!res.ok) throw new Error(`下载失败 HTTP ${res.status}`)
  const total = Number(res.headers.get('content-length') || 0)
  const reader = res.body?.getReader()
  if (!reader) {
    const blob = await res.blob()
    onProgress?.({ phase: 'downloading', percent: 100, message: '下载完成' })
    return { blobUrl: URL.createObjectURL(blob), bytes: blob.size }
  }
  const chunks: Uint8Array[] = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      chunks.push(value)
      received += value.length
      const percent = total > 0 ? Math.round((received / total) * 100) : 0
      onProgress?.({ phase: 'downloading', percent, message: `正在下载更新包… ${percent}%` })
    }
  }
  const blob = new Blob(chunks as BlobPart[], { type: 'application/vnd.android.package-archive' })
  onProgress?.({ phase: 'downloading', percent: 100, message: '下载完成' })
  return { blobUrl: URL.createObjectURL(blob), bytes: blob.size }
}

export async function verifyApk(blobUrl: string, expectedSha256: string): Promise<boolean> {
  const res = await fetch(blobUrl)
  const buffer = await res.arrayBuffer()
  const actual = await sha256Hex(buffer)
  return actual.toLowerCase() === expectedSha256.trim().toLowerCase()
}

/**
 * 调起原生安装（Web 预览时降级为提示）。
 * 原生侧从 apkUrl 重新下载并安装（blob 对象 URL 无法被原生进程读取）。
 */
export async function installApk(apkUrl: string): Promise<{ native: boolean; message: string }> {
  const w = window as unknown as { Updater?: { install: (opts: { url: string }) => Promise<{ value: boolean }> } }
  if (w.Updater?.install) {
    try {
      await w.Updater.install({ url: apkUrl })
      return { native: true, message: '已调起系统安装器，请按提示完成安装。' }
    } catch (e) {
      return { native: false, message: `调起安装失败：${e instanceof Error ? e.message : '未知错误'}` }
    }
  }
  return {
    native: false,
    message: '（Web 预览环境）已准备好更新包，打包为安卓后此步骤将调起系统安装器。',
  }
}
