import { createApp } from 'vue'
import { install, installIcons } from 'mussel'

import searchIcon from '~icons/outline/search.svg'
import boltIcon from '~icons/outline/bolt.svg'
import albumIcon from '~icons/outline/album.svg'
import bugIcon from '~icons/outline/bug.svg'
import dotsIcon from '~icons/outline/dots.svg'
import dotsVertIcon from '~icons/outline/dots-vertical.svg'
import flagIcon from '~icons/outline/flag.svg'

import './style.css'

installIcons({
  search: searchIcon,
  bolt: boltIcon,
  album: albumIcon,
  bug: bugIcon,
  dots: dotsIcon,
  dotsVert: dotsVertIcon,
  flag: flagIcon
})

export function createVueApp (MainView) {
  const app = createApp(MainView)

  install(app).mount('#app')
}
