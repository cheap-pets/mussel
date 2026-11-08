/** img/icon 异步加载缓存与字形绘制 */
import { whenGlyphReady } from '@/icons'
import { centeredGlyphAnchor } from './cell-text'

// img 缓存上限（超限整体清空，同 theme.js 测量缓存策略）
const IMAGE_CACHE_LIMIT = 200

// —— img 异步加载缓存：src → { image, status: 'loading' | 'loaded' | 'failed' } ——

const imageCache = new Map()

/** 读取某 src 的缓存条目（self-check only：img 缓存行为的自检观测窗口） */
export function getImageEntry (src) {
  return (src && imageCache.get(src)) || null
}

export function requestImage (src, onLoad) {
  let entry = imageCache.get(src)

  if (!entry) {
    if (imageCache.size >= IMAGE_CACHE_LIMIT) imageCache.clear()

    const image = new Image()

    entry = { image, status: 'loading', listeners: onLoad ? [onLoad] : [] }
    imageCache.set(src, entry)

    // crossOrigin=anonymous：跨域无 CORS 头的图加载失败，避免污染画布
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      entry.status = 'loaded'
      // 加载完成一次 flush 全部监听（icon 列 N 行共用同 src 场景），painter 逐格
      // invalidate、rAF 合帧为一次整幅重绘；单 listener 场景「恰回调一次」语义不变
      const listeners = entry.listeners

      entry.listeners = []

      for (const listener of listeners) listener()
    }
    image.onerror = () => {
      entry.status = 'failed'
      entry.listeners = []
    }
    image.src = src
  } else if (entry.status === 'loading' && onLoad) {
    // 缓存命中且加载中：累积登记（同格重复登记至多多一次 invalidate，无需去重）
    entry.listeners.push(onLoad)
  }

  // 命中已 loaded / failed：不回调，调用方以 status 判定
  return entry
}

/** 编辑按钮图标加载：SVG 标记串着色后转 data URL（缓存键含着色串，主题色变自然分键），
    非 SVG 串按图片 src 直通；委托 requestImage 单一管线 */
export function requestIconImage (icon, color, onLoad) {
  const src = typeof icon === 'string' && icon.includes('<svg')
    ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(String(icon).replace(/currentColor/gi, color))
    : icon

  return requestImage(src, onLoad)
}

/** 图标字形绘制（icon 列 drawItem / button 图标 / paintCellButton 三处共用）：
    icon = 注册表项原引用（resolveIconEntry 查表产物，非注册表形态不入此函数）。
    svg 路径复用 requestIconImage 缓存管线（loaded 才 drawImage）；cls 路径直读
    注册表项（码点解析已由 icons 模块 install 时完成，本模块无解析状态机）——
    ready 才 fillText（fillStyle 直传色，无按色分键）；pending 静默不绘 +
    whenGlyphReady 登记重绘回调（解析/字体就绪后一次性回调 → invalidateCell）；
    failed 不绘不登记（install 侧已 dev warn）。统一 textAlign = 'left'，x 为
    条目起点，垂直锚 = centeredGlyphAnchor（字形墨迹实测渲染高度） */
export function drawIconGlyph (ctx, icon, { x, centerY, size, color, onLoad }) {
  if (!icon || !(size > 0)) return

  if (icon.svg) {
    const entry = requestIconImage(icon.svg, color, onLoad)

    if (entry.status === 'loaded') {
      ctx.drawImage(entry.image, Math.round(x), Math.round(centerY - size / 2), size, size)
    }

    return
  }

  if (icon.glyphStatus === 'ready') {
    ctx.font = `${size}px ${icon.fontFamily}`
    ctx.fillStyle = color
    ctx.textAlign = 'left'

    const anchor = centeredGlyphAnchor(ctx, icon.glyph, centerY)

    ctx.textBaseline = anchor.baseline
    ctx.fillText(icon.glyph, x, anchor.y)

    return
  }

  if (icon.glyphStatus === 'pending') {
    whenGlyphReady(icon, onLoad)
  }
}
