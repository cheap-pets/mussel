import { ensureFn } from '@/utils/type'
import { MuButton } from '@/components/button'
import { resolveIconEntry } from './icon'

// button 列（20261105-column-button-type）：条目按钮列，数据结构沿用 table-ex
// button 列现状——column.buttons: Array | (record, value) => Array，按钮
// { caption?, icon?, color?, disabled? }，caption/icon 互斥、caption 优先；
// column.link: true 列级 link 形态（整列统一生效，与 table-ex 同定义）。
// 仅配 field 时字段值按 tag 同口径自动包装为条目（valueToButtons 缺省包装，
// 20261106-column-link-hover-button-value；显式配置优先），空组（null/非数组/
// 空数组）双通道统一在 compile 落占位链。
// compile 双通道：
// - dom=false（mu-table-ex canvas）：平铺 { canvasKind: 'button', buttons, link }，
//   绘制/命中/事件派发全走 ex 侧既有 drawButton/itemHits/emitButtonItemClick 零改动
// - dom=true（mu-table）：条目直接产 MuButton 组件（is = 组件对象，<component :is>
//   原生支持），恒 small 尺寸；color 经 resolveColorName 归一后仅 MuButton color
//   validator 4 色内传递（超出色回退缺省形态避免 dev warn；canvas 通道维持 17 色域）；
//   点击 emit 'cell-item-click'，payload { record, column, button } 键与 canvas
//   emitButtonItemClick 一致（DOM 无 recordIndex，canvas 侧外包）

// MuButton color prop validator 清单（components/button/button.js）
const BUTTON_COLORS = ['normal', 'primary', 'secondary', 'danger']

/** 色名归一：色名 | (record) => 色名 → 非空 string，否则 'primary'。
    自 table-ex cell-painters 的 colorNameOf 原样迁移（单一事实源：button 列
    dom 通道与 ex 侧 progress/button 绘制同源消费） */
export function resolveColorName (value, record) {
  const name = typeof value === 'function' ? value(record) : value

  return typeof name === 'string' && name ? name : 'primary'
}

// dom 通道条目 attrs：MuButton props 组装（恒 small；文本走 caption prop 不用
// item.text——text 会作为默认插槽内容顶掉 MuButton 内部 slot fallback；
// color 仅 4 色内传递；disabled 为 Boolean prop，原生置灰后 click 天然不触发，
// 与 canvas disabled 只续链不发同口径）
function buttonAttrsOf (button, hasCaption, name, { isLink, isDisabled }) {
  const { caption, icon } = button ?? {}

  return {
    size: 'small', // 恒传，强制 small 尺寸（人工意见 1-1）
    ...(isLink ? { buttonStyle: 'link' } : null),
    ...(hasCaption ? { caption: String(caption) } : { icon }),
    ...(BUTTON_COLORS.includes(name) ? { color: name } : null),
    ...(isDisabled ? { disabled: true } : null)
  }
}

// dom 通道单条按钮 → MuButton 条目；无效条目（空 caption + 未注册 icon）返回 null
// 由调用方过滤。caption/icon 互斥、caption 优先（与 canvas ellipsizeButton 判定一致）
function domItemOf (button, { isLink, showTitle, columnRef, record, emit }) {
  const { caption, icon, color, disabled } = button ?? {}

  // icon-only 且 icon 未注册（dev warn 在 resolve 内）→ 跳过该条
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

// buttons 缺省包装（tag 列 valueToTags 同构，20261106-column-link-hover-button-
// value）：仅配 field 时字段值直接渲染——数组对象元素原样保留（caption/icon/
// color/disabled），字符串/数字元素包 { caption: el }；非数组值包单元素数组；
// value == null 不产条目（键名随 tag/button 现状用 caption）
function valueToButtons (record, value) {
  if (value != null) {
    return Array.isArray(value)
      ? value.map(el => (el != null && typeof el === 'object' ? el : { caption: el }))
      : [{ caption: value }]
  }
}

export const ButtonColumn = {
  compile: (column, dom = false) => {
    // buttons 显式配置（数组/函数）优先，缺省回退字段值包装
    const getButtons = ensureFn(column.buttons || valueToButtons)

    const isLink = column.link === true
    const showTitle = column.title === true
    const columnRef = column._raw ?? column

    return ({ record, value, emit }) => {
      // (record, value) 透传（tag getTags 同款）：函数形态可读字段值
      const buttons = getButtons(record, value) ?? []

      // 空组门控上提（双通道共用，原仅 dom 分支有）：canvas 空组不再产
      // canvasKind: 'button' → 落 drawDisplayText 占位链（列级/表格级 placeholder），
      // 与 DOM 通道空值落占位同口径（需2-6）
      if (!Array.isArray(buttons) || !buttons.length) return

      // canvas 通道：与原 createColumnRender button 分支产物逐字段一致
      // （drawButton 内空组门控保留作兜底，不绘制不命中）
      if (!dom) {
        return {
          canvasKind: 'button',
          buttons,
          link: isLink || null
        }
      }

      // dom 通道：MuButton 条目组
      const options = { isLink, showTitle, columnRef, record, emit }

      return {
        class: 'mu-table__button-cell',
        items: buttons.map(button => domItemOf(button, options)).filter(Boolean)
      }
    }
  }
}
