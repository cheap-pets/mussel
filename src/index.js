import './global.pcss'

import FlexBox from './layout/flex-box.vue'
import FlexItem from './layout/flex-item.vue'
import HBox from './layout/flex-h-box'
import VBox from './layout/flex-v-box'
import Splitter from './layout/splitter.vue'

import Icon from './icon/index.vue'

import Button from './button/button.jsx'
import IconButton from './button/icon-button'
import CloseButton from './button/close-button.vue'
import ButtonGroup from './button/button-group.vue'

import Input from './form/input.vue'
import InputBox from './form/input-box.vue'
import ComboBox from './form/combo-box.vue'
import Option from './form/option.js'

import ListItem from './list/list-item.vue'
import ListDivider from './list/list-divider.vue'

import './layer'
import BaseModal from './layer/base-modal.vue'
import BaseDialog from './layer/base-dialog.vue'
import Modal from './layer/modal.vue'
import Dialog from './layer/dialog.vue'
import DialogWrapper from './layer/dialog-wrapper.vue'

import './transform'

function install (Vue) {
  Vue.component('mu-flex-box', FlexBox)
  Vue.component('mu-flex-item', FlexItem)
  Vue.component('mu-h-box', HBox)
  Vue.component('mu-v-box', VBox)
  Vue.component('mu-splitter', Splitter)

  Vue.component('mu-icon', Icon)

  Vue.component('mu-button', Button)
  Vue.component('mu-icon-button', IconButton)
  Vue.component('mu-close-button', CloseButton)
  Vue.component('mu-button-group', ButtonGroup)

  Vue.component('mu-input', Input)
  Vue.component('mu-input-box', InputBox)
  Vue.component('mu-combo-box', ComboBox)
  Vue.component('mu-option', Option)

  Vue.component('mu-list-item', ListItem)
  Vue.component('mu-list-divider', ListDivider)

  Vue.component('mu-modal', Modal)
  Vue.component('mu-dialog', Dialog)
  Vue.component('mu-dialog-wrapper', DialogWrapper)
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
  CloseButton,
  ButtonGroup,
  // form
  Input,
  InputBox,
  ComboBox,
  Option,
  // list
  ListItem,
  ListDivider,
  // layer
  BaseModal,
  BaseDialog,
  Modal,
  Dialog,
  DialogWrapper
}
