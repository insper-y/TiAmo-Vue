// 浏览器是否支持 WebP 编码（Safari 16 以下等不支持时自动回退 JPEG）
let webpOk = null
function canWebp() {
  if (webpOk === null) {
    try {
      const c = document.createElement('canvas')
      c.width = 1; c.height = 1
      webpOk = c.toDataURL('image/webp').indexOf('data:image/webp') === 0
    } catch (e) { webpOk = false }
  }
  return webpOk
}

// 图片压缩：canvas 降采样 + WebP/JPEG 质量压缩，慢速链路下显著减小上传体积
// 返回压缩后的 File；若压缩无收益或无法解码（如 GIF/HEIC 在部分浏览器）则原样返回
export async function compressImage(file, maxEdge = 2560, quality = 0.82) {
  try {
    if (!file || !file.type || !file.type.startsWith('image/')) return file
    if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file
    const url = URL.createObjectURL(file)
    try {
      const img = await new Promise((resolve, reject) => {
        const i = new Image()
        i.onload = () => resolve(i)
        i.onerror = reject
        i.src = url
      })
      const w0 = img.naturalWidth || img.width
      const h0 = img.naturalHeight || img.height
      if (!w0 || !h0) return file
      const scale = Math.min(1, maxEdge / Math.max(w0, h0))
      const w = Math.round(w0 * scale)
      const h = Math.round(h0 * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      // JPEG 无透明通道，先铺白底防止 PNG 透明区变黑
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
      const useWebp = canWebp()
      const blob = await new Promise(resolve => canvas.toBlob(b => resolve(b), useWebp ? 'image/webp' : 'image/jpeg', quality))
      if (!blob || blob.size >= file.size) return file
      const ext = useWebp ? 'webp' : 'jpg'
      const outName = file.name.replace(/\.[^.]+$/, '') + '.' + ext
      return new File([blob], outName, { type: useWebp ? 'image/webp' : 'image/jpeg', lastModified: file.lastModified })
    } finally {
      URL.revokeObjectURL(url)
    }
  } catch (e) {
    return file
  }
}

// IndexedDB 上传队列：文件选择后先持久化，刷新/退出页面不丢，再次进入自动续传
const DB_NAME = 'tiamo_upload_queue'
const STORE = 'pending'
let dbPromise = null

const getDB = () => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) {
          req.result.createObjectStore(STORE, { keyPath: 'qid' })
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  return dbPromise
}

const runTx = async (mode, fn) => {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    fn(t.objectStore(STORE))
    t.oncomplete = () => resolve()
    t.onerror = () => reject(t.error)
    t.onabort = () => reject(t.error)
  })
}

export const addPending = (item) => runTx('readwrite', s => s.put(item))
export const removePending = (qid) => runTx('readwrite', s => s.delete(qid))

export const listPending = async () => {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

// —— 分片并行上传：大文件切 2MB 小块、4 路并发，聚合隧道带宽；刷新后凭 qid 查进度只补差异 ——
import { chunkApi } from '../api'

// 1MB/片 + 6路并发：Cloudflare 对 >100s 的源站请求会掐断，分片需保证单请求快速完成。
// 原 512KB/4 路在百兆级文件上会产生上百次请求往返，握手与调度开销占比过高；
// 提到 1MB/6 路后请求数减半、并发提升，同时单片在弱网下仍能在数秒内传完。
const CHUNK = 2 * 1024 * 1024
const CHUNK_CONC = 8

export async function uploadInChunks(record, onProgress) {
  const blob = record.blob
  const total = Math.max(1, Math.ceil(blob.size / CHUNK))
  let have = []
  try {
    const st = await chunkApi.status(record.qid)
    have = (st && st.code === 200 && Array.isArray(st.data)) ? st.data : []
  } catch (e) { /* 查询失败则全量重传，merge 端仍有缺片校验兜底 */ }
  const haveSet = new Set(have)
  let sentBytes = have.reduce((acc, i) => acc + Math.max(0, Math.min(blob.size, (i + 1) * CHUNK) - i * CHUNK), 0)
  const report = () => { if (onProgress) onProgress(Math.min(99, Math.round(sentBytes / blob.size * 100))) }
  report()

  const putChunk = async (i) => {
    const start = i * CHUNK
    const end = Math.min(blob.size, start + CHUNK)
    for (let a = 0; a < 3; a++) {
      try {
        const fd = new FormData()
        fd.append('file', blob.slice(start, end), 'chunk')
        fd.append('qid', record.qid)
        fd.append('index', i)
        const res = await chunkApi.upload(fd)
        if (res && res.code === 200) { sentBytes += end - start; report(); return true }
      } catch (e) { /* 网络抖动重试 */ }
      await new Promise(r => setTimeout(r, 1200 * (a + 1)))
    }
    return false
}

  const queue = []
  for (let i = 0; i < total; i++) if (!haveSet.has(i)) queue.push(i)
  const failed = []
  const worker = async () => {
    while (queue.length) {
      const i = queue.shift()
      if (!(await putChunk(i))) failed.push(i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(CHUNK_CONC, queue.length || 1) }, worker))
  if (failed.length) throw new Error('chunk_failed')

  // 合并；若服务端报缺片则自动补传（最多两轮）
  let mergeRes = null
  for (let round = 0; round < 3; round++) {
    mergeRes = await chunkApi.merge({
      qid: record.qid, total, type: record.type, name: record.name,
      mimeType: blob.type || ''
    })
    const map = mergeRes && mergeRes.data
    if (map && map.success === false && Array.isArray(map.missing) && map.missing.length) {
      const miss = [...map.missing]
      const w = async () => { while (miss.length) { const i = miss.shift(); if (!(await putChunk(i))) miss.push(i) } }
      await Promise.all(Array.from({ length: Math.min(CHUNK_CONC, map.missing.length) }, w))
      continue
    }
    break
  }
  return mergeRes
}

