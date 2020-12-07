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
import ButtonGroup from './button/button-group.vue'
import SplitButton from './button/split-button.vue'
import DropdownButton from './button/dropdown-button.vue'

/* CALENDAR */
import Calendar from './calendar/calendar.vue'

/* INPUT */
import Input from './editor/input.vue'
import Editor from './editor/editor.vue'
import BaseEditor from './editor/base-editor'
import BasePopupEditor from './editor/base-popup-editor'
import ButtonEditor from './editor/button-editor.vue'
import ColorEditor from './editor/color-editor.vue'
import PopupEditor from './editor/popup-editor.vue'
import DateEditor from './editor/date-editor.vue'
import DateRangeEditor from './editor/date-range-editor.vue'
import ComboBox from './editor/combo-box.vue'
import Option from './editor/option.js'
import SearchBox from './editor/search-box.vue'

/* TOGGLE */
import Toggle from './selection/toggle.vue'
import Radio from './selection/radio.vue'
import RadioGroup from './selection/radio-group.vue'
import Checkbox from './selection/checkbox.vue'
import CheckboxGroup from './selection/checkbox-group.vue'

/* FORM */
import Form from './form/form.vue'
import FormRow from './form/form-row.vue'
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

/* DROPDOWN */
import Dropdown from './dropdown/dropdown.vue'
import DropdownItem from './dropdown/dropdown-item'
import DropdownPanel from './dropdown/dropdown-panel.vue'

/* Expander */
import Expander from './expander/expander.vue'

/* DRAWER */
import Drawer from './drawer/drawer.vue'

/* MODAL */
import BaseModal from './modal/base-modal.vue'
import Modal from './modal/modal.vue'

/* DIALOG */
import DialogWrapper from './dialog/dialog-wrapper.vue'
import BaseDialog from './dialog/base-dialog.vue'
import Dialog from './dialog/dialog.vue'

/* MENU */
import SidebarMenu from './menu/sidebar-menu.vue'
import MenuGroup from './menu/menu-group.vue'
import MenuItem from './menu/menu-item.vue'

/* MIXINS */
import PopupGroupMixin from '@mixins/mix-popup-group'

/* MESSAGE BOX */
export * from './message'

function installComponents (Vue) {
  Vue.component('mu-flex-box', FlexBox)
  Vue.component('mu-flex-item', FlexItem)
  Vue.component('mu-h-box', HBox)
  Vue.component('mu-v-box', VBox)
  Vue.component('mu-space', Space)
  Vue.component('mu-splitter', Splitter)

  Vue.component('mu-icon', Icon)

  Vue.component('mu-button', Button)
  Vue.component('mu-icon-button', IconButton)
  Vue.component('mu-button-group', ButtonGroup)
  Vue.component('mu-split-button', SplitButton)
  Vue.component('mu-dropdown-button', DropdownButton)

  Vue.component('mu-input', Input)
  Vue.component('mu-editor', Editor)
  Vue.component('mu-button-editor', ButtonEditor)
  Vue.component('mu-popup-editor', PopupEditor)
  Vue.component('mu-color-editor', ColorEditor)
  Vue.component('mu-date-editor', DateEditor)
  Vue.component('mu-date-range-editor', DateRangeEditor)
  Vue.component('mu-combo-box', ComboBox)
  Vue.component('mu-option', Option)
  Vue.component('mu-search-box', SearchBox)
  Vue.component('mu-radio', Radio)
  Vue.component('mu-radio-group', RadioGroup)
  Vue.component('mu-checkbox', Checkbox)
  Vue.component('mu-checkbox-group', CheckboxGroup)

  Vue.component('mu-form', Form)
  Vue.component('mu-form-row', FormRow)
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
  Vue.component('mu-dropdown-panel', DropdownPanel)

  Vue.component('mu-expander', Expander)

  Vue.component('mu-base-modal', BaseModal)
  Vue.component('mu-base-dialog', BaseDialog)
  Vue.component('mu-modal', Modal)
  Vue.component('mu-dialog', Dialog)
  Vue.component('mu-dialog-wrapper', DialogWrapper)
  Vue.component('mu-drawer', Drawer)

  Vue.component('mu-calendar', Calendar)

  Vue.component('mu-sidebar-menu', SidebarMenu)
  Vue.component('mu-menu-group', MenuGroup)
  Vue.component('mu-menu-item', MenuItem)
}

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
  // register
  installComponents,
  registerIcons
}
