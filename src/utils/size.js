const SIZE_VALUE_PATTERN = /^(auto|((?<value>[0-9]*(\.[0-9]+)?)(?<unit>px|%)?))$/i

export function resolvePixel (value, clientSize) {
  if (value.endsWith('px')) return parseFloat(value)
  if (value.endsWith('%')) return clientSize * parseFloat(value) / 100
}

export function resolveSize (s) {
  const matched = SIZE_VALUE_PATTERN.exec(s)

  if (matched) {
    const { value = 'auto', unit } = matched.groups

    return Number(value)
      ? unit
        ? `${value}${unit}`
        : value > 1
          ? `${value}px`
          : `${value * 100}%`
      : value
  }
}

export function getPixelNumber (value) {
  if (value == null) return
  const v = String(value).match(/^(\d+(\.\d+)?)(px)?$/)?.[1]
  return v && Number(v)
}
