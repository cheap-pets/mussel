import * as tablerIcons from './tabler-icons'

import { isObject, isString, isSVGString } from '@/utils/type'
import { generateHash } from '@/utils/crypto'
import { sanitizeHTML } from '@/utils/dom'
import { isDev } from '@/env'
import { warn } from '@/utils/warn'

const icons = {}
const hashMap = {}

// —— cls 形态项的码点解析（install 时同步执行，20261105-table-ex-icon-column
//    确认门裁决 K-4，取代原「表格渲染时解析」方案）——
//
// 注册表项扩展：{ cls, glyph, fontFamily, glyphStatus, animation?, hash }（svg 项
// 无 glyph 三字段）。glyph 为派生数据，不参与 solveIconHash 的 hash 计算（保持
// svg + cls + animation 口径）。

const GLYPH_PENDING = 'pending'
const GLYPH_READY = 'ready'
const GLYPH_FAILED = 'failed'

// 模块级单一隐藏容器（首次懒建、常驻）：canvas fillText 不触发 @font-face 懒加载，
// 解析元素常驻容器使字体加载被自然触发，延迟到字体就绪后统一清理
let glyphContainer = null

// glyphStatus === 'pending' 的条目（icon → name，两跳重试调度覆盖全体）
const pendingSet = new Map()
// ready 但字体未就绪的条目（document.fonts.ready 单次统一 flush，tofu 替换重绘）
const fontPendingSet = new Set()
// whenGlyphReady 登记的一次性回调队列（注册表项 → callbacks）
const readyCallbacks = new Map()

let fontFlushScheduled = false
let retryScheduled = false
let retryHopsLeft = 0

function glyphContainerOf () {
  if (glyphContainer || typeof document === 'undefined' || !document.body) {
    return glyphContainer
  }

  glyphContainer = document.createElement('div')

  glyphContainer.setAttribute('style', 'position:absolute;visibility:hidden;left:-9999px;top:-9999px')
  document.body.appendChild(glyphContainer)

  return glyphContainer
}

function clearGlyphContainer () {
  if (glyphContainer) glyphContainer.textContent = ''
}

// content 解析：去引号 + 兼容两种浏览器记载（实测确认点 1）——computed content
// 返回已解码字符（字面直用）或字面转义 "\e600"（\ + 1–6 位十六进制经
// String.fromCodePoint 逐段解码）；空串/none = 样式表未就绪，返回 ''
function decodeGlyphContent (content) {
  let text = String(content ?? '').trim()

  if (text.length >= 2) {
    const quote = text[0]

    if ((quote === '"' || quote === "'") && text.endsWith(quote)) {
      text = text.slice(1, -1)
    }
  }

  if (!text || text === 'none') return ''

  return text.includes('\\')
    ? text.replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    : text
}

// 单条目一次解析：content 有效 → ready（字体未就绪记入统一 flush 集）；无效 →
// pending 入重试集。解析元素常驻容器（每次尝试新建，供 getComputedStyle 读取）
function parseGlyphOf (icon, key) {
  const container = glyphContainerOf()

  if (!container) return

  const el = document.createElement('i')

  el.className = icon.cls
  container.appendChild(el)

  const glyph = decodeGlyphContent(getComputedStyle(el, '::before').content)

  if (glyph) {
    icon.glyph = glyph
    icon.fontFamily = getComputedStyle(el).fontFamily
    icon.glyphStatus = GLYPH_READY

    if (document.fonts && document.fonts.status !== 'loaded') {
      fontPendingSet.add(icon)
      scheduleFontFlush()
    } else {
      clearGlyphContainer()
      flushReady(icon)
    }

    return
  }

  icon.glyphStatus = GLYPH_PENDING
  pendingSet.set(icon, key)
  scheduleGlyphRetry()
}

// 两跳重试调度（模块级去重，一次调度覆盖全部 pending 条目）：① fonts.ready（样式表
// 未就绪多因 CSS 晚注入）；② 再一帧 rAF 兜底（fonts.ready 先于 icon CSS 注入就绪的
// 场景）；无 FontFaceSet 仅剩 rAF 一跳。两跳后仍失败 → failed + dev warn，不再重试
function scheduleGlyphRetry () {
  if (retryScheduled) return

  retryScheduled = true
  retryHopsLeft = document.fonts?.ready ? 2 : 1

  if (document.fonts?.ready) {
    document.fonts.ready.then(runGlyphRetry)
  } else {
    requestAnimationFrame(runGlyphRetry)
  }
}

function runGlyphRetry () {
  retryScheduled = false
  retryHopsLeft--

  for (const [icon, key] of [...pendingSet]) {
    pendingSet.delete(icon)
    parseGlyphOf(icon, key)
  }

  if (!pendingSet.size) return

  if (retryHopsLeft > 0) {
    retryScheduled = true
    requestAnimationFrame(runGlyphRetry)

    return
  }

  for (const [icon, key] of pendingSet) {
    icon.glyphStatus = GLYPH_FAILED
    readyCallbacks.delete(icon)

    warn({
      component: 'Icon',
      message:
        `Icon "${key}" (class "${icon.cls}") glyph resolve failed: ` +
        'the icon stylesheet may not contain this class.'
    })
  }

  pendingSet.clear()
}

