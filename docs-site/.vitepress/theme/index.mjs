import { onMounted, watchEffect } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'

import { install as installMussel } from 'mussel'

import boltIcon from '~icons/outline/bolt.svg'
import albumIcon from '~icons/outline/album.svg'
import bugIcon from '~icons/outline/bug.svg'
import dotsIcon from '~icons/outline/dots.svg'
import dotsVertIcon from '~icons/outline/dots-vertical.svg'
import flagIcon from '~icons/outline/flag.svg'
import refreshIcon from '~icons/outline/refresh.svg'
import filterIcon from '~icons/outline/filter.svg'
import editIcon from '~icons/outline/edit.svg'
import copyIcon from '~icons/outline/copy.svg'
import cutIcon from '~icons/outline/cut.svg'
import deleteIcon from '~icons/outline/trash.svg'
import lockIcon from '~icons/outline/lock.svg'
import lockOpenIcon from '~icons/outline/lock-open.svg'
import tableIcon from '~icons/outline/table.svg'
import plusIcon from '~icons/outline/plus.svg'
import settingsIcon from '~icons/outline/settings.svg'
import downloadIcon from '~icons/outline/download.svg'
import uploadIcon from '~icons/outline/upload.svg'

import './mussel.css'

// mussel 依赖浏览器 API（document/navigator），仅在客户端安装；
// SSR 阶段组件以原生标签输出，客户端挂载后接管渲染。
const icons = {
  bolt: boltIcon,
  album: albumIcon,
  bug: bugIcon,
  dots: dotsIcon,
  dotsVert: dotsVertIcon,
  flag: flagIcon,
  refresh: refreshIcon,
  filter: filterIcon,
  edit: editIcon,
  copy: copyIcon,
  cut: cutIcon,
  delete: deleteIcon,
  more: dotsIcon,
  lock: lockIcon,
  lockOpen: lockOpenIcon,
  table: tableIcon,
  plus: plusIcon,
  settings: settingsIcon,
  download: downloadIcon,
  upload: uploadIcon
}

export default {
  extends: DefaultTheme,
  enhanceApp ({ app }) {
    if (import.meta.env.SSR) return

    installMussel(app, { icons })
  },
  setup () {
    // 同步 VitePress 暗色开关到 mussel 根元素（body.mu-root）
    if (!import.meta.env.SSR) {
      const { isDark } = useData()

      onMounted(() => {
        watchEffect(() => {
          document.body.classList.toggle('mu-dark', isDark.value)
        })
      })
    }
  }
}
