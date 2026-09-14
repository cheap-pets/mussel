import { nextTick, ref, shallowRef, watch, onUnmounted, inject } from 'vue'
import { isEditableElement } from '@/utils/dom'
import { getTransitionDuration } from '@/utils/style'
import { delay } from '@/utils/timer'

// 浮层移出后的隐藏延迟（tooltip / dropdown 共用）
export const HIDE_DELAY = 300

/**
 * 浮层入场编舞（dropdown-panel / context-menu / 后续 tooltip 共用）：
 * 占位（display 恢复可测量、transform:none 消除 scaleY(0) 残留）→ patch →
 * 关动画测量定位 → patch（left/top 入 DOM，占位被整体替换）→
 * 强制回流固化 scaleY(0)+定位为过渡起点 → 恢复过渡并触发入场。
 *
 * 调用前提：调用方已在同一同步块内设置 visible = true（编舞各阶段据此做快速开关守卫）。
 */
export async function runPopupSequence ({ visible, ready, popupStyle, panelEl, updatePosition }) {
  if (!ready.value) ready.value = true

  popupStyle.value = { transform: 'none', visibility: 'hidden' }
  await nextTick()

  if (!visible.value) return

  const el = panelEl.value

  el.style.transition = 'none'
  el.removeAttribute('pop-up')

  updatePosition()
  await nextTick()

  if (!visible.value) {
    el.style.transition = null
    return
  }

  void el.offsetWidth

  el.style.transition = null
  el.setAttribute('pop-up', '')
}

/**
 * 浮层 runner（dropdown-panel / context-menu / tooltip-panel 共用）：
 * 持有壳状态（挂载 ready / 定位样式 popupStyle / Teleport 容器 container），
 * 并编排入退场——doEnter 切换 fullscreen 容器后跑 runPopupSequence，
 * doExit 等退场过渡结束后清 popupStyle（v-show 收起）。定位算法由 updatePosition 注入。
 *
 * 调用前提：doEnter 前调用方已将 visible 置 true（编舞各阶段据此做快速开关守卫），
 * doExit 前已置 false。
 */
export function usePopupRunner (visible, panelEl, updatePosition) {
  const rootEl = inject('$mussel').rootElement

  const ready = ref()
  const popupStyle = ref()
  const container = shallowRef(rootEl)

  async function doEnter () {
    container.value = document.fullscreenElement || rootEl

    await runPopupSequence({ visible, ready, popupStyle, panelEl, updatePosition })
  }

  function doExit () {
    // 首次 show 的同步窗口内面板未挂载，无 DOM 可收尾；
    // 编舞（runPopupSequence）在 nextTick 后的守卫处自然中止
    const el = panelEl.value
    if (!el) return

    const duration = getTransitionDuration(el)

    el.removeAttribute('pop-up')

    delay(duration).then(() => {
      if (!visible.value) popupStyle.value = null
    })
  }

  return { ready, popupStyle, container, doEnter, doExit }
}

/**
 * 弹层协调器（每 app 一个，由 index.js install 挂到 $mussel 上）：
 *
 * - popup 单例互斥：新弹层激活时关闭旧弹层（互斥分组为 tooltip 共存预留，从 claimPopup 扩展）；
 * - modal 数组栈：任意顺序关闭均正确；
 * - 事件惰性挂卸：首个弹层/模态激活时 attach，全部空闲时 detach，空闲期零监听；
 * - 派发目标 activePopup ?? 栈顶 modal：弹层浮于模态之上先收事件，
 *   modal 未声明的回调（resize / scroll / blur / fullscreenchange）不响应。
 */
export function createPopupCoordinator () {
  let activePopup
  let popupOwner
  let attached = false

  const modalStack = []
  const target = () => activePopup ?? modalStack[modalStack.length - 1]

  const onCaptureMouseDown = event => target()?.onCaptureMouseDown?.(event)
  const onCaptureMouseUp = event => target()?.onCaptureMouseUp?.(event)

  const onKeyDown = event => {
    if (event.key === 'Escape' && !isEditableElement(event.target)) {
      target()?.onCaptureEscKeyDown?.(event)
    }
  }
  const onCaptureWindowResize = () => target()?.onCaptureWindowResize?.()
  const onCaptureScroll = event => target()?.onCaptureScroll?.(event)
  const onCaptureWindowBlur = () => target()?.onCaptureWindowBlur?.()
  const onCaptureFullscreenChange = () => target()?.onCaptureFullscreenChange?.()

  const listeners = [
    ['mousedown', onCaptureMouseDown, true],
    ['mouseup', onCaptureMouseUp, true],
    ['keydown', onKeyDown, true],
    ['resize', onCaptureWindowResize],
    ['scroll', onCaptureScroll, true],
    ['blur', onCaptureWindowBlur],
    ['fullscreenchange', onCaptureFullscreenChange]
  ]

  function syncListeners () {
    if (typeof window === 'undefined') return

    const idle = !activePopup && !modalStack.length

    if (idle === !attached) return

    listeners.forEach(([type, handler, capture]) => {
      idle
        ? window.removeEventListener(type, handler, capture)
        : window.addEventListener(type, handler, capture)
    })

    attached = !idle
  }

  function claimPopup (instance) {
    if (activePopup !== instance) {
      activePopup?.hide?.()
      activePopup = instance
      popupOwner = modalStack[modalStack.length - 1] ?? null
    }

    syncListeners()
  }

  function releasePopup (instance) {
    if (activePopup === instance) {
      activePopup = undefined
      popupOwner = null
    }

    syncListeners()
  }

  function pushModal (instance) {
    if (!modalStack.includes(instance)) modalStack.push(instance)

    syncListeners()
  }

  function removeModal (instance) {
    // 模态关闭时连带关闭其上弹层
    if (popupOwner === instance) activePopup?.hide?.()

    const index = modalStack.indexOf(instance)

    if (index > -1) modalStack.splice(index, 1)

    syncListeners()
  }

  return {
    claimPopup,
    releasePopup,
    pushModal,
    removeModal
  }
}

export function usePopupManager (watchableVisible, options = {}) {
  const coordinator = inject('$mussel').popupCoordinator
  const instance = { ...options }

  watch(watchableVisible, v => {
    if (v) coordinator.claimPopup(instance)
    else coordinator.releasePopup(instance)
  })

  onUnmounted(() => coordinator.releasePopup(instance))
}

export function useModalManager (watchableVisible, options = {}) {
  const coordinator = inject('$mussel').popupCoordinator
  const instance = { ...options }

  watch(watchableVisible, v => {
    if (v) coordinator.pushModal(instance)
    else coordinator.removeModal(instance)
  }, { immediate: true })

  onUnmounted(() => coordinator.removeModal(instance))
}
