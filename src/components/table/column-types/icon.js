import { ensureFn, isString } from '@/utils/type'
import { icons } from '@/icons'
import { warn } from '@/utils/warn'

// icon 列：单图标纯展示列，value 收敛为 icons 注册名 string（不支持对象直传/
// 数组/img src）；column.color 设色（色名 | (record, value) => 色名，与 text 列
// 同契约）、iconOption.size 定尺寸（canvas 直绘 + DOM 内联 font-size 双通道生效）；
// 不可编辑（editor.js NON_EDITABLE_TYPES）、无条目点击

// iconOption.size 缺省（对齐 CHECK_SIZE，constants.js）
const DEFAULT_ICON_SIZE = 16

/** 注册名 → icons 注册表项原引用：icon 列 compile / button 图标绘制 /
    paintCellButton / isCellButtonHit 四处共用的单一查表入口。未注册 dev warn
    一次（不设负缓存——注册表可运行时 install）；返回 null 由调用方分支处理 */
export function resolveIconEntry (name) {
  if (!isString(name) || name === '') return null

  const entry = icons[name]

  if (!entry) {
    warn({
      component: 'Icon',
      message: `Invalid icon "${name}": unregistered icon name. Please register it via installIcons first.`
    })
  }

  return entry || null
}

function iconSizeOf (iconOption) {
  const n = Math.round(Number(iconOption?.size))

  return Number.isFinite(n) && n > 0 ? n : DEFAULT_ICON_SIZE
}

export const IconColumn = {
  // icon 列惯例居中（同 enum / rec_no 的类型级 align 字段）
  align: 'center',
  compile: (column, dom = false) => {
    const getColor = ensureFn(column.color)
    const size = iconSizeOf(column.iconOption)
    const showTitle = column.title === true || null

    return ({ record, value }) => {
      // 空值不 warn，落占位链（与 list 非数组同构）
      if (value == null) return

      if (!isString(value) || value === '') {
        warn({
          component: 'table',
          message: `icon 列 value 须为注册名字符串，实际类型 ${typeof value}`
        })

        return
      }

      // 查表在 render 内每次求值（不在列准备期快照）——运行时 installIcons 后即时生效
      const icon = icons[value]

      if (!icon) {
        warn({
          component: 'Icon',
          message: `Invalid icon "${value}": unregistered icon name. Please register it via installIcons first.`
        })

        return
      }

      const color = getColor(record, value) || null
      const title = showTitle && value

      if (!dom) {
        // canvas 单条目仍走 items 数组（复用 measureItem/drawItem 主干）
        return {
          items: [{
            kind: 'icon',
            icon, // 注册表项原引用 { svg?, cls?, glyph?, fontFamily?, glyphStatus?, ... }
            color, // 色名；绘制期 theme.colors 查表，未知/缺省回退 textColor
            size,
            title
          }]
        }
      }

      // DOM 条目：svg 与 cls 统一挂 mu-icon（svg 优先——同时含两者时不叠 cls 渲染
      // glyph）；size 经内联 font-size 生效（text-{color}/mu-icon 的 1em 随之）
      return {
        class: 'mu-table__icon-cell',
        items: [{
          is: 'span',
          text: null,
          title,
          attrs: {
            class: ['mu-icon', icon.svg ? null : icon.cls, color && `text-${color}`],
            style: [{ fontSize: `${size}px` }],
            ...(icon.svg ? { innerHTML: icon.svg } : null) // 无 svg（cls 形态）省略键
          },
          events: {}
        }]
      }
    }
  }
}
