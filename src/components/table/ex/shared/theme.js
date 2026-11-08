/**
 * table-ex 主题模块：--mu-* 变量探针读取、主题快照（22 固定字段 + colors
 * 固定 17 色 map）、暗色切换感知、透明度叠加与文本测量缓存。
 * 只负责快照读取与变更信号（onChange/refresh 通知通道）；行高重估等几何
 * 消费归组件壳。
 *
 * 大量变量值是 rgb(from ...) 相对色语法，getPropertyValue() 只返回 token 串、
 * canvas 不可用；须赋给真实属性（color / height）再读计算值，才能拿到浏览器
 * 求值后的 'rgb(r, g, b)' / 'rgba(...)' 字符串。
 */

export const MEASURE_CACHE_LIMIT = 2000

const MEASURE_CACHE_SEPARATOR = '\u0000'

/** 创建隐藏探针：须可布局（visibility:hidden 而非 display:none）、不参与交互；
    挂载位置应继承 .mu-root / .mu-dark 及任何中间层变量覆盖 */
export function createProbe (host) {
  const probe = document.createElement('div')

  probe.setAttribute('aria-hidden', 'true')
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;width:0;height:0;'

  host?.appendChild(probe)

  return probe
}

/** 颜色变量：赋给 color 求值，返回 'rgb(r, g, b)' / 'rgba(...)'，canvas fillStyle 直接可用 */
export function readVar (probe, name) {
  probe.style.color = `var(${name})`
  return getComputedStyle(probe).color
}

/** 尺寸变量：赋给 height 求值，返回 px 数（变量未定义或非法时回退 0） */
export function readPx (probe, name) {
  probe.style.height = `var(${name})`
  return parseFloat(getComputedStyle(probe).height) || 0
}

/** 字体族 token：普通字符串，不走 color 求值路径，原样读取 */
export function readFont (probe, name) {
  return getComputedStyle(probe).getPropertyValue(name).trim()
}

/** 继承链字号：探针不设置 font-size，读计算值（对齐 table.scss 的 font-size: inherit） */
export function readInheritedFontSize (probe) {
  return parseFloat(getComputedStyle(probe).fontSize) || 0
}

/**
 * 内置色板固定色名：12 彩色基础 + 5 语义（色名集合对齐 components/tag/tag.scss
 * 的 mu-tag--{color} 色类体系）；gray 不入 map（gray 为绘制回退色）。
 */
const BASE_COLOR_NAMES = [
  'red', 'pink', 'grape', 'violet', 'indigo', 'blue',
  'cyan', 'teal', 'green', 'lime', 'yellow', 'orange'
]

const SEMANTIC_COLOR_NAMES = ['primary', 'secondary', 'success', 'warning', 'danger']

/**
 * 固定 17 色 map：每色 { color, translucent, hover } 三形态，一次探针批次内完成。
 * 固定全量读取（不经列准备期收集）——记录级色（tag.color、(record)=> 配置）与
 * 条目级 color 在列准备期不可见，收集式动态 map 必然漏色；colors 随任何一次
 * 快照重读一并刷新，无过期契约。
 * hover 为条目悬停浅色（复刻 .mu-link:hover）：语义色取 --mu-{name}-color-4
 * 原始串读取——不能走 readVar 的 color 求值路径：变量被自定义主题裁剪时该
 * 声明在计算值阶段失效、回退为探针继承色，无法区分「未定义」；原始串未定义
 * 为 ''，据此回退同色。12 彩色无 -4 谱系，hover 同色。
 */
function readColors (probe) {
  const colors = {}

  for (const name of BASE_COLOR_NAMES) {
    const color = readVar(probe, `--mu-${name}`)

    colors[name] = {
      color,
      translucent: readVar(probe, `--mu-${name}-translucent`),
      hover: color
    }
  }

  for (const name of SEMANTIC_COLOR_NAMES) {
    const color = readVar(probe, `--mu-${name}-color`)
    const hover = getComputedStyle(probe).getPropertyValue(`--mu-${name}-color-4`).trim()

    colors[name] = {
      color,
      translucent: readVar(probe, `--mu-${name}-translucent`),
      hover: hover || color
    }
  }

  return colors
}

