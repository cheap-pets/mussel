const GESTURE_CONTEXT_PROP = '__mussel_gesture'

const EventTypes = {
  tap: 'tap',
  press: 'press',
  panstart: 'pan',
  panmove: 'pan',
  panend: 'pan',
  panxstart: 'panx',
  panxmove: 'panx',
  panxend: 'panx',
  panystart: 'pany',
  panymove: 'pany',
  panyend: 'pany'
}

const GESTURE_DIRECTION = {
  ALL: 'all',
  HORIZONTAL: 'x',
  VERTICAL: 'y'
}

export {
  GESTURE_CONTEXT_PROP,
  GESTURE_DIRECTION,
  EventTypes
}
