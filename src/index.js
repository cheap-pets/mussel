/* GLOBAL STYLE */
import './global.pcss'
import './text/text.pcss'
/* LAYOUT */
import FlexBox from './layout/flex-box.vue'
import FlexItem from './layout/flex-item.vue'
import HBox from './layout/flex-h-box'
import VBox from './layout/flex-v-box'
import Splitter from './layout/splitter.vue'
/* ICON */
import Icon from './icon/index.vue'
/* BUTTON */
import Button from './button/button.jsx'
import IconButton from './button/icon-button'
import CloseButton from './button/close-button.vue'
import ButtonGroup from './button/button-group.vue'
/* INPUT */
import Input from './input/input.vue'
import InputBox from './input/input-box.vue'
import PopupBox from './input/popup-box.vue'
import ComboBox from './input/combo-box.vue'
import Option from './input/option.js'
import DateBox from './input/date-box.vue'
/* LIST */
import ListItem from './list/list-item.vue'
import ListDivider from './list/list-divider.vue'
/* LAYER */
import './layer'
import BaseModal from './layer/base-modal.vue'
import BaseDialog from './layer/base-dialog.vue'
import Modal from './layer/modal.vue'
import Dialog from './layer/dialog.vue'
import DialogWrapper from './layer/dialog-wrapper.vue'
/* CALENDAR */
import Calendar from './calendar/calendar.vue'

// import './transform'

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
  Vue.component('mu-popup-box', PopupBox)
  Vue.component('mu-combo-box', ComboBox)
  Vue.component('mu-option', Option)
  Vue.component('mu-date-box', DateBox)

  Vue.component('mu-list-item', ListItem)
  Vue.component('mu-list-divider', ListDivider)

  Vue.component('mu-modal', Modal)
  Vue.component('mu-dialog', Dialog)
  Vue.component('mu-dialog-wrapper', DialogWrapper)

  Vue.component('mu-calendar', Calendar)
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
  // input
  Input,
  InputBox,
  PopupBox,
  ComboBox,
  Option,
  DateBox,
  // list
  ListItem,
  ListDivider,
  // layer
  BaseModal,
  BaseDialog,
  Modal,
  Dialog,
  DialogWrapper,
  // Calendar
  Calendar
}
