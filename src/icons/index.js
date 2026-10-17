import * as tablerIcons from './tabler-icons'

import { isObject, isString, isSVGString } from '@/utils/type'
import { generateHash } from '@/utils/crypto'
import { sanitizeHTML } from '@/utils/dom'
import { isDev } from '@/env'
import { warn } from '@/utils/warn'

const icons = {}
const hashMap = {}

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
