// 原树遍历工具（side-menu / menu 共用）

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