// 字体待就绪统一 flush（模块级单次订阅）：tofu 替换重绘（flush whenGlyphReady 登记
// 回调）+ 常驻解析元素统一清理
function scheduleFontFlush () {
  if (fontFlushScheduled) return

  fontFlushScheduled = true

  document.fonts.ready.then(() => {
    fontFlushScheduled = false
    clearGlyphContainer()

    const flushed = [...fontPendingSet]

    fontPendingSet.clear()

    for (const icon of flushed) flushReady(icon)
  })
}

function flushReady (icon) {
  const queue = readyCallbacks.get(icon)

  if (!queue) return

  readyCallbacks.delete(icon)

  for (const callback of queue) callback()
}

/** 就绪回调（表格侧重绘桥）：pending 条目与字体待就绪条目（ready 但字体未加载，
 *  首绘可能 tofu）登记，解析成功或字体就绪后一次性回调并移除；已就绪（字体加载
 *  完成）/ failed / svg 形态不回调——调用方已分支处理（ready 直接绘、failed 不绘） */
export function whenGlyphReady (icon, callback) {
  if (!icon?.cls || !callback) return

  if (
    icon.glyphStatus !== GLYPH_PENDING &&
    !(icon.glyphStatus === GLYPH_READY && fontPendingSet.has(icon))
  ) {
    return
  }

  const queue = readyCallbacks.get(icon)

  if (queue) queue.push(callback)
  else readyCallbacks.set(icon, [callback])
}

// cls 项 install 入口：SSR / 无 body 直接跳过（不建容器、不挂重试、不 warn，注册项
// 保持 { cls } 原形态；客户端重新 install 时正常解析）。同名重注册且同 cls 已 ready
// → 继承 glyph 字段免重复 DOM 读取（幂等，定案 e）；cls 变化或旧项非 ready → 重新
// 走解析链（pending 重挂重试，failed 重置）
function resolveGlyphOf (key, icon) {
  if (typeof document === 'undefined' || !document.body) return

  const old = icons[key]

  if (old && old.cls === icon.cls && old.glyphStatus === GLYPH_READY) {
    icon.glyph = old.glyph
    icon.fontFamily = old.fontFamily
    icon.glyphStatus = GLYPH_READY

    if (document.fonts && document.fonts.status !== 'loaded') {
      fontPendingSet.add(icon)
      scheduleFontFlush()
    }

    return
  }

  parseGlyphOf(icon, key)
}

function install (data = {}, dataType) {
  if (!['svg', 'cls'].includes(dataType)) dataType = null

  function isValidIcon (key, icon) {
    if (icon && (icon.svg || icon.cls)) {
      return true
    } else {
      warn({
        component: 'Icon',
        message: `The option of icon "${key}" is invalid.`
      })
    }
  }

  function solveIconHash (key, icon) {
    const { svg = '', cls = '', animation = '' } = icon

    const hash = icon.hash = generateHash(svg + cls + (animation && ':' + animation))
    const old = icons[key]

    if (old) {
      if (old.hash === hash) {
        warn({
          component: 'Icon',
          message: `Icon "${key}" has been installed repeatedly with the same content.`
        })
        return
      } else {
        const oldKeys = hashMap[old.hash]

        oldKeys.delete(key)

        if (!oldKeys.size) {
          delete hashMap[old.hash]
        }
      }
    }

    const keys = hashMap[hash]
    const key0 = keys && [...keys][0]

    if (!key0) {
      hashMap[hash] = new Set([key])
    } else {
      keys.add(key)

      warn({
        component: 'Icon',
        message: `Icon "${key}" may have the same content as icon "${key0}".`
      })
    }
  }

  Object.entries(data).forEach(([key, value]) => {
    const icon = isObject(value)
      ? value
      : isString(value) && (
        dataType === 'svg' || isSVGString(value)
          ? { svg: value.trim() }
          : { cls: value.trim() }
      )

    if (isValidIcon(key, icon)) {
      if (icon.svg) icon.svg = sanitizeHTML(icon.svg)
      if (isDev) solveIconHash(key, icon)
      // cls 形态项：install 时同步码点解析（svg 项零解析开销）
      if (icon.cls) resolveGlyphOf(key, icon)

      icons[key] = icon
    }
  })
}

install(tablerIcons, 'svg')

install({
  windowClose: {
    svg: tablerIcons.X,
    animation: 'hover-rotate-180'
  },
  treeNodeExpand: {
    svg: tablerIcons.chevronRight,
    animation: 'expand-rotate-90'
  },
  dropdownExpand: {
    svg: tablerIcons.chevronDown,
    animation: 'expand-rotate--180'
  }
})

export { icons, install }
