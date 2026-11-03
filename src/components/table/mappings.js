import { isObject } from '@/utils/type'

export function isMappableColumnType () {
  return false
}

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

function mappingTextOf (value) {
  return isObject(value) ? value.text : value
}

export function selectOptionsFromMappings (mappings) {
  return Object
    .entries(mappings || {})
    .filter(([key]) => key !== 'default')
    .map(([value, v]) => ({ value, label: mappingTextOf(v) }))
}

function normalizeMappings (mappings) {
  const source = Array.isArray(mappings) ? mappingsFromOptions(mappings) : mappings

  if (!isObject(source)) return {}

  const map = {}

  for (const [key, value] of Object.entries(source)) {
    map[key] = isObject(value) ? value : { text: value }
  }

  return map
}

export function createDisplayMapper (column = {}) {
  const map = normalizeMappings(
    column.mappings ?? mappingsFromOptions(column.options)
  )

  if (!Object.keys(map).length) return v => ({ text: v })

  return v => v == null ? null : map[String(v)] || map.default || { text: v }
}
