import { dispatchCustomEvent } from '../../custom-event'

export const tap = {
  recognize (ctx, gs, event) {
    const touch = gs.changedTouches[0]

    const { distance, timespan } = this.options
    const { totalX, totalY, totalTime, state } = touch

    if (
      (timespan > 0 && totalTime > timespan) ||
      (Math.abs(totalX) > distance) ||
      (Math.abs(totalY) > distance)
    ) {
      return false
    } else if (state === 'end') {
      dispatchCustomEvent(ctx.el, 'tap', { canBubble: true, detail: { gestureState: touch } })
      return true
    }
  },
  options: {
    timespan: 0,
    distance: 10
  },
  eventTypes: ['tap']
}
