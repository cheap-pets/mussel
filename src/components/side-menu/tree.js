// 原树遍历工具（side-menu / menu 共用）

// 原树根到 key 所在项的路径（含目标，沿分组深入），未命中为空数组
export function walkTo (key, items) {
  for (const item of items || []) {
    if (item.id === key) return [item]

    if (item.items?.length) {
      const sub = walkTo(key, item.items)
      if (sub.length) return [item, ...sub]
    }
  }

  return []
}

export function walk (items, callback) {
  for (const item of items || []) {
    callback(item)
    walk(item.items, callback)
  }
}
