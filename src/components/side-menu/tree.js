// 原树遍历工具（side-menu / menu 共用）

import { toRaw } from 'vue'

export function walkTo (target, items) {
  for (const item of items || []) {
    if (
      toRaw(item) === toRaw(target) ||
      (item.id != null && item.id === target)
    ) return [item]

    if (item.items?.length) {
      const sub = walkTo(target, item.items)
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
