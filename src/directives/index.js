import MusselScrollbar from './scrollbar'
import MusselSticky from './sticky'

function installDirectives (Vue) {
  Vue.directive('mussel-scrollbar', MusselScrollbar)
  Vue.directive('mussel-sticky', MusselSticky)
}

export {
  MusselScrollbar,
  installDirectives
}
