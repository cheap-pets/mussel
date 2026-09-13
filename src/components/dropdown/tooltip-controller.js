import { shallowReactive } from 'vue'
import { createDynamicComponent } from '@/utils/vue'

import TooltipPanel from './tooltip-panel.vue'

// 防扫过误触的显示延迟 / 移出后的隐藏延迟（同 dropdown 的隐藏延迟策略）
const SHOW_DELAY = 100
const HIDE_DELAY = 300

/**
 * per-app tooltip 控制器（同 pluginNotifier 形态：install 闭包内创建，不落模块级），
 * 持有单例面板的共享状态；指令与组件形态共用。
 * state.content：String（纯文本）或返回 vnode 数组的工厂（#tooltip 插槽，每次渲染重新调用）。
 */
export function createTooltipController (app) {
  const state = shallowReactive({
    visible: false,
    anchor: null,
    content: null,
    placement: 'top',
    trigger: 'hover',
    arrow: true,
    onShow: null,
    onHide: null
  })

  let exist
  let hideTimer
  let panelApi

  function ensurePanel () {
    exist = exist || createDynamicComponent({
      container: app._container,
      appContext: app._context,
      component: TooltipPanel,
      props: { controller: api }
    })
  }

  function clearHideTimer () {
    clearTimeout(hideTimer)
    hideTimer = undefined
  }

  function show (anchor, options = {}) {
    clearHideTimer()

    const {
      content = null,
      placement = 'top',
      trigger = 'hover',
      arrow = true,
      disabled = false,
      onShow = null,
      onHide = null
    } = options

    // disabled / 空 content：隐藏不再触发；仅当显示中的就是该锚点时才 hide
    if (disabled || content == null || content === '') {
      if (state.anchor === anchor && state.visible) hide()
      return false
    }

    Object.assign(state, { anchor, content, placement, trigger, arrow, onShow, onHide })

    ensurePanel()

    // 已显示（锚点切换 / 热更新）时字段 watch 直接重定位，不重播动画
    if (!state.visible) state.visible = true

    return true
  }

  function hide () {
    clearHideTimer()
    state.visible = false
  }

  function delayHide () {
    clearHideTimer()

    // click 触发的 tooltip 只响应外点 / ESC
    if (state.trigger === 'click') return

    hideTimer = setTimeout(hide, HIDE_DELAY)
  }

  function toggle (anchor, options) {
    if (state.visible && state.anchor === anchor) hide()
    else show(anchor, options)
  }

  function bindPanel (api) {
    panelApi = api
  }

  function updatePosition () {
    panelApi?.updatePosition()
  }

  const api = { state, show, hide, delayHide, toggle, clearHideTimer, bindPanel, updatePosition }

  return api
}

/**
 * 锚点触发事件（指令与组件形态共用）：按 options.trigger 在事件时判定，
 * 支持 trigger 动态变化而无需重绑。
 */
export function createTooltipAnchorHandlers (controller, getAnchor, getOptions) {
  let showTimer

  // 指令字符串 / 省略 trigger 的对象 value 不带 trigger 字段，统一按默认 hover 判定
  function currentTrigger () {
    return getOptions()?.trigger || 'hover'
  }

  function clearShowTimer () {
    clearTimeout(showTimer)
    showTimer = undefined
  }

  function showNow () {
    clearShowTimer()
    controller.show(getAnchor(), getOptions())
  }

  function delayedShow () {
    clearShowTimer()
    showTimer = setTimeout(showNow, SHOW_DELAY)
  }

  return {
    mouseenter () {
      if (currentTrigger() === 'hover') delayedShow()
    },
    mouseleave () {
      clearShowTimer()
      if (currentTrigger() === 'hover') controller.delayHide()
    },
    focusin () {
      if (currentTrigger() === 'focus') showNow()
    },
    focusout () {
      if (currentTrigger() === 'focus') controller.delayHide()
    },
    click () {
      if (currentTrigger() === 'click') {
        clearShowTimer()
        controller.toggle(getAnchor(), getOptions())
      }
    },
    dispose: clearShowTimer
  }
}
