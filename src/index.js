import FlexBox from './layout/flex-box.vue'
import FlexItem from './layout/flex-item.vue'
import HBox from './layout/flex-h-box'
import VBox from './layout/flex-v-box'
import Splitter from './layout/splitter.vue'

function install (Vue) {
  Vue.component('bue-flex-box', FlexBox)
  Vue.component('bue-flex-item', FlexItem)
  Vue.component('bue-h-box', HBox)
  Vue.component('bue-v-box', VBox)
  Vue.component('bue-splitter', Splitter)
}

if (window.Vue) install(window.Vue)

export {
  install,
  FlexBox,
  FlexItem,
  Splitter,
  HBox,
  VBox
}
