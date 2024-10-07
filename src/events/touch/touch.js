import { GESTURE_CONTEXT_PROP } from './constant'

// global context
const gs = { currentTouches: {} }

function clearHoldTimer () {
  if (gs.holdTimer) {
    clearTimeout(gs.holdTimer)
    delete gs.holdTimer
  }
}

function calcTouchState (event, isEnd) {
  const { identifier, target, pageX, pageY, screenX, screenY } = event
  const state = gs.currentTouches[identifier]
  const now = +new Date()

  if (!state) {
    gs.currentTouches[identifier] = {
      identifier,
      target,
      state: 'start',
      startX: screenX,
      startY: screenY,
      deltaX: 0,
      deltaY: 0,
      totalX: 0,
      totalY: 0,
      speedX: 0,
      speedY: 0,
      deltaTime: 0,
      totalTime: 0,
      startTime: now
    }
  } else {
    const { timestamp, startTime, x, y, startX, startY } = state

    const deltaX = screenX - x
    const deltaY = screenY - y
    const totalTime = now - startTime
    const deltaTime = now - timestamp

    Object.assign(
      gs.currentTouches[identifier],
      { target },
      isEnd
        ? { state: 'end' }
        : {
            state: 'hold',
            pageX,
            pageY,
            deltaX,
            deltaY,
            deltaTime,
            totalTime,
            x: screenX,
            y: screenY,
            totalX: screenX - startX,
            totalY: screenY - startY,
            speedX: deltaX / deltaTime,
            speedY: deltaY / deltaTime
          }
    )
  }

  return gs.currentTouches[identifier]
}

function updateHoldState () {
  if (gs.activeElement) return

  for (const key in gs.touches) {
    const touch = gs.touches[key]

    if (touch.state === 'end') continue

    const { timestamp, startTime } = touch
    const now = +new Date()

    Object.assign(touch, {
      state: 'hold',
      timestamp: now,
      totalTime: now - startTime,
      deltaTime: now - timestamp,
      deltaX: 0,
      deltaY: 0,
      speedX: 0,
      speedY: 0
    })
  }

  gs.holdTimer = setTimeout(updateHoldState, 100)
}

function updateGestureState (event) {
  if (gs.activeElement && gs.activeElement !== this.el) {
    delete this.validRecognizers
    return
  }

  if (event.__prevent) return

  event.__prevent = true

  clearHoldTimer()

  if (!this.validRecognizers) this.validRecognizers = { ...this.recognizers }

  const { touches = [], targetTouches = [], changedTouches = [] } = event
  const processed = {}

  gs.touches = Array.from(touches).map(touch => {
    const state = calcTouchState(touch)

    processed[state.identifier] = state

    return state
  })

  gs.changedTouches = Array.from(changedTouches).map(touch => {
    const state = processed[touch.identifier] || calcTouchState(touch, true)

    processed[state.identifier] = state

    return state
  })

  gs.targetTouches = Array
    .from(targetTouches)
    .map(touch => processed[touch.identifier])

  const recognized = this.recognize(event)
  if (touches.length === 0) {
    gs.currentTouches = {}

    delete gs.activeElement
    delete gs.activeGesture
    delete gs.touches
    delete gs.changedTouches
    delete gs.targetTouches

    delete this.validRecognizers
  } else if (!recognized) {
    gs.holdTimer = setTimeout(updateHoldState, 100)
  }
}

function recognize (event) {
  for (const type in this.validRecognizers) {
    if (gs.activeGesture && gs.activeGesture !== type) continue

    const recognized = this
      .validRecognizers[type]
      .recognize(this, gs, event)

    if (recognized === false) {
      delete this.validRecognizers[type]
    } else if (recognized === true) {
      clearHoldTimer()

      gs.activeElement = this.el
      gs.activeGesture = type

      return true
    }
  }

  if (event.cancelable && gs.activeGesture && this.el !== document) {
    event.preventDefault()
  }
}

export function bind (el, options) {
  const ctx = el[GESTURE_CONTEXT_PROP] = {
    el,
    listeners: {},
    recognizers: {}
  }

  ctx.updateGestureState = updateGestureState.bind(ctx)
  ctx.recognize = recognize.bind(ctx)

  el.addEventListener('touchstart', ctx.updateGestureState, options)
  el.addEventListener('touchmove', ctx.updateGestureState, options)
  el.addEventListener('touchend', ctx.updateGestureState, options)
}

export function unbind (el, options) {
  const ctx = el[GESTURE_CONTEXT_PROP]

  el.removeEventListener('touchstart', ctx.updateGestureState, options)
  el.removeEventListener('touchmove', ctx.updateGestureState, options)
  el.removeEventListener('touchend', ctx.updateGestureState, options)

  delete el[GESTURE_CONTEXT_PROP]
}
