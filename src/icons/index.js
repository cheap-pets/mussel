import * as svgIcons from './svg'
import * as tablerIcons from './tabler-icons'

import { isString, isSvgString } from '@/utils/type'

const icons = {}

function install (data = {}, options) {
  options = isString(options) ? { type: options } : { ...options }

  if (!['svg', 'cls'].includes(options.type)) {
    delete options.type
  }

  Object.entries(data).forEach(([key, content]) => {
    const type = options.type || (isSvgString(content) ? 'svg' : 'cls')

    icons[key] = { type, content }
  })
}

install(svgIcons, 'svg')
install(tablerIcons, 'svg')

export { icons, install }
