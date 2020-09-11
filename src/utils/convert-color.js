const RGB_MAX = 255
const HUE_MAX = 360
const SV_MAX = 100

function _normalizeAngle (degrees) {
  return (degrees % 360 + 360) % 360
}

export function hex2rgb (hex) {
  const result =
    /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex) ||
    /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex)

  return result
    ? {
      r: parseInt((result[1] + result[1]).substr(0, 2), 16),
      g: parseInt((result[2] + result[2]).substr(0, 2), 16),
      b: parseInt((result[3] + result[3]).substr(0, 2), 16)
    }
    : null
}

export function rgb2hex (r, g, b) {
  r = Math.round(r).toString(16)
  g = Math.round(g).toString(16)
  b = Math.round(b).toString(16)

  r = r.length === 1 ? '0' + r : r
  g = g.length === 1 ? '0' + g : g
  b = b.length === 1 ? '0' + b : b

  return '#' + r + g + b
}

export function rgb2hsv (r, g, b) {
  // It converts [0,255] format, to [0,1]
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
        : (
          max === g
            ? (b - r) / d + 2
            : (r - g) / d + 4
        )
    ) / 6

  return {
    h: Math.round(h * HUE_MAX),
    s: Math.round(s * SV_MAX),
    v: Math.round(v * SV_MAX)
  }
}

export function hsv2rgb (h, s, v) {
  h = _normalizeAngle(h)
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

export function hsv2hex (h, s, v) {
  const { r, g, b } = hsv2rgb(h, s, v)
  return rgb2hex(r, g, b)
}
