import './global.pcss'

import FlexBox from './layout/flex-box.vue'
import FlexItem from './layout/flex-item.vue'
import HBox from './layout/flex-h-box'
import VBox from './layout/flex-v-box'
import Splitter from './layout/splitter.vue'

import Icon from './icon/index.vue'

import Button from './button/button.jsx'
import IconButton from './button/icon-button'
import ButtonGroup from './button/button-group.vue'

import Input from './form/input.vue'
import InputBox from './form/input-box.vue'

function install (Vue) {
  Vue.component('mu-flex-box', FlexBox)
  Vue.component('mu-flex-item', FlexItem)
  Vue.component('mu-h-box', HBox)
  Vue.component('mu-v-box', VBox)
  Vue.component('mu-splitter', Splitter)

  Vue.component('mu-icon', Icon)

  Vue.component('mu-button', Button)
  Vue.component('mu-icon-button', IconButton)
  Vue.component('mu-button-group', ButtonGroup)

  Vue.component('mu-input', Input)
  Vue.component('mu-input-box', InputBox)
}

if (window.Vue) install(window.Vue)

export {
  install,
  // layout
  FlexBox,
  FlexItem,
  Splitter,
  HBox,
  VBox,
  // icon
  Icon,
  // button
  Button,
  IconButton,
  ButtonGroup,
  // form
  Input,
  InputBox
}
