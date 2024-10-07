import { ref, toRaw } from 'vue'
import { isObject } from '@/utils/type'

export function useExpand (options = {}) {
  const {
    keyProp,
    onNodeExpandedChange
  } = options

  const expandLevel = ref(options.expandLevel)

  function useKeyBased () {
    const map = ref({})

    function getter (node) {
      return map.value[node[keyProp]]
    }

    function setter (node, value) {
      map.value[node[keyProp]] = value
    }

    function reset () {
      map.value = {}
    }

    return {
      getter,
      setter,
      reset
    }
  }

  function useKeyless () {
    const map = ref(new WeakMap())

    function getter (node) {
      return map.value.get(toRaw(node))
    }

    function setter (node, value) {
      map.value.set(toRaw(node), value)
    }

    function reset () {
      map.value = new WeakMap()
    }

    return {
      getter,
      setter,
      reset
    }
  }

  const {
    getter: getNodeExpanded,
    setter,
    reset
  } = keyProp ? useKeyBased() : useKeyless()

  function setNodeExpanded (node, value, manually) {
    if (manually) expandLevel.value = null

    setter(node, value)
    onNodeExpandedChange?.(node, value)

    return value
  }

  function resetExpandLevel (level) {
    expandLevel.value = level
    reset()
  }

  function expand (...nodes) {
    nodes.forEach(el => setNodeExpanded(el, true, true))
  }

  function collapse (...nodes) {
    nodes.forEach(el => setNodeExpanded(el, false, true))
  }

  function walkTo (roots, target) {
    const isTarget = !isObject(target) && keyProp
      ? source => source[keyProp] === target
      : source => toRaw(source) === toRaw(target)

    function walkDeep (nodes) {
      const path = []

      for (const node of nodes) {
        if (
          isTarget(node) ||
          (node.childNodes && path.push(...walkDeep(node.childNodes)))
        ) {
          path.unshift(node)
          break
        }
      }

      return path
    }

    return walkDeep(roots)
  }

  return {
    expandLevel,
    getNodeExpanded,
    setNodeExpanded,
    resetExpandLevel,
    walkTo,
    expand,
    collapse
  }
}
