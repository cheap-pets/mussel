import { colors } from '@/colors'

/**
 * mussel 色板：18 列色组 × 10 行色阶 = 180 色
 * - 12 基础色组：red/pink/grape/violet/indigo/blue/cyan/teal/green/lime/yellow/orange
 * - 6 语义色组：primary/secondary/success/warning/danger/gray
 * 同色系纵向排列：每列是一个色组（10 个色阶从浅到深），
 * 渲染为 10 行 × 18 列，同一行是所有色组的同一色阶
 */
const MUSSEL_GROUP_NAMES = [
  'red', 'pink', 'grape', 'violet', 'indigo', 'blue',
  'cyan', 'teal', 'green', 'lime', 'yellow', 'orange',
  'primary', 'secondary', 'success', 'warning', 'danger', 'gray'
]

function buildMusselGroups () {
  // groups[i] = 第 i 阶（0=最浅，9=最深），含 18 个色组的该阶颜色
  return Array.from({ length: 10 }, (_, level) => ({
    name: `level-${level}`,
    colors: MUSSEL_GROUP_NAMES.map(name => colors[`${name}${level}`])
  }))
}

export const MUSSEL_PALETTE = {
  label: 'Mussel',
  groups: buildMusselGroups()
}
