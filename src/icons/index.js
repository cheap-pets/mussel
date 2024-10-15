import * as tablerIcons from './tabler-icons'
import * as customIcons from './svg'

import { isSVGString } from '@/utils/type'
import { resolveSafeHTML } from '@/utils/dom'

const icons = {}

function install (data = {}, dataType) {
  if (!['svg', 'cls'].includes(dataType)) dataType = null

  Object.entries(data).forEach(([key, value]) => {
    icons[key] =
      dataType === 'svg' || isSVGString(value)
        ? { svg: resolveSafeHTML(value) }
        : { cls: value }
  })
}

install(tablerIcons, 'svg')
install(customIcons, 'svg')

export { icons, install }
