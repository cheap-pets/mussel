import variables from './style-variables'

import FlexBox from './layout/flex-box.vue'
import FlexItem from './layout/flex-item.vue'
import HBox from './layout/flex-h-box'
import VBox from './layout/flex-v-box'
import Splitter from './layout/splitter.vue'

import Button from './button/button.jsx'
import ButtonGroup from './button/button-group.vue'

import Icon from './icon/index.vue'

function install (Vue) {
  Vue.component('bue-flex-box', FlexBox)
  Vue.component('bue-flex-item', FlexItem)
  Vue.component('bue-h-box', HBox)
  Vue.component('bue-v-box', VBox)
  Vue.component('bue-splitter', Splitter)

  Vue.component('bue-button', Button)
  Vue.component('bue-button-group', ButtonGroup)

  Vue.component('bue-icon', Icon)
}

if (window.Vue) install(window.Vue)

export {
  install,
  variables,
  // layout
  FlexBox,
  FlexItem,
  Splitter,
  HBox,
  VBox,
  // button
  Button,
  ButtonGroup,
  // icon
  Icon
}
