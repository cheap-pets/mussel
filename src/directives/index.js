import MusselScrollbar from './scrollbar'

function installDirectives (Vue) {
  Vue.directive('mussel-scrollbar', MusselScrollbar)
}

export {
  MusselScrollbar,
  installDirectives
}