/** 主题快照：一次读取全部绘制所需变量，绘制期间不重复触发 reflow 批次 */
export function readSnapshot (probe) {
  return {
    textColor: readVar(probe, '--mu-text-color-normal'),
    // 柔和文字色（--mu-text-color-soft）：格按钮默认态图标色（20261108）
    textColorSoft: readVar(probe, '--mu-text-color-soft'),
    textColorMuted: readVar(probe, '--mu-text-color-muted'),
    borderColor: readVar(probe, '--mu-border-color-normal'),
    borderColorSoft: readVar(probe, '--mu-border-color-soft'),
    borderColorStrong: readVar(probe, '--mu-border-color-strong'),
    bgNormal: readVar(probe, '--mu-bg-normal'),
    bgFill: readVar(probe, '--mu-bg-fill'),
    bgStripe: readVar(probe, '--mu-bg-stripe'),
    bgStrong: readVar(probe, '--mu-bg-strong'),
    bgDisabled: readVar(probe, '--mu-bg-disabled'),
    selectBg: readVar(probe, '--mu-primary-faint'),
    hoverBg: readVar(probe, '--mu-gray-translucent'),
    primaryColor: readVar(probe, '--mu-primary-color'),
    gray: readVar(probe, '--mu-gray'),
    fontSize: readInheritedFontSize(probe),
    fontFamily: readFont(probe, '--mu-font-sans'),
    rowHeight: readPx(probe, '--row-height'),
    headHeight: readPx(probe, '--head-row-height'),
    cellPadding: readPx(probe, '--cell-padding'),
    cellLineHeight: readPx(probe, '--cell-line-height'),
    // button pill 高度：未定义 → 0，消费侧 buttonHeightOf 回退
    controlHeightSmall: readPx(probe, '--mu-control-height-small'),
    colors: readColors(probe)
  }
}

/** 观察 .mu-root（变量作用域）与组件根本身（mu-dark 可直接挂在组件根）；
    Set 去重二者重合情形，无 .mu-root 祖先时兜底 documentElement */
export function resolveObserverRoots (componentRoot) {
  const roots = new Set()

  roots.add(componentRoot?.closest?.('.mu-root') || document.documentElement)

  if (componentRoot) roots.add(componentRoot)

  return roots
}

/** 颜色串解析：兼容 'rgb()/rgba()' 与 'color(srgb r g b / a)'（Chrome 将
    rgb(from ...) 相对色变量序列化为后者）。sRGB 分量 0-1 → 0-255（四舍五入）；
    alpha 缺省 1；解析失败返回 null */
const COLOR_PATTERNS = [
  /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/,
  /^color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)$/
]

export function parseColor (color) {
  const s = String(color).trim()
  const rgb = COLOR_PATTERNS[0].exec(s)

  if (rgb) {
    return {
      r: Number(rgb[1]),
      g: Number(rgb[2]),
      b: Number(rgb[3]),
      a: rgb[4] === undefined ? 1 : parseFloat(rgb[4])
    }
  }

  const srgb = COLOR_PATTERNS[1].exec(s)

  if (srgb) {
    return {
      r: Math.round(srgb[1] * 255),
      g: Math.round(srgb[2] * 255),
      b: Math.round(srgb[3] * 255),
      a: srgb[4] === undefined ? 1 : parseFloat(srgb[4])
    }
  }

  return null
}

/** 透明度叠加：合法颜色（rgb()/rgba()/color(srgb)）→ 'rgba(r, g, b, a)'；解析失败原样返回 */
export function withAlpha (color, alpha) {
  const c = parseColor(color)

  return c ? `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})` : color
}

/** 文本测量缓存：key = text + '\u0000' + font，超上限整体清空（不做 LRU）。
    measure(text, font) 由调用方提供（ctx.measureText 包装） */
