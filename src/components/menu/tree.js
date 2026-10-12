// 原树遍历工具（side-menu / menu 共用）

import { toRaw } from 'vue'

// 「同一项」判定：target 为激活项对象，有 id 按 id 值匹配（跨数据刷新存活），
// 无 id 按对象引用匹配（toRaw 归一）
export function sameItem (item, target) {
  return target?.id != null
    ? item.id === target.id
    : toRaw(item) === toRaw(target)
}

export function walkTo (target, items) {
  for (const item of items || []) {
    if (sameItem(item, target)) return [item]

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
