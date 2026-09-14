import { createTooltipController, createTooltipDirective } from './tooltip-core'

function install (app) {
  const controller = createTooltipController(app)

  app.config.globalProperties.$mussel.tooltip = controller
  app.directive('mu-tooltip', createTooltipDirective(controller))
}

export { default as MuDropdownPanel } from './dropdown-panel.vue'

export { default as MuDropdownItem } from './dropdown-item.vue'
export { default as MuDropdownCheckItem } from './dropdown-check-item.vue'
export { default as MuDropdownRadioItem } from './dropdown-radio-item.vue'

export { default as MuDropdown } from './dropdown.vue'
export { default as MuDropdownButton } from './dropdown-button.vue'

export { default as MuContextMenu } from './context-menu.vue'

export { default as MuTooltip } from './tooltip.vue'

export { install }
