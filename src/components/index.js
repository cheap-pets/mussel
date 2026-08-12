// import * as SvgComponents from './svg'
import * as IconComponents from './icon'
import * as LayoutComponents from './layout'
import * as FormComponents from './form'
import * as ButtonComponents from './button'
import * as CalendarComponents from './calendar'
import * as ListComponents from './list'
import * as TreeComponents from './tree'
import * as BarComponents from './bar'
import * as TabsComponents from './tabs'
import * as ModalComponents from './modal'
import * as DropdownComponents from './dropdown'
import * as MessageComponents from './message'

import MuTags from './tag/tags.vue'
import MuBadge from './badge/badge.vue'
import MuTable from './table/table.vue'
import MuScrollBox from './scrollbar/scroll-box.vue'
import MuPagination from './pagination/pagination.vue'

import { install as installScrollbarDirective } from './scrollbar/directive'

function installComponents (app, options) {
  function _install (components) {
    Object
      .entries(components)
      .forEach(([key, component]) =>
        key.startsWith('Mu') && app.component(key, component)
      )

    components.install?.(app, options)
  }

  // _install(SvgComponents)
  _install(IconComponents)
  _install(LayoutComponents)
  _install(ButtonComponents)
  _install(ListComponents)
  _install(TreeComponents)
  _install(TabsComponents)
  _install(BarComponents)
  _install(CalendarComponents)
  _install(FormComponents)
  _install(ModalComponents)
  _install(DropdownComponents)
  _install(MessageComponents)

  _install({
    MuTags,
    MuBadge,
    MuTable,
    MuScrollBox,
    MuPagination
  })
}

export function install (app, options) {
  installComponents(app, options)
  installScrollbarDirective(app)
}
