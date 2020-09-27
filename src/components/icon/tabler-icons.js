import x from '@icons/x.svg'
import ok from '@icons/check.svg'
import dots from '@icons/dots.svg'
import search from '@icons/search.svg'
import refresh from '@icons/refresh.svg'
import circleX from '@icons/circle-x.svg'
import clipboard from '@icons/clipboard.svg'
import calendar from '@icons/calendar-event.svg'

import chevronUp from '@icons/chevron-up.svg'
import chevronDown from '@icons/chevron-down.svg'
import chevronLeft from '@icons/chevron-left.svg'
import chevronRight from '@icons/chevron-right.svg'

import expand from '@icons/folder-plus.svg'
import collapse from '@icons/folder-minus.svg'

const SVG_ROOT = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">'

function replaceSvgNode (s) {
  const startIdx = s.indexOf('<svg')
  const endIdx = startIdx === -1 ? -1 : s.indexOf('>', startIdx)
  const ss = endIdx === -1 ? null : s.substring(startIdx, endIdx + 1)
  console.log(ss)
  return ss ? s.replace(ss, SVG_ROOT) : s
}

const icons = {
  ok,
  search,
  expand,
  refresh,
  collapse,
  calendar,
  close: x,
  ellipsis: dots,
  clear: circleX,
  empty: clipboard,
  'key-up': chevronUp,
  'key-down': chevronDown,
  'key-left': chevronLeft,
  'key-right': chevronRight
}

Object.keys(icons).forEach(key => {
  icons[key] = replaceSvgNode(icons[key])
})

export default icons
