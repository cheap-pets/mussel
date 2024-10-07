import { dispatchCustomEvent } from '../../custom-event'
import { GESTURE_DIRECTION as DIRECTION } from '../constant'

function check (touch, direction, options) {
  const { totalX, totalY, target } = touch
  const { distance } = options

  const x = Math.abs(totalX)
  const y = Math.abs(totalY)

  return (
    (direction === DIRECTION.HORIZONTAL && y > distance) ||
    (direction === DIRECTION.VERTICAL && x > distance) ||
    (
      String(target.tagName).toLowerCase() === 'textarea' &&
      target.scrollHeight > target.clientHeight
    )
  )
    ? false
    : ((x > distance || y > distance) || undefined)
}

const pan = {
  recognize (ctx, gs, event, direction) {
    const eventName = 'pan' + (direction || '')
    const touch = gs.changedTouches[0]

    let result
    let eventType

    if (!gs.activeGesture) {
      result = check(touch, direction, this.options)
      eventType = result && (eventName + 'start')
    } else if (touch.state === 'end') {
      result = false
      eventType = eventName + 'end'
    } else {
      eventType = eventName + 'move'
    }

    if (eventType) {
      dispatchCustomEvent(ctx.el, eventType, { detail: { gestureState: touch } })
    }

    return result
  },
  options: {
    distance: 10
  },
  eventTypes: ['panstart', 'panmove', 'panend']
}

const panx = {
  recognize: (ctx, status, event) => (
    pan.recognize(ctx, status, event, DIRECTION.HORIZONTAL)
  ),
  eventTypes: ['panxstart', 'panxmove', 'panxend']
}

const pany = {
  recognize: (ctx, status, event) => (
    pan.recognize(ctx, status, event, DIRECTION.VERTICAL)
  ),
  eventTypes: ['panystart', 'panymove', 'panyend']
}

export { pan, panx, pany }
