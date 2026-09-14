import { createTooltipController, createTooltipDirective } from './tooltip-core'

function install (app) {
  const controller = createTooltipController(app)

  app.config.globalProperties.$mussel.tooltip = controller
  app.directive('mu-tooltip', createTooltipDirective(controller))
}

export { default as MuTooltip } from './tooltip.vue'
export { install }
