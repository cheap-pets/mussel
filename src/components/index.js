import Vue from 'vue'

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
import Input from './form/input.vue'
import Editor from './form/editor.vue'
import BaseEditor from './form/base-editor'
import BasePopupEditor from './form/base-popup-editor'
import ButtonEditor from './form/button-editor.vue'
import ColorEditor from './form/color-editor.vue'
import PopupEditor from './form/popup-editor.vue'
import DateEditor from './form/date-editor.vue'
import ComboBox from './form/combo-box.vue'
import Option from './form/option.js'
/* FORM */
import Form from './form/form.vue'
import FormField from './form/form-field.vue'
/* TOGGLE */
import Toggle from './form/toggle.vue'
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
/* Expander */
import Expander from './expander/expander.vue'
/* LAYER */
import BaseModal from './layer/base-modal.vue'
import BaseDialog from './layer/base-dialog.vue'
import Modal from './layer/modal.vue'
import Dialog from './layer/dialog.vue'
import DialogWrapper from './layer/dialog-wrapper.vue'
import * as MessageBox from './message'
/* CALENDAR */
import Calendar from './calendar/calendar.vue'
/* MENU */
import SidebarMenu from './menu/sidebar-menu.vue'
import MenuGroup from './menu/menu-group.vue'
import MenuItem from './menu/menu-item.vue'

// import './transform'

function install ($Vue = Vue) {
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
  Vue.component('mu-color-editor', ColorEditor)
  Vue.component('mu-date-editor', DateEditor)
  Vue.component('mu-combo-box', ComboBox)
  Vue.component('mu-option', Option)

  Vue.component('mu-form', Form)
  Vue.component('mu-form-field', FormField)

  Vue.component('mu-toggle', Toggle)

  Vue.component('mu-list-item', ListItem)
  Vue.component('mu-list-divider', ListDivider)

  Vue.component('mu-bar', Bar)

  Vue.component('mu-tabs', Tabs)
  Vue.component('mu-tabs-header', TabsHeader)
  Vue.component('mu-tab-panel', TabPanel)

  Vue.component('mu-dropdown', Dropdown)
  Vue.component('mu-dropdown-item', DropdownItem)

  Vue.component('mu-expander', Expander)

  Vue.component('mu-base-modal', BaseModal)
  Vue.component('mu-base-dialog', BaseDialog)
  Vue.component('mu-modal', Modal)
  Vue.component('mu-dialog', Dialog)
  Vue.component('mu-dialog-wrapper', DialogWrapper)

  Vue.component('mu-calendar', Calendar)

  Vue.component('mu-sidebar-menu', SidebarMenu)
  Vue.component('mu-menu-group', MenuGroup)
  Vue.component('mu-menu-item', MenuItem)
}

if (Vue) install(Vue)

const { showMessage, alert, error, confirm, warn, notify } = MessageBox

export {
  install,
  registerIcons,
  // Layout
  FlexBox,
  FlexItem,
  Splitter,
  Space,
  HBox,
  VBox,
  // Icon
  Icon,
  // Button
  Button,
  IconButton,
  CloseButton,
  ButtonGroup,
  SplitButton,
  DropdownButton,
  // Input
  Input,
  Editor,
  BaseEditor,
  BasePopupEditor,
  ButtonEditor,
  PopupEditor,
  ColorEditor,
  DateEditor,
  ComboBox,
  Option,
  // Form
  Form,
  FormField,
  // Toggle
  Toggle,
  // List
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
  // Expander
  Expander,
  // Calendar
  Calendar,
  // Modal & Window
  BaseModal,
  BaseDialog,
  Modal,
  Dialog,
  DialogWrapper,
  // message box
  showMessage,
  alert,
  confirm,
  error,
  warn,
  notify,
  // Menu
  SidebarMenu,
  MenuGroup,
  MenuItem
}
