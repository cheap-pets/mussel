import { computed, ref } from 'vue'

// 启用 favorites 时内置「我的收藏」一级组的保留 key
export const FAVORITES_KEY = '__favorites__'

/**
 * 侧边菜单展开状态：keys 集合，受控 / 非受控二选一。
 * expandedKeys 为数组时以 props 为准（只读 + 发起 update:expanded-keys），
 * 否则用内部 Set（初始值取 defaultExpandedKeys）；accordion 展开时收拢同级已展开组。
 * walkTo / expandTo 只在 sourceData（原菜单树）上查找，收藏组为派生视图不参与。
 */
export function useSideMenuExpand ({
  data,
  sourceData,
  keyProp,
  childProp,
  expandedKeys,
  defaultExpandedKeys,
  accordion,
  onChange
}) {
  const innerKeys = ref(new Set(defaultExpandedKeys || []))

  const isControlled = computed(() => Array.isArray(expandedKeys.value))

  const keys = computed(() =>
    isControlled.value ? new Set(expandedKeys.value) : innerKeys.value
  )

  function commit (next) {
    if (isControlled.value) expandedKeys.value = [...next]
    else innerKeys.value = next
  }

  function isGroup (node) {
    return !!node?.[childProp.value]?.length
  }

  // 结构树（含收藏内置组）中按 key 取节点
  function findNode (key) {
    function walk (nodes) {
      for (const node of nodes || []) {
        if (node[keyProp.value] === key) return node

        if (isGroup(node)) {
          const found = walk(node[childProp.value])
          if (found) return found
        }
      }
      return null
    }

    return walk(data.value)
  }

  function getSiblings (key) {
    function walk (nodes) {
      for (const node of nodes || []) {
        if (node[keyProp.value] === key) return nodes

        if (isGroup(node)) {
          const found = walk(node[childProp.value])
          if (found) return found
        }
      }
      return null
    }

    return walk(data.value) || []
  }

  function isExpanded (key) {
    return keys.value.has(key)
  }

  function setExpanded (key, value) {
    if (!isGroup(findNode(key))) return
    if (keys.value.has(key) === value) return

    const next = new Set(keys.value)

    if (value) {
      if (accordion.value) {
        getSiblings(key).forEach(sibling => {
          const siblingKey = sibling[keyProp.value]

          if (siblingKey !== key && isGroup(sibling) && next.delete(siblingKey)) {
            onChange?.(siblingKey, false)
          }
        })
      }
      next.add(key)
    } else {
      next.delete(key)
    }

    commit(next)
    onChange?.(key, value)
  }

  function expand (...nodeKeys) {
    nodeKeys.forEach(key => setExpanded(key, true))
  }

  function collapse (...nodeKeys) {
    nodeKeys.forEach(key => setExpanded(key, false))
  }

  // 原树根到目标的节点路径（含目标），未命中为空数组
  function walkTo (key) {
    function walk (nodes) {
      for (const node of nodes || []) {
        if (node[keyProp.value] === key) return [node]

        if (isGroup(node)) {
          const sub = walk(node[childProp.value])
          if (sub.length) return [node, ...sub]
        }
      }
      return []
    }

    return walk(sourceData.value)
  }

  // 展开到指定项的父链（含目标自身，目标为组时一并展开）
  function expandTo (key) {
    expand(...walkTo(key).map(node => node[keyProp.value]))
  }

  // data 刷新时清理已不存在（或不再是组）的展开 key
  function prune () {
    const current = keys.value
    const next = new Set()

    current.forEach(key => {
      if (isGroup(findNode(key))) next.add(key)
    })

    if (next.size !== current.size) commit(next)
  }

  return {
    isExpanded,
    setExpanded,
    expand,
    collapse,
    expandTo,
    walkTo,
    prune
  }
}
