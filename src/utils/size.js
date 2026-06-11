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

export function measureTextWidths (computedStyle, texts) {
  const { font, letterSpacing, wordSpacing } = computedStyle

  const ruler = document.createElement('span')

  Object.assign(ruler.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    overflow: 'visible',
    visibility: 'hidden',
    whiteSpace: 'nowrap',
    font,
    letterSpacing,
    wordSpacing
  })

  const nodes = texts.map(text => {
    const el = document.createElement('span')

    el.textContent = text
    ruler.appendChild(el)

    return el
  })

  document.body.appendChild(ruler)

  const widths = nodes.map(node => node.getBoundingClientRect().width)

  document.body.removeChild(ruler)

  return widths
}
