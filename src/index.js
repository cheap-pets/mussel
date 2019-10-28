/* GLOBAL STYLE */
import './global.pcss'
import './text/text.pcss'
/* LAYOUT */
import FlexBox from './layout/flex-box.vue'
import FlexItem from './layout/flex-item.vue'
import HBox from './layout/flex-h-box'
import VBox from './layout/flex-v-box'
import Space from './layout/space.vue'
import Splitter from './layout/splitter.vue'
/* ICON */
import Icon from './icon/index.vue'
import registerIcons from './icon/register'
/* BUTTON */
import Button from './button/button.jsx'
import IconButton from './button/icon-button'
import CloseButton from './button/close-button.vue'
import ButtonGroup from './button/button-group.vue'
import SplitButton from './button/split-button.vue'
import DropdownButton from './button/dropdown-button.vue'
/* INPUT */
import Input from './input/input.vue'
import Editor from './input/editor.vue'
import ButtonEditor from './input/button-editor.vue'
import PopupEditor from './input/popup-editor.vue'
import DateEditor from './input/date-editor.vue'
import ComboBox from './input/combo-box.vue'
import Option from './input/option.js'
/* FORM */
import Form from './form/form.vue'
import FormField from './form/form-field.vue'
/* LIST */
import ListItem from './list/list-item.vue'
import ListDivider from './list/list-divider.vue'
/* BAR */
import Bar from './bar/bar.vue'
/* TABS */
import Tabs from './tabs/tabs.vue'
import TabsHeader from './tabs/tabs-header.vue'
import TabPanel from './tabs/tab-panel.vue'
/* Dropdown */
import Dropdown from './dropdown/dropdown.vue'
import DropdownItem from './dropdown/dropdown-item'
/* LAYER */
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
  Vue.component('mu-space', Space)
  Vue.component('mu-splitter', Splitter)

  Vue.component('mu-icon', Icon)

  Vue.component('mu-button', Button)
  Vue.component('mu-icon-button', IconButton)
  Vue.component('mu-close-button', CloseButton)
  Vue.component('mu-button-group', ButtonGroup)
  Vue.component('mu-split-button', SplitButton)
  Vue.component('mu-dropdown-button', DropdownButton)

  Vue.component('mu-input', Input)
  Vue.component('mu-editor', Editor)
  Vue.component('mu-button-editor', ButtonEditor)
  Vue.component('mu-popup-editor', PopupEditor)
  Vue.component('mu-date-editor', DateEditor)
  Vue.component('mu-combo-box', ComboBox)
  Vue.component('mu-option', Option)

  Vue.component('mu-form', Form)
  Vue.component('mu-form-field', FormField)

  Vue.component('mu-list-item', ListItem)
  Vue.component('mu-list-divider', ListDivider)

  Vue.component('mu-bar', Bar)

  Vue.component('mu-tabs', Tabs)
  Vue.component('mu-tabs-header', TabsHeader)
  Vue.component('mu-tab-panel', TabPanel)

  Vue.component('mu-dropdown', Dropdown)
  Vue.component('mu-dropdown-item', DropdownItem)

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
  Space,
  HBox,
  VBox,
  // icon
  Icon,
  registerIcons,
  // button
  Button,
  IconButton,
  CloseButton,
  ButtonGroup,
  SplitButton,
  DropdownButton,
  // input
  Input,
  Editor,
  ButtonEditor,
  PopupEditor,
  DateEditor,
  ComboBox,
  Option,
  // form
  Form,
  FormField,
  // list
  ListItem,
  ListDivider,
  // Bar
  Bar,
  // Tabs
  Tabs,
  TabsHeader,
  TabPanel,
  // Dropdown
  Dropdown,
  DropdownItem,
  // layer
  BaseModal,
  BaseDialog,
  Modal,
  Dialog,
  DialogWrapper,
  // Calendar
  Calendar
}
