import { shallowReactive } from 'vue'
import { isString, isObject } from '@/utils/type'
import { createDynamicComponent } from '@/utils/vue'
import { HIDE_DELAY } from '@/components/common/popup'

import TooltipPanel from './tooltip-panel.vue'

// 防扫过误触的显示延迟（隐藏延迟与 dropdown 共用 common/popup 的 HIDE_DELAY）
const SHOW_DELAY = 300

// 锚点事件清单：指令形态 addEventListener 与组件形态 vnode props（onMouseenter…）共用
export const ANCHOR_EVENTS = ['mouseenter', 'mouseleave', 'focusin', 'focusout', 'click']

// 热更新字段集（指令 updated diff 与组件形态 watch 依赖共用）：
// 内联对象 value 每次渲染都是新引用，且无差别 show 会清掉 pending 的延迟隐藏
export const SYNC_FIELDS = ['content', 'placement', 'trigger', 'arrow', 'disabled']

function resolveOptions (value) {
  if (isString(value)) return { content: value }
  if (isObject(value)) return value
  return {}
}

function optionsChanged (prev, next) {
  return SYNC_FIELDS.some(field => prev?.[field] !== next?.[field])
}

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
      return
    }

    // 锚点切换（visible 不变，面板 watch 不触发）：补发旧锚点 onHide 与新锚点 onShow
    const anchorChanged = state.visible && state.anchor !== anchor

    if (anchorChanged) state.onHide?.()

    Object.assign(state, { anchor, content, placement, trigger, arrow, onShow, onHide })

    ensurePanel()

    // 已显示（锚点切换 / 热更新）时字段 watch 直接重定位，不重播动画
    if (!state.visible) state.visible = true
    else if (anchorChanged) state.onShow?.()
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

  // 显示中的热更新：仅当面板正显示在该锚点上时同步字段并重定位（不重播动画）
  function sync (anchor, options) {
    if (state.anchor === anchor && state.visible) show(anchor, options)
  }

  function bindPanel (api) {
    panelApi = api
  }

  function updatePosition () {
    panelApi?.updatePosition()
  }

  const api = { state, show, hide, delayHide, toggle, sync, clearHideTimer, bindPanel, updatePosition }

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

/**
 * v-mu-tooltip 指令：value 为字符串（content）或 options 对象，
 * 绑定共享锚点事件；updated 按字段 diff 热更新。
 */
export function createTooltipDirective (controller) {
  function unbind (el) {
    const handlers = el._muTooltipHandlers

    if (handlers) {
      ANCHOR_EVENTS.forEach(name => el.removeEventListener(name, handlers[name]))
      handlers.dispose()
      el._muTooltipHandlers = undefined
    }
  }

  return {
    mounted (el, { value }) {
      const handlers = createTooltipAnchorHandlers(
        controller,
        () => el,
        () => el._muTooltipOptions
      )

      el._muTooltipOptions = resolveOptions(value)
      el._muTooltipHandlers = handlers

      ANCHOR_EVENTS.forEach(name => el.addEventListener(name, handlers[name]))
    },
    updated (el, { value }) {
      const prev = el._muTooltipOptions
      const next = resolveOptions(value)

      el._muTooltipOptions = next

      // disabled / 空 content 即时隐藏，其余字段同步且不重播动画
      if (optionsChanged(prev, next)) controller.sync(el, next)
    },
    beforeUnmount (el) {
      unbind(el)
      el._muTooltipOptions = undefined

      if (controller.state.anchor === el) controller.hide()
    }
  }
}
