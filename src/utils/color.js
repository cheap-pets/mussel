import { isString } from './type.js'

const RGB_MAX = 255
const HUE_MAX = 360
const SV_MAX = 100

function hex2rgb (hex) {
  const result = /^#?([a-f\d]{1,2})([a-f\d]{1,2})([a-f\d]{1,2})$/i.exec(hex)

  return result
    ? {
        r: parseInt((result[1] + result[1]).substr(0, 2), 16),
        g: parseInt((result[2] + result[2]).substr(0, 2), 16),
        b: parseInt((result[3] + result[3]).substr(0, 2), 16)
      }
    : null
}

function rgb2hex (rgb) {
  let { r, g, b } = rgb

  r = Math.round(r).toString(16)
  g = Math.round(g).toString(16)
  b = Math.round(b).toString(16)

  r = r.length === 1 ? '0' + r : r
  g = g.length === 1 ? '0' + g : g
  b = b.length === 1 ? '0' + b : b

  return '#' + r + g + b
}

export function rgb2hsv (rgb) {
  let { r, g, b } = rgb

  // convert [0,255] => [0,1]
  r = (r === RGB_MAX) ? 1 : (r % RGB_MAX / parseFloat(RGB_MAX))
  g = (g === RGB_MAX) ? 1 : (g % RGB_MAX / parseFloat(RGB_MAX))
  b = (b === RGB_MAX) ? 1 : (b % RGB_MAX / parseFloat(RGB_MAX))

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min

  const v = max
  const s = max === 0 ? 0 : d / max

  const h = max === min
    ? 0
    : (
        max === r
          ? (g - b) / d + (g < b ? 6 : 0)
          : (max === g ? (b - r) / d + 2 : (r - g) / d + 4)
      ) / 6

  return {
    h: Math.round(h * HUE_MAX),
    s: Math.round(s * SV_MAX),
    v: Math.round(v * SV_MAX)
  }
}

function hsv2rgb (hsv) {
  let { h, s, v } = hsv

  h = (h % 360 + 360) % 360 // normalize angle
  h = (h === HUE_MAX) ? 1 : (h % HUE_MAX / parseFloat(HUE_MAX) * 6)
  s = (s === SV_MAX) ? 1 : (s % SV_MAX / parseFloat(SV_MAX))
  v = (v === SV_MAX) ? 1 : (v % SV_MAX / parseFloat(SV_MAX))

  const i = Math.floor(h)
  const f = h - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  const mod = i % 6
  const r = [v, q, p, p, t, v][mod]
  const g = [t, v, v, q, p, p][mod]
  const b = [p, p, t, v, v, q][mod]

  return {
    r: Math.floor(r * RGB_MAX),
    g: Math.floor(g * RGB_MAX),
    b: Math.floor(b * RGB_MAX)
  }
}

export function hsv2hex (hsv) {
  return rgb2hex(hsv2rgb(hsv))
}

export function str2rgba (color, alpha = 1) {
  if (!isString(color)) return

  const pattern = /^(?:rgb\((?<r>\d+),\s*(?<g>\d+),\s*(?<b>\d+)\))|(?:rgba\((?<ra>\d+),\s*(?<ga>\d+),\s*(?<ba>\d+),\s*(?<a>(?:0?\.\d+)|0|1)\))$/i
  const result = pattern.exec(color)?.groups || hex2rgb(color)

  if (result) {
    let {
      r = result.ra,
      g = result.ga,
      b = result.ba,
      a = alpha
    } = result

    r = Math.max(0, Math.min(r, 255))
    g = Math.max(0, Math.min(g, 255))
    b = Math.max(0, Math.min(b, 255))
    a = Math.max(0, Math.min(a, 1))

    return { r, g, b, a }
  }
}

export function rgba2str (rgba) {
  const { r, g, b, a } = rgba

  return isNaN(a) || a < 0 || a >= 1
    ? `rgb(${r}, ${g}, ${b})`
    : `rgba(${r}, ${g}, ${b}, ${a})`
}

export function mix (color1, color2, weight = 0.5) {
  const rgba1 = str2rgba(color1)
  const rgba2 = str2rgba(color2)

  if (rgba1 && rgba2) {
    const w = 2 * weight - 1
    const a = rgba1.a - rgba2.a

    const w1 = (((w * a === -1) ? w : (w + a) / (1 + w * a)) + 1) / 2
    const w2 = 1 - w1

    return rgba2str({
      r: w1 * rgba1.r + w2 * rgba2.r,
      g: w1 * rgba1.g + w2 * rgba2.g,
      b: w1 * rgba1.b + w2 * rgba2.b,
      a: rgba1.a * weight + rgba2.a * (1 - weight)
    })
  }
}

