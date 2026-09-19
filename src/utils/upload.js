// 图片压缩：canvas 降采样 + JPEG 质量压缩，慢速链路下显著减小上传体积
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
      const blob = await new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/jpeg', quality))
      if (!blob || blob.size >= file.size) return file
      const outName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
      return new File([blob], outName, { type: 'image/jpeg', lastModified: file.lastModified })
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
