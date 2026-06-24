import { colors, baseColorNames } from '@/colors'
import { generateNeutralPalette } from '@/utils/color.js'

const grays = generateNeutralPalette(colors.gray, { count: 10, densityFactor: 1.5 })

const palette = baseColorNames.map(name =>
  Array.from({ length: 10 }, (_, idx) => colors[`${name}${idx}`])
)

palette.push(grays)

export {
  palette
}
