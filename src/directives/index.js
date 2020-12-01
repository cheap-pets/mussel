import MusselScrollbar from './scrollbar'

function installDirectives (Vue) {
  Vue.directive('mu-scrollbar', MusselScrollbar)
}

export {
  MusselScrollbar,
  installDirectives
}
