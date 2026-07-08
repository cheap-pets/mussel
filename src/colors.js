import { kebabCase } from 'change-case'
import { generatePalette, generateAccentColor, generateNeutralPalette } from './utils/color.js'

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

const SPEC_COLORS = {
  primary: '#1c7ed6',
  secondary: generateAccentColor('#008cd6'),
  success: '#37b24d',
  warning: '#f76707',
  danger: '#f03e3e'
}

const baseColorNames = Object.keys(BASE_COLORS)
const specColorNames = Object.keys(SPEC_COLORS)

function complementColors (incoming) {
  const { primary, secondary, neutral, gray, ...result } = incoming

  function addColors (colorName, baseColor, palette) {
    palette ||= generatePalette(baseColor)

    palette.forEach((color, i) => {
      result[`${colorName}${i}`] ||= color
    })

    result[colorName] ||= baseColor
  }

  ;[...specColorNames, ...baseColorNames].forEach(key =>
    incoming[key] && addColors(key, incoming[key])
  )

  const baseGray = neutral || gray || primary

  if (baseGray) {
    const options = { count: 20, densityFactor: 1.2, saturationRatio: 0.2, hueShift: 0 }
    const palette = generateNeutralPalette(baseGray, options)

    addColors('gray', palette[10], palette)
  }

  return result
}

const colors = complementColors({ ...BASE_COLORS, ...SPEC_COLORS })

function updateColors (customColors = {}) {
  const incomingColors = complementColors(customColors)

  Object.assign(colors, incomingColors)

  return incomingColors
}

function setupColors (customColors = {}, rootElement) {
  if (!Object.keys(customColors).count) return

  rootElement ||= this.rootElement || document.body
  const incomingColors = updateColors(customColors)

  Object
    .entries(incomingColors)
    .forEach(([key, value]) =>
      value &&
      rootElement.style.setProperty(
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

export {
  baseColorNames,
  specColorNames,
  colors,
  setupColors
}
