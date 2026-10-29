/** table / table-ex 列映射共享模块：text/number/bool 列 mappings/options 显示映射与编辑器下拉派生的单一事实源 */
import { isObject } from '@/utils/type'

/** 映射值 → 显示文本：对象形态取 .text，其余原样 */
function mappingTextOf (value) {
  return isObject(value) ? value.text : value
}

/** 可映射列类型：type 缺省/''/'text'/'number'/'bool'（其余字符串与对象/函数自定义类型不可映射） */
export function isMappableColumnType (type) {
  return type == null || type === '' || type === 'text' || type === 'number' || type === 'bool'
}

// mu-select options 数组 → 显示映射表（与 select.js optionLabels 同口径）：
// null/''/'-'（分隔项）与 value == null / 带 is 的对象项跳过，label 缺省取 value；
// 纯字符串项 → { [item]: item }。非数组入参返回 null
export function mappingsFromOptions (options) {
  if (!Array.isArray(options)) return null

  const map = {}

  for (const item of options) {
    if (item == null || item === '' || item === '-') continue

    if (isObject(item)) {
      if (item.value == null || item.is != null) continue

      map[String(item.value)] = item.label ?? item.value
    } else {
      map[String(item)] = item
    }
  }

  return map
}

/** mappings Object → mu-select options [{ value, label }]（value = key 字符串，排除 default） */
export function selectOptionsFromMappings (mappings) {
  return Object
    .entries(mappings || {})
    .filter(([key]) => key !== 'default')
    .map(([value, v]) => ({ value, label: mappingTextOf(v) }))
}

// 列显示映射求值器：map = column.mappings ?? mappingsFromOptions(column.options)，空映射返回 null。
// 求值：value == null → null（空值走占位链）；命中 map[String(value)] → 映射文本；
// 未命中 → map.default ?? 原值（mappings 优先级固化于此）
export function createDisplayMapper (column) {
  const map = column?.mappings ?? mappingsFromOptions(column?.options)

  if (!map || !Object.keys(map).length) return null

  return value => {
    if (value == null) return null

    const mapped = map[String(value)]

    return mapped === undefined ? (map.default ?? value) : mappingTextOf(mapped)
  }
}
