import { ref } from 'vue'

// 启用 favorites 时内置「我的收藏」一级组的保留 key
export const FAVORITES_KEY = '__favorites__'

// 深于三层的菜单数据告警（模块级标志：每会话仅告警一次）
let levelWarned

export function warnDeepLevel () {
  if (levelWarned) return

  levelWarned = true
  console.warn(
    '[MUSSEL:SideMenu]',
    'Menu data deeper than 3 levels is not recommended.'
  )
}

/**
 * 侧边菜单展开状态：WeakSet 持有已展开节点数据的引用。
 * 以节点对象为键，无需回树查父；items 刷新换对象后旧展开态随引用自然失效，
 * 无需清理。WeakSet 本身无响应式，tick 变更驱动依赖 isExpanded 的视图更新。
 */
export function useSideMenuExpand () {
  const expandedNodes = new WeakSet()
  const tick = ref(0)

  function isExpanded (node) {
    void tick.value
    return expandedNodes.has(node)
  }

  function setExpanded (node, value) {
    if (!node || expandedNodes.has(node) === value) return

    if (value) expandedNodes.add(node)
    else expandedNodes.delete(node)

    tick.value++
  }

  return { isExpanded, setExpanded }
}

// 原树根到 key 所在节点的路径（含目标，沿分组深入），未命中为空数组
export function walkTo (key, nodes) {
  for (const node of nodes || []) {
    if (node.id === key) return [node]

    if (node.items?.length) {
      const sub = walkTo(key, node.items)
      if (sub.length) return [node, ...sub]
    }
  }

  return []
}

export function walk (items, level = 0, callback) {
  if (!items?.length) return

  for (const item of items) {
    if (callback(item, level) === false) {
      return false
    }

    walk(item.items, level + 1, callback)
  }
}
