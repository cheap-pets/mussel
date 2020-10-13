import Vue from 'vue'

/* LAYOUT */
import FlexBox from './layout/flex-box.vue'
import FlexItem from './layout/flex-item.vue'
import HBox from './layout/flex-h-box'
import VBox from './layout/flex-v-box'
import Space from './layout/space.vue'
import Splitter from './layout/splitter.vue'
/* ICON */
import Icon from './icon/icon.vue'
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
import DateRangeEditor from './form/date-range-editor.vue'
import ComboBox from './form/combo-box.vue'
import Option from './form/option.js'
import SearchBox from './form/search-box.vue'
import Radio from './form/radio-box.vue'
import RadioGroup from './form/radio-group.vue'
import Checkbox from './form/checkbox.vue'
import CheckboxGroup from './form/checkbox-group.vue'
/* FORM */
import Form from './form/form.vue'
import FormRow from './form/form-row.vue'
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
import DropdownPanel from './dropdown/dropdown-panel.vue'
/* Expander */
import Expander from './expander/expander.vue'
/* LAYER */
import BaseModal from './layer/base-modal.vue'
import BaseDialog from './layer/base-dialog.vue'
import Modal from './layer/modal.vue'
import Dialog from './layer/dialog.vue'
import DialogWrapper from './layer/dialog-wrapper.vue'
import * as MessageBox from './message'
/* DRAWER */
import Drawer from './drawer/drawer.vue'
/* CALENDAR */
import Calendar from './calendar/calendar.vue'
/* MENU */
import SidebarMenu from './menu/sidebar-menu.vue'
import MenuGroup from './menu/menu-group.vue'
import MenuItem from './menu/menu-item.vue'

/* MIXINS */
import PopupGroupMixin from './layer/mix-popup-group'

// import './transform'

function install ($Vue = Vue) {
  $Vue.component('mu-flex-box', FlexBox)
  $Vue.component('mu-flex-item', FlexItem)
  $Vue.component('mu-h-box', HBox)
  $Vue.component('mu-v-box', VBox)
  $Vue.component('mu-space', Space)
  $Vue.component('mu-splitter', Splitter)

  $Vue.component('mu-icon', Icon)

  $Vue.component('mu-button', Button)
  $Vue.component('mu-icon-button', IconButton)
  $Vue.component('mu-close-button', CloseButton)
  $Vue.component('mu-button-group', ButtonGroup)
  $Vue.component('mu-split-button', SplitButton)
  $Vue.component('mu-dropdown-button', DropdownButton)

  $Vue.component('mu-input', Input)
  $Vue.component('mu-editor', Editor)
  $Vue.component('mu-button-editor', ButtonEditor)
  $Vue.component('mu-popup-editor', PopupEditor)
  $Vue.component('mu-color-editor', ColorEditor)
  $Vue.component('mu-date-editor', DateEditor)
  $Vue.component('mu-date-range-editor', DateRangeEditor)
  $Vue.component('mu-combo-box', ComboBox)
  $Vue.component('mu-option', Option)
  $Vue.component('mu-search-box', SearchBox)
  $Vue.component('mu-radio', Radio)
  $Vue.component('mu-radio-group', RadioGroup)
  $Vue.component('mu-checkbox', Checkbox)
  $Vue.component('mu-checkbox-group', CheckboxGroup)

  $Vue.component('mu-form', Form)
  $Vue.component('mu-form-row', FormRow)
  $Vue.component('mu-form-field', FormField)

  $Vue.component('mu-toggle', Toggle)

  $Vue.component('mu-list-item', ListItem)
  $Vue.component('mu-list-divider', ListDivider)

  $Vue.component('mu-bar', Bar)

  $Vue.component('mu-tabs', Tabs)
  $Vue.component('mu-tabs-header', TabsHeader)
  $Vue.component('mu-tab-panel', TabPanel)

  $Vue.component('mu-dropdown', Dropdown)
  $Vue.component('mu-dropdown-item', DropdownItem)
  $Vue.component('mu-dropdown-panel', DropdownPanel)

  $Vue.component('mu-expander', Expander)

  $Vue.component('mu-base-modal', BaseModal)
  $Vue.component('mu-base-dialog', BaseDialog)
  $Vue.component('mu-modal', Modal)
  $Vue.component('mu-dialog', Dialog)
  $Vue.component('mu-dialog-wrapper', DialogWrapper)
  $Vue.component('mu-drawer', Drawer)

  $Vue.component('mu-calendar', Calendar)

  $Vue.component('mu-sidebar-menu', SidebarMenu)
  $Vue.component('mu-menu-group', MenuGroup)
  $Vue.component('mu-menu-item', MenuItem)
}

if (Vue) install(Vue)

const { showMessage, alert, error, confirm, warn, notify } = MessageBox

export {
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
  DateRangeEditor,
  ComboBox,
  Option,
  SearchBox,
  Radio,
  RadioGroup,
  Checkbox,
  CheckboxGroup,
  // Form
  Form,
  FormRow,
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
  DropdownPanel,
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
  // Drawer
  Drawer,
  // Menu
  SidebarMenu,
  MenuGroup,
  MenuItem,
  // Mixins
  PopupGroupMixin,
  // message
  showMessage,
  alert,
  confirm,
  error,
  warn,
  notify,
  // register
  install,
  registerIcons
}
