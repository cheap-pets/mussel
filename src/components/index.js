import * as SvgComponents from './svg'
import * as IconComponents from './icon'
import * as LayoutComponents from './layout'
import * as ButtonComponents from './button'
import * as ListComponents from './list'
import * as TreeComponents from './tree'
import * as TabsComponents from './tabs'
import * as BarComponents from './bar'
import * as CalendarComponents from './calendar'
import * as InputComponents from './input'
import * as FormComponents from './form'
import * as ModalComponents from './modal'
import * as DropdownComponents from './dropdown'
import * as MessageComponents from './message'

import MuBadge from './badge/badge.vue'
import MuScrollBox from './scrollbar/scroll-box.vue'

import { kebabCase } from '@/utils/case'

export function install (app, options) {
  function _install (components) {
    Object
      .entries(components)
      .forEach(([key, component]) =>
        key.startsWith('Mu') && app.component(kebabCase(key), component)
      )

    components.install?.(app, options)
  }

  _install(SvgComponents)
  _install(IconComponents)
  _install(LayoutComponents)
  _install(ButtonComponents)
  _install(ListComponents)
  _install(TreeComponents)
  _install(TabsComponents)
  _install(BarComponents)
  _install(CalendarComponents)
  _install(InputComponents)
  _install(FormComponents)
  _install(ModalComponents)
  _install(DropdownComponents)
  _install(MessageComponents)

  _install({
    MuBadge,
    MuScrollBox
  })
}
