const registeredInterceptors = {}

// 镜像浏览器 addEventListener 去重语义的监听账本（仅 transition 形态启用）：
// WeakMap<el, Map<type, { bubble: Map<listener, entry>, capture: Map }>>，
// entry 为 { signal, onAbort } | null。账本随元素一起释放。
// 注意：{ once: true } 触发后的浏览器自动移除不经过 patched
// removeEventListener，条目会悬挂，不支持。
const ledger = new WeakMap()

function normalizeCapture (options) {
  return options !== null && typeof options === 'object' ? !!options.capture : !!options
}

function getBucket (el, type, capture) {
  let types = ledger.get(el)

  if (!types) {
    types = new Map()
    ledger.set(el, types)
  }

  let buckets = types.get(type)

  if (!buckets) {
    buckets = { bubble: new Map(), capture: new Map() }
    types.set(type, buckets)
  }

  return capture ? buckets.capture : buckets.bubble
}

function getEntryCount (el, type) {
  const buckets = ledger.get(el)?.get(type)

  return buckets
    ? buckets.bubble.size + buckets.capture.size
    : 0
}

// 是否账本托管的 transition 形态。add / remove 两侧必须用同一判据，
// 否则会出现"入账能、出账不能"：条目永久滞留，同 listener 重新 add
// 被误判为重复而不重新 activate。
function isTransition (interceptor) {
  return !!interceptor?.activate
}

// 出账并触发 deactivate 判定。账本未命中（未 add 过 / capture 不匹配）时
// 不扣账不触发，与浏览器 no-op 语义对齐。
function settleRemove (el, type, capture, listener) {
  const bucket = ledger.get(el)?.get(type)?.[capture ? 'capture' : 'bubble']
  if (!bucket?.has(listener)) return

  const entry = bucket?.get(listener)

  bucket.delete(listener)
  entry?.signal?.removeEventListener('abort', entry.onAbort)

  const types = ledger.get(el)
  const buckets = types.get(type)

  if (!buckets.bubble.size && !buckets.capture.size) {
    types.delete(type)
    if (!types.size) ledger.delete(el)
  }

  if (!getEntryCount(el, type)) registeredInterceptors[type]?.deactivate?.(el)
}

// abort 出账路径。onAbort 只持 WeakRef，避免长寿 signal 钉住元素，
// 使账本的弱引用失效。
function watchSignal (el, type, capture, listener, signal) {
  const ref = new WeakRef(el)

  const onAbort = () => {
    const target = ref.deref()

    if (target) {
      settleRemove(target, type, capture, listener)
    }
  }

  signal.addEventListener('abort', onAbort, { once: true })

  return { signal, onAbort }
}

function hack (prototype) {
  const prototypeAdd = prototype.addEventListener
  const prototypeRemove = prototype.removeEventListener

  prototype.addEventListener = function (type, listener, options) {
    const typed = registeredInterceptors[type]

    if (isTransition(typed)) {
      const capture = normalizeCapture(options)
      const bucket = getBucket(this, type, capture)

      if (!bucket.has(listener)) {
        const signal = options?.signal

        if (signal?.aborted) {
          // 浏览器对已中止 signal 的 add 是 no-op，账本同样不入
        } else {
          bucket.set(listener, signal ? watchSignal(this, type, capture, listener, signal) : null)

          if (getEntryCount(this, type) === 1) typed.activate(this)
        }
      }
    } else {
      typed?.add?.call(this, type, listener, options)
    }

    prototypeAdd.call(this, type, listener, options)
  }

  prototype.removeEventListener = function (type, listener, options) {
    const typed = registeredInterceptors[type]

    if (isTransition(typed)) {
      settleRemove(this, type, normalizeCapture(options), listener)
    } else {
      typed?.remove?.call(this, type, listener, options)
    }

    prototypeRemove.call(this, type, listener, options)
  }
}

if (typeof Element !== 'undefined') {
  hack(Element.prototype)
}

/**
 * 按事件类型注册拦截器，接管该类型的 addEventListener / removeEventListener。
 *
 * 两种形态（以是否提供 `activate` 区分，add / remove 两侧判据一致）：
 * - `{ activate, deactivate }`：镜像浏览器去重语义的账本托管，
 *   元素上该类型首个监听入账时 activate(el)、最后一个出账时 deactivate(el)。
 *   出账触发点：匹配的 remove、options.signal 中止；
 *   `{ once: true }` 的浏览器自动移除不出账（不支持）；
 *   元素卸载不触发 remove（Vue 模板监听），释放由消费方（如 resize
 *   的挂载状态清扫）兜底。缺 `deactivate` 时账本仍正确出账，只是不触发释放回调。
 * - `{ add, remove }`：每次调用原样转交（legacy，touch 手势在用）。
 */
export const EventInterceptor = {
  register (type, interceptor) {
    registeredInterceptors[type] = interceptor
  },
  // 注销只停止后续拦截：已由该类型 activate 的元素不会收到 deactivate。
  // 账本是 WeakMap，无法在此反查已入账元素，这些元素须由消费方显式
  // removeEventListener 释放，或由消费方自己的兜底机制（如 resize
  // 的挂载状态清扫）处理。
  unregister (type) {
    delete registeredInterceptors[type]
  }
}