export function setAlpha (color, alpha = 1) {
  const rgb = str2rgba(color)

  return rgb && rgba2str({ ...rgb, a: alpha })
}

export function isBright (color, threshold = 0.179) {
  const rgb = str2rgba(color)

  if (!rgb) return

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255

    return v <= 0.03928
      ? v / 12.92
      : Math.pow((v + 0.055) / 1.055, 2.4)
  })

  return (0.2126 * r + 0.7152 * g + 0.0722 * b) > threshold
}

/*
 * These functions are adapted from [@ant-design/colors],
 * available at [https://github.com/ant-design/ant-design-colors].
 */

const HUE_STEP = 2
const SATURATION_STEP_1 = 16
const SATURATION_STEP_2 = 5
const BRIGHTNESS_STEP_1 = 5
const BRIGHTNESS_STEP_2 = 15

const LIGHT_COLOR_COUNT = 5
const DARK_COLOR_COUNT = 4

function calcHue ({ h }, distance, light) {
  const hue = h >= 60 && h <= 240
    ? (light ? h - HUE_STEP * distance : h + HUE_STEP * distance)
    : (light ? h + HUE_STEP * distance : h - HUE_STEP * distance)

  return (hue + 360) % 360
}

function calcSaturation ({ h, s }, distance, light) {
  return h === 0 && s === 0
    ? s
    : Math.min(
      Math.max(
        light
          ? (s - SATURATION_STEP_1 * distance)
          : (
              distance === DARK_COLOR_COUNT
                ? s + SATURATION_STEP_1
                : s + SATURATION_STEP_2 * distance
            ),
        6
      ),
      light && distance === LIGHT_COLOR_COUNT ? 10 : 100
    )
}

function calcValue ({ v }, distance, light) {
  return Math.min(
    light
      ? v + BRIGHTNESS_STEP_1 * distance
      : v - BRIGHTNESS_STEP_2 * distance,
    100
  )
}

export function generatePalette (color) {
  const rgb = str2rgba(color)

  if (!rgb) return

  const hsv = rgb2hsv(rgb)
  const palette = []

  for (let i = 1; i <= 10; i++) {
    const light = i < 6
    const distance = light ? 6 - i : i - 6

    palette.push(
      distance
        ? hsv2hex({
          h: calcHue(hsv, distance, light),
          s: calcSaturation(hsv, distance, light),
          v: calcValue(hsv, distance, light)
        })
        : hsv2hex(hsv)
    )
  }

  return palette
}

export function generateAdjacentColors (color, distance = 1) {
  const rgb = str2rgba(color)

  if (!rgb) return

  distance = Math.min(Math.max(distance, 1), 5)

  const hsv = rgb2hsv(rgb)

  return {
    color,
    light: hsv2hex({
      h: calcHue(hsv, distance, true),
      s: calcSaturation(hsv, distance, true),
      v: calcValue(hsv, distance, true)
    }),
    dark: hsv2hex({
      h: calcHue(hsv, distance),
      s: calcSaturation(hsv, distance),
      v: calcValue(hsv, distance)
    })
  }
}

export function generateAccentColor (primaryColor) {
  const rgb = str2rgba(primaryColor)

  if (!rgb) return

  const hsv = rgb2hsv(rgb)

  return hsv2hex({
    h: (hsv.h + 123) % 360,
    s: Math.max(0, hsv.s - 10),
    v: Math.max(0, hsv.v - 11)
  })
}

export function generateAccentPalette (primaryColor) {
  return generatePalette(
    generateAccentColor(primaryColor)
  )
}

export function generateNeutralPalette (primaryColor, length = 10) {
  const rgb = str2rgba(primaryColor)

  if (!rgb) return

  const hsv = rgb2hsv(rgb)
  const palette = []

  for (let i = length - 1; i >= 0; i--) {
    palette.push(
      hsv2hex({
        h: hsv.h,
        s: Math.max(0, hsv.s * 0.3 * (1 - i / (length - 1))),
        v: 5 + (90 * i / (length - 1))
      })
    )
  }

  return palette
}
