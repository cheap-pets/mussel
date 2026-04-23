import { throttle } from 'throttle-debounce'

import { h } from './h'
import { SYMBOL } from './constants'
import { onTrackXMouseDown, onTrackYMouseDown } from './track-mouse-events'
import { updateTracks, updateThumbX, updateThumbY } from './update-positions'

export function attach (el) {
  if (el[SYMBOL]) return

  const ctx = el[SYMBOL] = {}

  function isScrollSizeChanged () {
    return el.scrollWidth !== ctx.scrollWidth || el.scrollHeight !== ctx.scrollHeight
  }

  function isClientSizeChanged () {
    return el.clientWidth !== ctx.clientWidth || el.clientHeight !== ctx.clientHeight
  }

  const updateTracksHF = throttle(30, updateTracks)
  const updateTracksLF = throttle(2000, updateTracks)

  const updatePosition = throttle(30, updateTracksQuickly => {
    if (!ctx.ready || ctx.hideTracksTimer) return

    if (updateTracksQuickly) {
      updateTracksHF(el, ctx)
    } else {
      updateTracksLF(el, ctx)
    }

    updateThumbX(el, ctx)
    updateThumbY(el, ctx)
  })

  const hideTracksShortly = throttle(50, () => {
    if (!ctx.ready) return
    if (ctx.hideTracksTimer) clearTimeout(ctx.hideTracksTimer)

    ctx.hideTracksTimer = setTimeout(() => {
      ctx.hideTracksTimer = null
      ctx.elements.tracks.style.display = null

      updatePosition(true)
    }, 300)

    ctx.elements.tracks.style.display = 'none'
  })

  function createMutationObserver () {
    ctx.mutationObserver = new window.MutationObserver(
      throttle(30, () => {
        if (!ctx.ready) return

        if (isScrollSizeChanged()) {
          hideTracksShortly()
        } else if (isClientSizeChanged()) {
          updatePosition(true)
        }
      })
    )

    ctx.mutationObserver.observe(el, {
      attributes: true,
      childList: true,
      subtree: true
    })
  }

  function createElements () {
    const thumbX = h('.mu-scrollbar_thumb')
    const thumbY = h('.mu-scrollbar_thumb')
    const trackX = h('.mu-scrollbar_track-x', [thumbX])
    const trackY = h('.mu-scrollbar_track-y', [thumbY])

    const existedTracks =
      el.firstChild?.classList?.contains('mu-scrollbar_tracks') &&
      el.firstChild

    const tracks = h(existedTracks || '.mu-scrollbar_tracks', [trackX, trackY])

    if (existedTracks) {
      ctx.existedTracks = true
    } else {
      el.insertBefore(tracks, el.firstChild)
    }

    trackX.addEventListener('mousedown', event => onTrackXMouseDown(event, el, ctx))
    trackY.addEventListener('mousedown', event => onTrackYMouseDown(event, el, ctx))

    el.addEventListener('scroll', () => updatePosition())
    el.addEventListener('sizechange', hideTracksShortly)
    el.addEventListener('mouseenter', () => updatePosition(true))

    el.classList.add('mu-scrollbar')

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

    el.removeEventListener('sizechange', hideTracksShortly)

    const { tracks, trackX, trackY } = ctx.elements

    if (ctx.hideTracksTimer) {
      clearTimeout(ctx.hideTracksTimer)
      ctx.hideTracksTimer = null
    }

    if (ctx.existedTracks) {
      trackX.remove()
      trackY.remove()
    } else {
      tracks.remove()
    }

    delete ctx.elements
    delete ctx.existedTracks
    delete ctx.mutationObserver
  }

  createElements()
  createMutationObserver()

  window.requestAnimationFrame(() => {
    ctx.ready ??= true
    updatePosition(true)
  })
}
