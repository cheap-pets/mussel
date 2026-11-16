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

  let active = false

  for (const key in gs.touches) {
    const touch = gs.touches[key]

    if (touch.state === 'end') continue

    active = true

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

  // 无活动触点不重挂：end/cancel 未达（序列被中断）时心跳链自终止，
  // 不再依赖下一个触摸事件来 clearHoldTimer（否则 100ms 空转永续）
  if (active) gs.holdTimer = setTimeout(updateHoldState, 100)
}

function clearGestureState (ctx) {
  gs.currentTouches = {}

  delete gs.activeElement
  delete gs.activeGesture
  delete gs.touches
  delete gs.changedTouches
  delete gs.targetTouches

  delete ctx.validRecognizers
}

function updateGestureState (event) {
  if (gs.activeElement && gs.activeElement !== this.el) {
    delete this.validRecognizers
    return
  }

  if (event.__prevent) return

  event.__prevent = true

  clearHoldTimer()

  // 系统打断：手势整体作废，清账不识别（走识别链会把取消当 end 误判 tap/press）
  if (event.type === 'touchcancel') {
    clearGestureState(this)

    return
  }

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
    clearGestureState(this)
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
  // 系统打断（来电/通知中心/手势导航）发 touchcancel 而非 touchend，
  // 不监听则触摸状态残留、心跳链失去唯一清理入口
  el.addEventListener('touchcancel', ctx.updateGestureState, options)
}

export function unbind (el, options) {
  const ctx = el[GESTURE_CONTEXT_PROP]

  el.removeEventListener('touchstart', ctx.updateGestureState, options)
  el.removeEventListener('touchmove', ctx.updateGestureState, options)
  el.removeEventListener('touchend', ctx.updateGestureState, options)
  el.removeEventListener('touchcancel', ctx.updateGestureState, options)

  // 绑定移除后 end/cancel 不再被处理，挂起的心跳链须在此终止
  // （gs 为全局单例：并发其他元素的静止长按心跳会被一并清掉，
  // 该手指下一次 move 会重挂，影响可忽略）
  clearHoldTimer()

  delete el[GESTURE_CONTEXT_PROP]
}
