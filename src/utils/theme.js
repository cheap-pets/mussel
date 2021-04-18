import isString from 'lodash.isstring'
import { paramCase } from 'param-case'

import { hex2rgb, hsv2hex, rgb2hsv, rgb2hex } from './convert-color'

const props = [
  '--mu-primary-color',
  '--mu-primary-plus-color',
  '--mu-primary-minus-color',
  '--mu-primary-tiny-color',
  '--mu-primary-shadow-color',

  '--mu-success-color',
  '--mu-success-plus-color',
  '--mu-success-minus-color',
  '--mu-success-tiny-color',
  '--mu-success-shadow-color',

  '--mu-danger-color',
  '--mu-danger-plus-color',
  '--mu-danger-minus-color',
  '--mu-danger-tiny-color',
  '--mu-danger-shadow-color',

  '--mu-warning-color',

  '--mu-dark-background',

  '--mu-block-border-radius'
]

const hueStep = 2
const saturationStep = 16
const saturationStep2 = 5
const brightnessStep1 = 5
const brightnessStep2 = 15
const lightColorCount = 5
const darkColorCount = 4

function calcHue (hsv, i, isLight) {
  const h = Math.round(hsv.h)
  const hue = (h >= 60 && h <= 240)
    ? (isLight ? h - hueStep * i : h + hueStep * i)
    : (isLight ? h + hueStep * i : h - hueStep * i)

  return hue < 0
    ? 360 + hue
    : (hue >= 360 ? hue - 360 : hue)
}

function calcSaturation (hsv, i, isLight) {
  const saturation = (hsv.h === 0 && hsv.s === 0)
    ? hsv.s
    : Math.min(
      Math.max(
        isLight
          ? hsv.s - saturationStep * i
          : (
              i === darkColorCount
                ? hsv.s + saturationStep
                : hsv.s + saturationStep2 * i
            ),
        6
      ),
      i === isLight && lightColorCount ? 10 : 100
    )
  return Number(saturation.toFixed(0))
}

function calcValue (hsv, i, isLight) {
  const value = Math.min(
    isLight
      ? hsv.v + brightnessStep1 * i
      : hsv.v - brightnessStep2 * i,
    100
  )
  return Number(value.toFixed(0))
}

function generatePalettes ({ r, g, b }) {
  const palettes = []

  const hsv = rgb2hsv(r, g, b)

  for (let i = lightColorCount; i > 0; i--) {
    const h = calcHue(hsv, i, true)
    const s = calcSaturation(hsv, i, true)
    const v = calcValue(hsv, i, true)
    const hex = hsv2hex(h, s, v)
    palettes.push(hex)
  }

  palettes.push(rgb2hex(r, g, b))

  for (let i = 1; i <= darkColorCount; i++) {
    const h = calcHue(hsv, i)
    const s = calcSaturation(hsv, i)
    const v = calcValue(hsv, i)
    const hex = hsv2hex(h, s, v)
    palettes.push(hex)
  }

  return palettes
}

function convert2rgb (color) {
  const rgbExp = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/
  const rgb = hex2rgb(color) || rgbExp.exec(color)
  return Array.isArray(rgb)
    ? {
        r: rgb[1],
        g: rgb[2],
        b: rgb[3]
      }
    : rgb
}

function setColorVariables (option) {
  ['primary', 'success', 'danger'].forEach(key => {
    const rgb = convert2rgb(option[`--mu-${key}-color`])
    if (!rgb) return

    const palettes = generatePalettes(rgb)

    ;['plus', 'minus', 'tiny', 'shadow'].forEach(sub => {
      const prop = `--mu-${key}-${sub}-color`
      const value = option[prop]
      if (!value) {
        switch (sub) {
          case 'plus':
            option[prop] = palettes[6]
            break
          case 'minus':
            option[prop] = palettes[4]
            break
          case 'tiny':
            option[prop] = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, .1)` // palettes[1]
            break
          case 'shadow':
            option[prop] = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, .15)`
            break
        }
      }
    })

    if (key === 'primary' && !option['--mu-dark-background']) {
      option['--mu-dark-background'] = palettes[9]
    }
  })
}

export function setTheme (option = {}) {
  if (isString(option)) option = { primaryColor: option }

  const validOption = Object
    .keys(option)
    .reduce(
      (o, key) => {
        let p = paramCase(key)
        if (p.indexOf('mu') !== 0) p = '--mu-' + p
        if (props.indexOf(p) !== -1) o[p] = option[key]
        return o
      },
      {}
    )

  setColorVariables(validOption)

  Object.keys(validOption).forEach(key => {
    document.documentElement.style.setProperty(key, validOption[key])
  })
}
