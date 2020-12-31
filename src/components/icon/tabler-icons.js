import x from '@icons/x.svg'
import ok from '@icons/check.svg'

import expand from '@icons/square-plus.svg'
import collapse from '@icons/square-minus.svg'

import pin from '@icons/pin.svg'
import pinned from '@icons/pinned.svg'
import pinnedOff from '@icons/pinned-off.svg'

import chevronUp from '@icons/chevron-up.svg'
import chevronDown from '@icons/chevron-down.svg'
import chevronLeft from '@icons/chevron-left.svg'
import chevronRight from '@icons/chevron-right.svg'

import dots from '@icons/dots.svg'
import menu from '@icons/menu-2.svg'
import folder from '@icons/folder.svg'
import search from '@icons/search.svg'
import refresh from '@icons/refresh.svg'
import sitemap from '@icons/sitemap.svg'
import calendar from '@icons/calendar-event.svg'

import bulb from '@icons/bulb.svg'
import info from '@icons/info-circle.svg'

function removeAttributes (s) {
  const startIdx = s.indexOf('<svg')
  const endIdx = startIdx === -1 ? -1 : s.indexOf('>', startIdx)
  const ss = endIdx === -1 ? null : s.substring(startIdx, endIdx + 1)
  return ss
    ? s.replace(
        ss,
        ss
          .replace(/\swidth=".*?"/, '')
          .replace(/\sheight=".*?"/, '')
          .replace(/\sclass=".*?"/, '')
      )
    : s
}

const icons = {
  x,
  ok,

  expand,
  collapse,

  bulb,
  info,

  pin,
  pinned,
  'pinned-off': pinnedOff,

  'key-up': chevronUp,
  'key-down': chevronDown,
  'key-left': chevronLeft,
  'key-right': chevronRight,

  menu,
  search,
  folder,
  refresh,
  calendar,
  tree: sitemap,
  ellipsis: dots,
  dropdown: chevronDown
}

Object.keys(icons).forEach(key => {
  icons[key] = removeAttributes(icons[key])
})

export default icons
