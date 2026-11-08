import { ensureFn } from '@/utils/type'
import { MuButton } from '@/components/button'
import { resolveIconEntry } from './icon'

// button 列：条目按钮列。column.buttons: Array | (record, value) => Array，按钮
// { caption?, icon?, color?, disabled? }，caption/icon 互斥、caption 优先；
// column.link: true 列级 link 形态；仅配 field 时字段值自动包装为条目（显式
// 配置优先），空组双通道统一在 compile 落占位链。
// compile 双通道：dom=false 平铺 { canvasKind: 'button', buttons, link }，绘制/
// 命中/事件派发全走 ex 侧既有 drawButton/itemHits/emitButtonItemClick；dom=true
// 直接产 MuButton 条目（恒 small；color 仅 validator 4 色内传递、超出色回退缺省
// 避免 dev warn，canvas 维持 17 色域），点击 emit 'cell-item-click'，payload
// { record, column, button } 与 canvas emitButtonItemClick 同键（DOM 无 recordIndex）

// MuButton color prop validator 清单（components/button/button.js）
const BUTTON_COLORS = ['normal', 'primary', 'secondary', 'danger']

/** 色名归一：色名 | (record) => 色名 → 非空 string，否则 'primary'。
    单一事实源：button 列 dom 通道与 ex 侧 progress/button 绘制同源消费 */
export function resolveColorName (value, record) {
  const name = typeof value === 'function' ? value(record) : value

  return typeof name === 'string' && name ? name : 'primary'
}

// dom 通道条目 attrs：MuButton props 组装。文本走 caption prop 而非 item.text
// （text 会作为默认插槽内容顶掉 MuButton 内部 slot fallback）；disabled 为
// Boolean prop，原生置灰后 click 天然不触发，与 canvas 只续链不发同口径
function buttonAttrsOf (button, hasCaption, name, { isLink, isDisabled }) {
  const { caption, icon } = button ?? {}

  return {
    size: 'small',
    ...(isLink ? { buttonStyle: 'link' } : null),
    ...(hasCaption ? { caption: String(caption) } : { icon }),
    ...(BUTTON_COLORS.includes(name) ? { color: name } : null),
    ...(isDisabled ? { disabled: true } : null)
  }
}

// dom 通道单条按钮 → MuButton 条目；无效条目（空 caption + 未注册 icon）返回
// null 由调用方过滤（判定与 canvas ellipsizeButton 一致）
function domItemOf (button, { isLink, showTitle, columnRef, record, emit }) {
  const { caption, icon, color, disabled } = button ?? {}

  const hasCaption = String(caption ?? '') !== ''

  if (!hasCaption && !resolveIconEntry(icon)) return null

  const name = resolveColorName(color, record)
  // disabled 判定同 canvas isTruthyAttr：非 null 且非 false
  const isDisabled = disabled != null && disabled !== false

  return {
    is: MuButton,
    title: showTitle && caption, // 走 table-row.vue setTitle 挂根元素
    attrs: buttonAttrsOf(button, hasCaption, name, { isLink, isDisabled }),
    events: {
      click: () => emit('cell-item-click', { record, column: columnRef, button })
    }
  }
}

// buttons 缺省包装（tag 列 valueToTags 同构）：数组对象元素原样保留（caption/
// icon/color/disabled），字符串/数字元素包 { caption: el }；非数组值包单元素
// 数组；value == null 不产条目
function valueToButtons (record, value) {
  if (value != null) {
    return Array.isArray(value)
      ? value.map(el => (el != null && typeof el === 'object' ? el : { caption: el }))
      : [{ caption: value }]
  }
}

export const ButtonColumn = {
  compile: (column, dom = false) => {
    const getButtons = ensureFn(column.buttons || valueToButtons)

    const isLink = column.link === true
    const showTitle = column.title === true
    // payload column 回原始引用：canvas prepareColumn 产物挂 _raw（ex/cell-content.js）
    const columnRef = column._raw ?? column

    return ({ record, value, emit }) => {
      // (record, value) 透传（tag getTags 同款）：函数形态可读字段值
      const buttons = getButtons(record, value) ?? []

      if (!Array.isArray(buttons) || !buttons.length) return

      // canvas 通道：产物与原 createColumnRender button 分支逐字段一致
      // （drawButton 内空组门控兜底，不绘制不命中）
      if (!dom) {
        return {
          canvasKind: 'button',
          buttons,
          link: isLink || null
        }
      }

      const options = { isLink, showTitle, columnRef, record, emit }

      return {
        class: 'mu-table__button-cell',
        items: buttons.map(button => domItemOf(button, options)).filter(Boolean)
      }
    }
  }
}
