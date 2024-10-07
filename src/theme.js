import { kebabCase } from './utils/case.js'
// import { isHtmlElement, isString } from './utils/type.js'

import {
  generatePalette,
  generateAccentPalette,
  generateNeutralPalette
} from './utils/color.js'

const COLORS = {
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
  orange: '#f76707',
  gray: null
}

const SPECIAL_COLORS = {
  primary: '#1c7ed6',
  success: '#37b24d',
  warning: '#f76707',
  danger: '#f03e3e',
  accent: null
}

function extendColors (colors) {
  const { primary, accent, neutral, ...result } = colors

  function appendColors (name, palette) {
    result[name] ||= palette[5]

    palette.forEach((color, i) => {
      result[`${name}${i}`] ||= color
    })
  }

  ;['primary', 'success', 'warning', 'danger'].forEach(key =>
    colors[key] &&
    appendColors(key, generatePalette(colors[key]))
  )

  if (accent || primary) {
    appendColors('accent', accent ? generatePalette(accent) : generateAccentPalette(primary))
  }

  if (neutral || primary) {
    appendColors('neutral', neutral ? generatePalette(neutral) : generateNeutralPalette(primary))
  }

  return result
}

export function getComputedXColor (xColor, el) {
  if (!el) return

  xColor =
    (xColor in COLORS && `var(--mu-${xColor})`) ||
    (xColor in SPECIAL_COLORS && `var(--mu-${xColor}-color)`) ||
    xColor

  const match = xColor.match(/var\((.+?)\)/)
  const prop = match && match[1]

  return prop
    ? window.getComputedStyle(el).getPropertyValue(prop)
    : xColor
}

export function install (app, options) {
  const { root, darkMode, variables = {} } = options

  root.classList.add('mu-root')

  if (darkMode) {
    root.classList.add('mu-dark')
  }

  Object
    .entries(extendColors(variables))
    .forEach(([key, value]) =>
      value &&
      root.style.setProperty(
        '--mu-' + kebabCase(
          key.replace(
            /^(gray|primary|success|warning|danger|accent)(\d*)$/,
            (match, name, num) => (name === 'gray' ? `${name}` : `${name}-color`) + (num ? `-${num}` : '')
          )
        ),
        value
      )
    )
}

export function generatePreCssVariables (incomingColors) {
  return extendColors({
    ...COLORS,
    ...SPECIAL_COLORS,
    ...incomingColors
  })
}
