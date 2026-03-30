import { kebabCase } from 'change-case'
import { generatePalette, generateAccentColor, generateNeutralPalette } from './utils/color.js'

const PURPOSE_CONFIG = {
  text: {
    count: 10,
    densityFactor: 1.0,
    saturationRatio: 0.35,
    hueShift: 0
  },
  border: {
    count: 5,
    densityFactor: 1.5,
    saturationRatio: 0.2,
    hueShift: 0
  },
  bg: {
    count: 5,
    densityFactor: 1.5,
    saturationRatio: 0.15,
    hueShift: 5
  }
}

const BASE_COLORS = {
  red: '#f03e3e',
  pink: '#d6336c',
  grape: '#ae3ec9',
  violet: '#7048e8',
  indigo: '#4263eb',
  blue: '#1c7ed6',
  cyan: '#1098ad',
  teal: '#0ca678',
  green: '#37b24d',
  lime: '#74b816',
  yellow: '#f59f00',
  orange: '#f76707'
}

const SPECIAL_COLORS = {
  primary: '#1c7ed6',
  success: '#37b24d',
  warning: '#f76707',
  danger: '#f03e3e',
  secondary: generateAccentColor('#008cd6')
}

function complementColors (colors) {
  const { primary, secondary, neutral, ...result } = colors

  function appendColors (colorName, baseColor, palette) {
    palette ||= generatePalette(baseColor)

    palette.forEach((color, i) => {
      result[`${colorName}${i}`] ||= color
    })

    result[colorName] ||= baseColor
  }

  ;['primary', 'success', 'warning', 'danger'].forEach(key =>
    colors[key] && appendColors(key, colors[key])
  )

  if (secondary || (primary && secondary !== false)) {
    appendColors('secondary', secondary || generateAccentColor(primary))
  }

  if (neutral || (primary && neutral !== false)) {
    const neutralColors = generateNeutralPalette(neutral || primary, 10, 1)

    appendColors('neutral', neutral || neutralColors[5], neutralColors)

    Object.entries(PURPOSE_CONFIG).forEach(([purpose, config]) => {
      const palette = generateNeutralPalette(
        neutral || primary,
        config.count,
        config.densityFactor,
        config
      )
      // 存储为 textGray0-9 / borderGray0-4 / bgGray0-4
      palette.forEach((color, i) => {
        result[`${purpose}Gray${i}`] = color
      })
      // 中间色作为默认值
      result[`${purpose}Gray`] = palette[Math.floor(config.count / 2)]
    })
  }

  return result
}

export function setupColors (options = {}) {
  const { root = document.body, darkMode, colors = {} } = options

  if (darkMode) root.classList.add('mu-root', 'mu-dark')
  else root.classList.add('mu-root')

  Object
    .entries(complementColors(colors))
    .forEach(([key, value]) =>
      value &&
      root.style.setProperty(
        '--mu-' + kebabCase(
          key.replace(
            /^(neutral|primary|secondary|success|warning|danger)(\d*)$/,
            (match, name, num) => (name === 'neutral' ? 'gray' : `${name}-color`) + (num ? `-${num}` : '')
          )
        ),
        value
      )
    )
}

export function getComputedXColor (xColor, el) {
  if (!el) return

  xColor =
    (xColor in BASE_COLORS && `var(--mu-${xColor})`) ||
    (xColor in SPECIAL_COLORS && `var(--mu-${xColor}-color)`) ||
    xColor

  const match = xColor.match(/var\((.+?)\)/)
  const prop = match && match[1]

  return prop
    ? window.getComputedStyle(el).getPropertyValue(prop)
    : xColor
}

export function generatePreCssVariables (customColors) {
  return complementColors({ ...BASE_COLORS, ...SPECIAL_COLORS, ...customColors })
}
