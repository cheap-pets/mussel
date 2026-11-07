/**
 * 拖拽误触抑制：拖拽开始 arm()；click 处理器内 consume() 返回 true 并立即解除；
 * pointerup 时 release() 延时清除——拖拽在 canvas 外释放、click 未触发时，
 * 残留 flag 经延时任务清除，不会吞掉下一次表头点击。schedule 可注入
 * （自检同步验证用），缺省 setTimeout 0（click 在 pointerup 同一任务内同步
 * 触发，先于延时任务被 consume 消费）。
 *
 * @param {Function} [options.schedule] 延时任务注入（默认 setTimeout(fn, 0)）
 * @returns {{ arm: Function, consume: Function, release: Function }}
 */
export function createClickGuard ({ schedule } = {}) {
  const defer = schedule ?? (fn => setTimeout(fn, 0))
  let armed = false

  return {
    /** 拖拽开始（pointerdown 命中手柄）时调用 */
    arm () {
      armed = true
    },
    consume () {
      const discard = armed

      armed = false

      return discard
    },
    release () {
      defer(() => {
        armed = false
      })
    }
  }
}

/**
 * rAF 合帧：同一帧内多次 schedule() 合并为一次回调（同帧多次 scroll/hover
 * 只重绘一次）；cancel 供组件卸载。raf 可注入（自检同步验证用），缺省
 * requestAnimationFrame（Node 环境退化为 setTimeout 16ms，仅为容错）。
 *
 * @param {Function} fn 帧回调
 * @param {Function} [raf] 帧调度注入
 * @returns {{ schedule: Function, cancel: Function }}
 */
export function createFrameScheduler (fn, raf) {
  const scheduleFrame = raf ??
    (typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame.bind(window)
      : callback => setTimeout(callback, 16))
  let pending = false
  let cancelled = false

  return {
    schedule () {
      if (pending || cancelled) return

      pending = true
      scheduleFrame(() => {
        pending = false

        if (!cancelled) fn()
      })
    },
    cancel () {
      cancelled = true
    }
  }
}
