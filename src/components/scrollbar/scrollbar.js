import './scrollbar.scss'

import { throttle } from 'throttle-debounce'

import { h } from '@/utils/h'
import { onTrackXMouseDown, onTrackYMouseDown } from './track-mouse-events'
import { updateTracks, updateThumbX, updateThumbY } from './update-positions'

const ctxMap = new WeakMap()
const EVENT_PASSIVE_OPTION = { passive: true }

export function attach (el) {
  if (ctxMap.has(el)) return

  const ctx = {}
  ctxMap.set(el, ctx)

  // throttle 创建即登记，detach 时统一 cancel，避免新增节流器后漏清理
  ctx.throttles = []

  function createThrottle (delay, callback) {
    const instance = throttle(delay, callback)
    ctx.throttles.push(instance)
    return instance
  }

  const computedStyle = window.getComputedStyle(el)
  const position = computedStyle.getPropertyValue('position')

  el.classList.add('mu-scrollbar')

  if (!position || position === 'static') {
    ctx.positionWasSet = true
    el.style.position = 'relative'
  }

  function isScrollSizeChanged () {
    return el.scrollWidth !== ctx.scrollWidth || el.scrollHeight !== ctx.scrollHeight
  }

  function isClientSizeChanged () {
    return el.clientWidth !== ctx.clientWidth || el.clientHeight !== ctx.clientHeight
  }

  function refreshLayout () {
    if (!ctx.ready) return

    updateTracks(el, ctx)
    updateThumbX(el, ctx)
    updateThumbY(el, ctx)
  }

  // 重算轨道布局 + 拇指位置（含 getComputedStyle/clientWidth 读取，较重）。
  // sizechange / mouseenter / 容器尺寸变化走 30ms 档（即时跟手）；
  // 内容尺寸变化走 150ms 档（变化期合并追赶，结束后一次收尾，避免连续变更反复回流）。
  const refresh = createThrottle(30, refreshLayout)
  const refreshTracks = createThrottle(150, refreshLayout)

  // 滚动时只挪拇指（比例已由 updateTracks 缓存到 ctx），读 scrollLeft + 写 style，无强制回流
  function updateThumbs () {
    if (!ctx.ready) return

    updateThumbX(el, ctx)
    updateThumbY(el, ctx)
  }

  function createMutationObserver () {
    const onChange = createThrottle(30, mutations => {
      if (!ctx.ready) return

      // 滚动条自身在 thumb/track 上写的 style 不是内容变化，跳过以免回流噪音
      const { tracks } = ctx.elements

      if (tracks && mutations.every(m => tracks.contains(m.target))) return

      if (isScrollSizeChanged()) {
        refreshTracks()
      } else if (isClientSizeChanged()) {
        refresh()
      }
    })

    ctx.mutationObserver = new window.MutationObserver(onChange)
    ctx.mutationObserver.observe(el, {
      attributes: true,
      childList: true,
      subtree: true
    })
  }

  function createElements () {
    const thumbX = h('.mu-scrollbar__thumb')
    const thumbY = h('.mu-scrollbar__thumb')
    const trackX = h('.mu-scrollbar__track-x', [thumbX])
    const trackY = h('.mu-scrollbar__track-y', [thumbY])

    const existedTracks = el.querySelector(':scope > .mu-scrollbar__tracks')

    const tracks = h(existedTracks || '.mu-scrollbar__tracks', [trackX, trackY])

    if (existedTracks) {
      ctx.existedTracks = true
    } else {
      el.insertBefore(tracks, el.firstChild)
    }

    trackX.addEventListener('mousedown', event => onTrackXMouseDown(event, el, ctx))
    trackY.addEventListener('mousedown', event => onTrackYMouseDown(event, el, ctx))

    el.addEventListener('sizechange', refresh)
    el.addEventListener('mouseenter', refresh)
    el.addEventListener('scroll', updateThumbs, EVENT_PASSIVE_OPTION)

    ctx.elements = {
      tracks,
      trackX,
      trackY,
      thumbX,
      thumbY
    }
  }

  ctx.remove = function () {
    ctx.ready = false
    ctx.mutationObserver.disconnect()
    ctx.throttles.forEach(item => item.cancel())

    cancelAnimationFrame(ctx.rafId)

    el.removeEventListener('sizechange', refresh)
    el.removeEventListener('mouseenter', refresh)
    el.removeEventListener('scroll', updateThumbs, EVENT_PASSIVE_OPTION)

    const { tracks, trackX, trackY } = ctx.elements

    if (ctx.existedTracks) {
      trackX.remove()
      trackY.remove()
    } else {
      tracks.remove()
    }

    // 还原 attach 对元素本身做的修改
    el.classList.remove('mu-scrollbar')
    if (ctx.positionWasSet) el.style.position = ''

    delete ctx.elements
    delete ctx.existedTracks
    delete ctx.mutationObserver
    delete ctx.throttles
    delete ctx.positionWasSet
  }

  createElements()
  createMutationObserver()

  // 首帧初始化；若期间已被 detach（或重新 attach 产生新实例），放弃本次
  ctx.rafId = window.requestAnimationFrame(() => {
    if (ctxMap.get(el) !== ctx) return

    ctx.ready = true
    refresh()
  })
}

export function detach (el) {
  ctxMap.get(el)?.remove()
  ctxMap.delete(el)
}
