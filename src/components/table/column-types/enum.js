import { isPlainObject } from 'es-toolkit'

export const EnumColumn = {
  align: 'center',
  compile (column) {
    const enumMap = Object.fromEntries(
      Object
        .entries(column.mappings)
        .map(([
          key,
          value
        ]) => ([
          key,
          isPlainObject(value) ? { ...value } : { text: value }
        ]))
    )

    return ({ value }) => (value in enumMap) ? enumMap[value] : enumMap.default
  }
}