export function createMeasureCache (measure) {
  const cache = new Map()

  return (text, font) => {
    const key = text + MEASURE_CACHE_SEPARATOR + font

    if (cache.has(key)) return cache.get(key)

    const width = measure(text, font)

    if (cache.size >= MEASURE_CACHE_LIMIT) cache.clear()
    cache.set(key, width)

    return width
  }
}

/** 文本测量工厂：离屏 canvas 2d 上下文 + createMeasureCache 缓存包装 →
    measure(text, font)。组件壳创建单例注入 row-geometry 与 painter——行高
    计算与绘制折行共用同一实例（同一缓存），折行结果单一事实源 */
export function createTextMeasurer () {
  const ctx = document.createElement('canvas').getContext('2d')

  return createMeasureCache((text, font) => {
    ctx.font = font
    return ctx.measureText(text).width
  })
}

function colorsEqual (a, b) {
  if (!a || !b) return false

  const names = Object.keys(a)

  if (names.length !== Object.keys(b).length) return false

  for (const name of names) {
    if (
      a[name]?.color !== b[name]?.color ||
      a[name]?.translucent !== b[name]?.translucent ||
      a[name]?.hover !== b[name]?.hover
    ) {
      return false
    }
  }

  return true
}

/**
 * 快照相等判定（mutation 变更抑制门控）：22 固定字段逐键严格相等 + colors
 * 每色 color/translucent/hover 严格相等。滚动状态 class 翻转等与主题无关的
 * 观察根 attribute 变更，重读快照结果不变 → 不通知 onChange，壳侧行几何
 * 不被误 rebuild（已精算行高丢失、滚动条回缩的触发源）。
 */
export function snapshotsEqual (a, b) {
  if (a === b) return true
  if (!a || !b) return false

  const keys = Object.keys(a)

  if (keys.length !== Object.keys(b).length) return false

  for (const key of keys) {
    if (key === 'colors') {
      if (!colorsEqual(a.colors, b.colors)) return false

      continue
    }

    if (a[key] !== b[key]) return false
  }

  return true
}

/**
 * 主题观察器：探针 + 快照 + MutationObserver（class/style，暗色切换感知）
 * + window resize（DPR 变化）。回调经 requestAnimationFrame 节流合帧；
 * mutation 触发的重读经快照相等门控（snapshotsEqual）。onChange(snapshot,
 * reason) 后由组件侧 relayout + 整幅重绘。refresh() 同步重读，供
 * refreshTheme() 手动兜底。
 */
export function createThemeWatcher ({ probeHost, componentRoot, onChange }) {
  const probe = createProbe(probeHost)

  let snapshot = readSnapshot(probe)
  let devicePixelRatio = window.devicePixelRatio || 1
  let scheduled = false

  const applyChange = (reason) => {
    scheduled = false

    let next = snapshot

    try {
      next = readSnapshot(probe)
    } catch {
      // 探针读取失败（如低版本浏览器不支持相对色求值）时保留上一次快照
    }

    // dpr（影响画布物理尺寸）与 manual（refreshTheme 显式兜底）不受门控抑制
    if (reason === 'mutation' && snapshotsEqual(snapshot, next)) return

    snapshot = next
    onChange?.(snapshot, reason)
  }

  const scheduleRefresh = (reason) => {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(() => applyChange(reason))
  }

  // 跨屏迁移通常伴随 window resize，而容器 CSS 尺寸可能不变（sizechange 不触发）
  const onWindowResize = () => {
    const next = window.devicePixelRatio || 1

    if (next !== devicePixelRatio) {
      devicePixelRatio = next
      scheduleRefresh('dpr')
    }
  }

  const roots = resolveObserverRoots(componentRoot)
  const observer = new MutationObserver(() => scheduleRefresh('mutation'))

  for (const el of roots) {
    observer.observe(el, { attributes: true, attributeFilter: ['class', 'style'] })
  }

  window.addEventListener('resize', onWindowResize)

  return {
    probe,
    roots,

    get snapshot () {
      return snapshot
    },

    refresh (reason = 'manual') {
      applyChange(reason)
    },

    destroy () {
      observer.disconnect()
      window.removeEventListener('resize', onWindowResize)
      probe.remove()
    }
  }
}
