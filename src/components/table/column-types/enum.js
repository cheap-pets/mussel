import { isObject } from '@/utils/type'
import { warnDeprecated } from '@/utils/warn'

// enum 为废弃兼容类型：显示映射与回退链统一走 mappings 语义（table/mappings.js），
// 新用法请改用 text/number/bool 列 + mappings/options
export const EnumColumn = {
  align: 'center',
  compile (column) {
    warnDeprecated({
      component: 'Table',
      deprecated: 'column type "enum"',
      alternative: 'mappings/options on text/number/bool columns'
    })

    const enumMap = Object.fromEntries(
      Object
        .entries(column.mappings || {})
        .map(([
          key,
          value
        ]) => ([
          key,
          isObject(value) ? { ...value } : { text: value }
        ]))
    )

    // 未命中回退链与 mappings 统一：default ?? 原值（value == null 落占位链）
    return ({ value }) => enumMap[value] ?? enumMap.default ?? { text: value }
  }
}
