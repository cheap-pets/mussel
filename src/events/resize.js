import { EventInterceptor } from './interceptor'
import { dispatchCustomEvent } from './custom-event'
import { isDev } from '../env'

const observer = typeof ResizeObserver === 'undefined'
  ? null
  : new ResizeObserver(entries => {
    // entry 对象会被浏览器复用，仅在回调内有效，消费方读取即弃、不要缓存
    entries.forEach(entry => dispatchCustomEvent(entry.target, 'sizechange', { detail: entry }))
  })

// —— 挂载状态清扫 ——
// 账本只随 add/remove 调用变化，感知不到元素卸载（Vue 卸载不移除模板
// 监听）。这里按 isConnected 兜底：曾挂载后脱离文档的元素在一个周期内
// 释放观察，重挂载自动恢复，组件侧零代码。
// state.observed 不分事件类型，隐含"sizechange 是唯一 transition 类型"
// 的假设；未来注册第二个 transition 类型时需按类型拆分。

const SWEEP_INTERVAL = 10 * 1000

const refs = new Set() // Set<WeakRef<Element>>，元素回收后 deref 失效出表
const state = new WeakMap() // el -> { observed, dormant, seenConnected, inRefs }
let timer

function activate (el) {
  let st = state.get(el)

  if (!st) {
    st = {}
    state.set(el, st)
  }

  if (st.observed) return

  st.observed = true
  st.dormant = false
  if (el.isConnected) st.seenConnected = true

  observer?.observe(el)

  if (!st.inRefs) {
    refs.add(new WeakRef(el))
    st.inRefs = true
  }

  timer ??= setInterval(sweep, SWEEP_INTERVAL)
}

function deactivate (el) {
  const st = state.get(el)

  if (st) {
    st.observed = false
    st.dormant = false
  }

  observer?.unobserve(el)
}

function sweep () {
  for (const ref of refs) {
    const el = ref.deref()
    const st = el && state.get(el)

    if (!el || !st) {
      refs.delete(ref)
    } else if (!st.observed && !st.dormant) {
      refs.delete(ref)
      st.inRefs = false
    } else if (!st.seenConnected) {
      if (el.isConnected) st.seenConnected = true
    } else if (!el.isConnected) {
      observer?.unobserve(el)
      st.observed = false
      st.dormant = true
    } else if (st.dormant) {
      observer?.observe(el)
      st.observed = true
      st.dormant = false
    }
  }

  if (!refs.size) {
    clearInterval(timer)
    timer = undefined
  }
}

EventInterceptor.register('sizechange', { activate, deactivate })

// dev 供断言：观察中的元素数（dormant / 宽限条目不计入）
if (isDev) {
  Object.defineProperty(globalThis, '__musselSizechangeObserved', {
    configurable: true,
    get () {
      let count = 0

      for (const ref of refs) {
        const el = ref.deref()
        const st = el && state.get(el)

        if (st?.observed) count++
      }

      return count
    }
  })
}
