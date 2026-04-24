const SIZE_VALUE_PATTERN = /^(auto|((?<value>[0-9]*(\.[0-9]+)?)(?<unit>px|%)?))$/i

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
  const ruler = document.createElement('span')

  const { font, letterSpacing, wordSpacing } = computedStyle

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

  document.body.appendChild(ruler)

  const nodes = texts.map(text => {
    const node = document.createElement('span')

    node.textContent = text
    ruler.appendChild(node)

    return node
  })

  const widths = nodes.map(node => node.getBoundingClientRect().width)

  document.body.removeChild(ruler)

  return widths
}
