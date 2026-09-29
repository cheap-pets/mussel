import { watch, onScopeDispose } from 'vue'

// dialog / drawer 共享的拖拽底座：数值约束 + window 监听会话管理

// min > max 时 min 胜出（与 CSS 一致；utils/math 的 clamp 会静默换序）
export function bounded (value, min, max) {
  return Math.max(min, Math.min(value, Math.max(min, max)))
}

// 拖拽会话：bind 挂 window 监听并登记为当前会话，release 摘除。
// 挂 window 而非 capture 元素：拖动中组件可能被卸载（如 dispose-on-hide + ESC 关闭），
// 元素移除后 pointer capture 失效，只有 window 监听能收到 pointerup 完成释放。
export function createDragSession (modalVisible) {
  let activeRelease = null

  // 多 pointer 并发（触摸双指、笔 + 手掌）时再次 bind 会覆盖句柄：旧会话的监听
  // 仍在 window 上、由它自己的 up/cancel 收尾，不存在泄漏；guard 保证的是先松手的
  // 旧 release 不清掉新会话句柄，隐藏/卸载兜底在任何交错时序下都能立即生效
  function bindWindowListeners (onPointerMove, onPointerUp, onRelease) {
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)

    const release = () => {
      if (activeRelease === release) activeRelease = null

      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)

      onRelease?.()
    }

    activeRelease = release
    return release
  }

  // 外部终止拖拽用（如 drawer 在 props 变更时调用）
  function releaseActive () {
    activeRelease?.()
  }

  // dispose-on-hide 隐藏时只卸载 Teleport 子树，组件实例不销毁，onScopeDispose 不触发，
  // 须 watch 隐藏兜底；否则拖拽中隐藏后 window 监听与整页 resize 光标残留
  onScopeDispose(releaseActive)
  watch(modalVisible, v => !v && releaseActive())

  return { bindWindowListeners, releaseActive }
}
