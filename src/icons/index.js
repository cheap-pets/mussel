import * as tablerIcons from './tabler-icons'
import * as customIcons from './svg'

import { isSVGString } from '@/utils/type'
import { generateHash } from '@/utils/crypto'
import { resolveSafeHTML } from '@/utils/dom'

const icons = {}
const hashMap = {}

function install (data = {}, dataType) {
  if (!['svg', 'cls'].includes(dataType)) dataType = null

  Object.entries(data).forEach(([key, value]) => {
    value = value.trim()

    const oldHash = icons[key]?.hash

    if (oldHash) {
      hashMap[oldHash]?.delete(key)
    }

    if (dataType === 'svg' || isSVGString(value)) {
      const hash = generateHash(value)
      const keySet = hashMap[hash]
      const oldKey = keySet && Array.from(keySet)[0]

      if (oldHash === hash) {
        console.warn(
          '[MUSSEL:ICON]',
          `Same icon named "${key}" has been installed repeatedly.`
        )
      }

      if (oldKey) {
        console.warn(
          '[MUSSEL:ICON]',
          `Icon "${key}" and icon "${oldKey}" may have the same content.`
        )

        icons[key] = icons[oldKey]
        keySet.add(key)
      } else {
        icons[key] = { svg: resolveSafeHTML(value), hash }
        hashMap[hash] = new Set([key])
      }
    } else {
      icons[key] = { cls: value }
    }
  })
}

install(tablerIcons, 'svg')
install(customIcons, 'svg')

export { icons, install }
